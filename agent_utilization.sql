-- Agent utilization metrics (15-minute buckets) - complete
-- Schema: firstam.eg_assist_cw_distributed  (swap schema for other tenants)
--
-- loginTime  = seconds between Login and Logout (inclusive of mid-session Offline)
-- breakTime  = Unavailable/Offline seconds that fall strictly between Login and Logout
-- Offline after Logout is excluded from both loginTime and breakTime.
--
-- firstam status labels (from sample): login, available, busy, offline
--   - Session starts on explicit login* OR available/online/active after offline
--   - available counts as active (not online/Active)
--   - Only explicit logout* closes the window; open sessions end at now()
--
-- Do not put Jinja braces in this file; query runners treat them as parameters.

SELECT *
FROM (
    WITH
    ------------------------------------------------------------------------
    -- Agent status events
    ------------------------------------------------------------------------
    agent_status_events AS (
        SELECT
            EventId AS event_id,
            EventUniqueId AS event_unique_id,
            -- Normalize epochs to Int64 so multiIf/least/lead defaults share one type
            toInt64(EventTimeStampEpoch) AS event_timestamp_epoch,
            ClientOrg AS client_id,
            EventValue6 AS agent_id,
            ifNull(EventValue1, 'default') AS account_id,
            EventValue7 AS agent_name,
            EventValue4 AS agent_email,
            EventValue5 AS agent_current_status,
            lowerUTF8(trimBoth(ifNull(EventValue5, ''))) AS status_norm,
            EventValue12 AS agent_previous_status,
            lowerUTF8(trimBoth(ifNull(EventValue12, ''))) AS previous_status_norm,
            EventValue9 AS team_name,
            EventValue8 AS team_id,
            -- Session start:
            --   1) explicit login labels
            --   2) available/online/active when previous was offline/unavailable
            --      (firstam often emits available after offline without a login event)
            if(
                lowerUTF8(trimBoth(ifNull(EventValue5, ''))) IN (
                    'login', 'logged in', 'loggedin', 'logged_in'
                )
                OR (
                    lowerUTF8(trimBoth(ifNull(EventValue5, ''))) IN (
                        'available', 'online', 'active'
                    )
                    AND lowerUTF8(trimBoth(ifNull(EventValue12, ''))) IN (
                        'offline', 'unavailable'
                    )
                ),
                1,
                0
            ) AS is_login,
            -- Only explicit logout ends the window (offline is NOT logout).
            if(
                lowerUTF8(trimBoth(ifNull(EventValue5, ''))) IN (
                    'logout', 'logged out', 'loggedout', 'logged_out'
                ),
                1,
                0
            ) AS is_logout
        FROM firstam.eg_assist_cw_distributed
        WHERE EventName = 'AGENT_STATUS'
          AND EventValue6 IS NOT NULL
          AND EventValue6 != ''
          AND toInt64(EventTimeStampEpoch) >= toInt64(toUnixTimestamp(now() - toIntervalDay(60))) * 1000
    ),

    agent_status_events_dedup AS (
        SELECT *
        FROM agent_status_events
        ORDER BY event_timestamp_epoch DESC
        LIMIT 1 BY event_unique_id
    ),

    agent_sessions AS (
        SELECT
            *,
            sum(is_login) OVER (
                PARTITION BY client_id, account_id, agent_id
                ORDER BY event_timestamp_epoch ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS session_number
        FROM agent_status_events_dedup
    ),

    -- Drop pre-login rows. Login window starts at first session-start event.
    agent_session_ids AS (
        SELECT
            concat(client_id, '-', account_id, '-', agent_id, '-', toString(session_number)) AS agent_session_id,
            event_id,
            event_unique_id,
            event_timestamp_epoch,
            client_id,
            agent_id,
            account_id,
            agent_name,
            agent_email,
            agent_current_status,
            status_norm,
            agent_previous_status,
            previous_status_norm,
            team_name,
            team_id,
            is_login,
            is_logout,
            session_number
        FROM agent_sessions
        WHERE session_number > 0
    ),

    -- First Logout closes the login window for utilization seconds.
    -- minIf returns 0 when no logout exists; nullIf so open sessions are not clipped to 0.
    agent_session_logout AS (
        SELECT
            agent_session_id,
            nullIf(minIf(event_timestamp_epoch, is_logout = 1), toInt64(0)) AS logout_epoch
        FROM agent_session_ids
        GROUP BY agent_session_id
    ),

    -- One window per login session for conversation attribution.
    agent_session_windows AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            session_start_epoch,
            leadInFrame(session_start_epoch, 1, toInt64(0)) OVER (
                PARTITION BY client_id, account_id, agent_id
                ORDER BY session_start_epoch ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS next_session_start_epoch
        FROM (
            SELECT
                agent_session_id,
                client_id,
                account_id,
                agent_id,
                min(event_timestamp_epoch) AS session_start_epoch
            FROM agent_session_ids
            GROUP BY agent_session_id, client_id, account_id, agent_id
        )
    ),

    -- Status segments clipped to [Login, Logout). Open last segment ends at now().
    agent_status_segments_filtered AS (
        SELECT
            s.agent_session_id,
            s.client_id,
            s.account_id,
            s.agent_id,
            s.team_id,
            s.segment_start_epoch,
            multiIf(
                lo.logout_epoch IS NOT NULL
                    AND (s.segment_end_epoch_raw = toInt64(0) OR s.segment_end_epoch_raw > lo.logout_epoch),
                lo.logout_epoch,
                s.segment_end_epoch_raw = toInt64(0),
                toInt64(toUnixTimestamp(now())) * toInt64(1000),
                s.segment_end_epoch_raw
            ) AS segment_end_epoch,
            s.agent_current_status,
            s.status_norm
        FROM (
            SELECT
                agent_session_id,
                client_id,
                account_id,
                agent_id,
                team_id,
                event_timestamp_epoch AS segment_start_epoch,
                leadInFrame(event_timestamp_epoch, 1, toInt64(0)) OVER (
                    PARTITION BY agent_session_id
                    ORDER BY event_timestamp_epoch ASC
                    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                ) AS segment_end_epoch_raw,
                agent_current_status,
                status_norm
            FROM agent_session_ids
        ) AS s
        LEFT JOIN agent_session_logout AS lo
            ON s.agent_session_id = lo.agent_session_id
        WHERE (lo.logout_epoch IS NULL OR s.segment_start_epoch < lo.logout_epoch)
    ),

    agent_status_segments_valid AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            segment_start_epoch,
            least(
                segment_end_epoch,
                segment_start_epoch + toInt64(86400000)
            ) AS segment_end_epoch,
            agent_current_status,
            status_norm
        FROM agent_status_segments_filtered
        WHERE segment_end_epoch IS NOT NULL
          AND segment_end_epoch > segment_start_epoch
    ),

    ------------------------------------------------------------------------
    -- Conversation / interaction events
    ------------------------------------------------------------------------
    conversation_events AS (
        SELECT
            EventId AS event_id,
            EventUniqueId AS event_unique_id,
            EventName AS event_name,
            toInt64(EventTimeStampEpoch) AS event_timestamp_epoch,
            ClientOrg AS client_id,
            EventValue6 AS agent_id,
            ConversationId AS conversation_id,
            InteractionId AS interaction_id,
            ifNull(EventValue1, 'default') AS account_id,
            EventValue8 AS team_id,
            EventValue3 AS queue_id,
            EventValue4 AS queue_name
        FROM firstam.eg_assist_cw_distributed
        WHERE (
                (EventName = 'AGENT_ASSIGNED' AND EventValue15 = 'assigned')
                OR EventName IN (
                    'CONVERSATION_UPDATED',
                    'CONVERSATION_STATUS_CHANGED',
                    'CONVERSATION_ENDED'
                )
            )
          AND EventValue6 IS NOT NULL
          AND EventValue6 != ''
          AND toInt64(EventTimeStampEpoch) >= toInt64(toUnixTimestamp(now() - toIntervalDay(60))) * 1000
    ),

    conversation_events_dedup AS (
        SELECT *
        FROM conversation_events
        ORDER BY event_timestamp_epoch DESC
        LIMIT 1 BY event_unique_id
    ),

    conversation_with_session AS (
        SELECT
            c.event_id,
            c.event_unique_id,
            c.event_name,
            c.event_timestamp_epoch,
            c.client_id,
            c.agent_id,
            c.conversation_id,
            c.interaction_id,
            c.account_id,
            c.team_id,
            c.queue_id,
            c.queue_name,
            a.agent_session_id
        FROM conversation_events_dedup AS c
        INNER JOIN agent_session_windows AS a
            ON c.client_id = a.client_id
           AND c.account_id = a.account_id
           AND c.agent_id = a.agent_id
           AND a.session_start_epoch <= c.event_timestamp_epoch
           AND c.event_timestamp_epoch < if(
                a.next_session_start_epoch = toInt64(0),
                c.event_timestamp_epoch + toInt64(86400000),
                a.next_session_start_epoch
            )
    ),

    interaction_sessions_filtered AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            conversation_id,
            interaction_id,
            queue_id,
            queue_name,
            team_id,
            interaction_start_epoch,
            least(
                interaction_end_epoch,
                interaction_start_epoch + toInt64(86400000)
            ) AS interaction_end_epoch,
            participant_role
        FROM (
            SELECT
                agent_session_id,
                client_id,
                account_id,
                agent_id,
                conversation_id,
                interaction_id,
                queue_id,
                queue_name,
                team_id,
                minIf(
                    event_timestamp_epoch,
                    event_name IN ('AGENT_ASSIGNED', 'CONVERSATION_UPDATED')
                ) AS interaction_start_epoch,
                maxIf(
                    event_timestamp_epoch,
                    event_name IN ('CONVERSATION_ENDED', 'CONVERSATION_STATUS_CHANGED')
                ) AS interaction_end_epoch,
                multiIf(
                    countIf(event_name = 'AGENT_ASSIGNED') > 0,
                    'OWNER',
                    countIf(event_name IN ('CONVERSATION_UPDATED', 'CONVERSATION_ENDED')) > 0,
                    'OWNER',
                    'PARTICIPANT'
                ) AS participant_role
            FROM conversation_with_session
            WHERE agent_session_id IS NOT NULL
            GROUP BY
                agent_session_id,
                client_id,
                account_id,
                agent_id,
                conversation_id,
                interaction_id,
                queue_id,
                queue_name,
                team_id
        )
        WHERE interaction_start_epoch IS NOT NULL
          AND interaction_end_epoch IS NOT NULL
          AND interaction_end_epoch > interaction_start_epoch
    ),

    ------------------------------------------------------------------------
    -- Second-level expansion (required for concurrency-aware metrics)
    ------------------------------------------------------------------------
    agent_status_seconds AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            agent_current_status,
            status_norm,
            second_epoch,
            intDiv(second_epoch, 900) * 900 AS time_bucket_start
        FROM agent_status_segments_valid
        ARRAY JOIN range(
            toUInt64(intDiv(segment_start_epoch, 1000)),
            toUInt64(intDiv(segment_end_epoch, 1000))
        ) AS second_epoch
    ),

    interaction_seconds AS (
        SELECT
            agent_session_id,
            interaction_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            queue_id,
            queue_name,
            participant_role,
            second_epoch,
            intDiv(second_epoch, 900) * 900 AS time_bucket_start
        FROM interaction_sessions_filtered
        ARRAY JOIN range(
            toUInt64(intDiv(interaction_start_epoch, 1000)),
            toUInt64(intDiv(interaction_end_epoch, 1000))
        ) AS second_epoch
    ),

    interaction_concurrency AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            queue_id,
            queue_name,
            participant_role,
            second_epoch,
            time_bucket_start,
            uniqExact(interaction_id) AS concurrent_conversations
        FROM interaction_seconds
        GROUP BY
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            queue_id,
            queue_name,
            participant_role,
            second_epoch,
            time_bucket_start
    ),

    status_with_concurrency AS (
        SELECT
            ass.agent_session_id AS agent_session_id,
            ass.client_id AS client_id,
            ass.account_id AS account_id,
            ass.agent_id AS agent_id,
            ass.team_id AS team_id,
            ass.agent_current_status AS agent_current_status,
            ass.status_norm AS status_norm,
            ass.second_epoch AS second_epoch,
            ass.time_bucket_start AS time_bucket,
            ic.queue_id AS queue_id,
            ic.participant_role AS participant_role,
            ifNull(ic.concurrent_conversations, 0) AS concurrent_conversations
        FROM agent_status_seconds AS ass
        LEFT JOIN interaction_concurrency AS ic
            ON ass.agent_session_id = ic.agent_session_id
           AND ass.second_epoch = ic.second_epoch
           AND ass.time_bucket_start = ic.time_bucket_start
    ),

    bucket_metrics_by_queue_role AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            ifNull(queue_id, 'N/A') AS queue,
            ifNull(participant_role, 'N/A') AS role,
            time_bucket,
            uniqExact(second_epoch) AS login_time,
            uniqExactIf(
                second_epoch,
                status_norm IN ('unavailable', 'offline')
            ) AS break_time,
            uniqExactIf(
                second_epoch,
                status_norm IN ('busy', 'passive')
            ) AS busy_time,
            -- firstam uses "available" (not online/Active)
            uniqExactIf(
                second_epoch,
                status_norm IN (
                    'available', 'online', 'active',
                    'login', 'logged in', 'loggedin', 'logged_in'
                )
            ) AS active_time,
            uniqExactIf(
                second_epoch,
                (concurrent_conversations > 0) AND (participant_role = 'OWNER')
            ) AS chat_time,
            uniqExactIf(second_epoch, concurrent_conversations > 0) AS engage_time,
            sum(concurrent_conversations) AS handle_time,
            uniqExactIf(second_epoch, concurrent_conversations > 1) AS multiple_chat_time,
            max(concurrent_conversations) AS max_concurrency,
            uniqExactIf(
                second_epoch,
                (status_norm IN ('unavailable', 'offline', 'busy', 'passive'))
                    AND (concurrent_conversations > 0)
            ) AS time_not_available_but_chatting,
            uniqExactIf(
                second_epoch,
                (status_norm IN (
                    'available', 'online', 'active',
                    'login', 'logged in', 'loggedin', 'logged_in'
                ))
                    AND (concurrent_conversations = 0)
            ) AS time_available_but_not_chatting
        FROM status_with_concurrency
        GROUP BY
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            queue,
            role,
            time_bucket
    ),

    bucket_metrics_overall AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            queue_id AS queue,
            'Overall' AS role,
            time_bucket,
            uniqExact(second_epoch) AS login_time,
            uniqExactIf(
                second_epoch,
                status_norm IN ('unavailable', 'offline')
            ) AS break_time,
            uniqExactIf(
                second_epoch,
                status_norm IN ('busy', 'passive')
            ) AS busy_time,
            uniqExactIf(
                second_epoch,
                status_norm IN (
                    'available', 'online', 'active',
                    'login', 'logged in', 'loggedin', 'logged_in'
                )
            ) AS active_time,
            uniqExactIf(
                second_epoch,
                (concurrent_conversations > 0) AND (participant_role = 'OWNER')
            ) AS actual_chat_time,
            uniqExactIf(second_epoch, concurrent_conversations > 0) AS engage_time,
            sumIf(concurrent_conversations, participant_role = 'OWNER') AS handle_time,
            uniqExactIf(
                second_epoch,
                (concurrent_conversations > 0) AND (participant_role = 'OWNER')
            ) AS engage_time_without_wrap,
            uniqExactIf(
                second_epoch,
                (concurrent_conversations > 1) AND (participant_role = 'OWNER')
            ) AS multiple_chat_time,
            maxIf(concurrent_conversations, participant_role = 'OWNER') AS max_concurrency,
            uniqExactIf(
                second_epoch,
                (status_norm IN ('unavailable', 'offline', 'busy', 'passive'))
                    AND (concurrent_conversations > 0)
                    AND (participant_role = 'OWNER')
            ) AS time_not_available_but_chatting,
            uniqExactIf(
                second_epoch,
                (status_norm IN (
                    'available', 'online', 'active',
                    'login', 'logged in', 'loggedin', 'logged_in'
                ))
                    AND (concurrent_conversations = 0)
            ) AS time_available_but_not_chatting,
            0 AS wrapup_time
        FROM status_with_concurrency
        GROUP BY
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            queue,
            time_bucket
    ),

    all_utilization_metrics AS (
        SELECT
            concat(agent_session_id, '$$', toString(time_bucket), '$$', queue, '$$', role) AS id,
            agent_session_id,
            client_id AS clientId,
            agent_id AS agentId,
            team_id AS teamId,
            'agent_utilization' AS reportName,
            'ByQueueRole' AS type,
            queue,
            role,
            time_bucket AS timeBucket,
            login_time AS loginTime,
            break_time AS breakTime,
            busy_time AS busyTime,
            engage_time AS engageTime,
            handle_time AS handleTime,
            chat_time AS chatTime,
            0 AS wrapupTime,
            time_not_available_but_chatting AS timeNotAvailableButChatting,
            time_available_but_not_chatting AS timeAvailableButNotChatting,
            chat_time AS engageTimeWithoutWrap,
            chat_time AS actualChatTime,
            multiple_chat_time AS multipleChatTime,
            max_concurrency AS maxConcurrency,
            now() AS recordCreationTimestamp,
            now64(3) AS inserted_at
        FROM bucket_metrics_by_queue_role

        UNION ALL

        SELECT
            concat(agent_session_id, '$$', toString(time_bucket)) AS id,
            agent_session_id,
            client_id AS clientId,
            agent_id AS agentId,
            team_id AS teamId,
            'agent_utilization' AS reportName,
            'OverAll' AS type,
            queue,
            role,
            time_bucket AS timeBucket,
            login_time AS loginTime,
            break_time AS breakTime,
            busy_time AS busyTime,
            engage_time AS engageTime,
            handle_time AS handleTime,
            actual_chat_time AS chatTime,
            wrapup_time AS wrapupTime,
            time_not_available_but_chatting AS timeNotAvailableButChatting,
            time_available_but_not_chatting AS timeAvailableButNotChatting,
            engage_time_without_wrap AS engageTimeWithoutWrap,
            actual_chat_time AS actualChatTime,
            multiple_chat_time AS multipleChatTime,
            max_concurrency AS maxConcurrency,
            now() AS recordCreationTimestamp,
            now64(3) AS inserted_at
        FROM bucket_metrics_overall
    )

    SELECT *
    FROM all_utilization_metrics
    ORDER BY timeBucket DESC
)
