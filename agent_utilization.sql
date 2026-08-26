-- Agent utilization metrics (15-minute buckets)
-- loginTime  = seconds between Login and Logout (inclusive of mid-session Offline)
-- breakTime  = Unavailable/Offline seconds that fall strictly between Login and Logout
-- Offline after Logout is excluded from both loginTime and breakTime.

SELECT *
FROM (
    WITH agent_status_events AS (
        SELECT
            EventId AS event_id,
            EventUniqueId AS event_unique_id,
            EventName AS event_name,
            EventTimeStampEpoch AS event_timestamp_epoch,
            ClientOrg AS client_id,
            EventValue6 AS agent_id,
            EventValue1 AS account_id,
            EventValue7 AS agent_name,
            EventValue4 AS agent_email,
            EventValue5 AS agent_current_status,
            EventValue6 AS agent_previous_status,
            EventValue9 AS team_name,
            EventValue8 AS team_id
        FROM {{ params.client_schema }}.eg_assist_cw_distributed
        WHERE (EventName = 'AGENT_STATUS')
          AND (EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000))
    ),

    agent_status_events_dedup AS (
        SELECT *
        FROM (
            SELECT
                *,
                row_number() OVER (
                    PARTITION BY event_unique_id
                    ORDER BY event_timestamp_epoch DESC
                ) AS rn
            FROM agent_status_events
        )
        WHERE rn = 1
    ),

    -- Login starts a session. Only explicit Logout ends the login window.
    -- Mid-session Offline is NOT a logout (it counts toward loginTime + breakTime).
    agent_session_boundaries AS (
        SELECT
            *,
            if(agent_current_status IN ('Login', 'online'), 1, 0) AS is_login,
            if(agent_current_status = 'Logout', 1, 0) AS is_logout
        FROM agent_status_events_dedup
    ),

    agent_sessions AS (
        SELECT
            *,
            sum(is_login) OVER (
                PARTITION BY client_id, ifNull(account_id, 'default'), agent_id
                ORDER BY event_timestamp_epoch ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS session_number
        FROM agent_session_boundaries
    ),

    -- Drop pre-login events (session_number = 0). Login window starts at first Login/online.
    agent_session_ids AS (
        SELECT
            concat(
                client_id,
                '-',
                ifNull(account_id, 'default'),
                '-',
                agent_id,
                '-',
                toString(session_number)
            ) AS agent_session_id,
            *
        FROM agent_sessions
        WHERE session_number > 0
    ),

    -- First Logout in the session closes the login window.
    agent_session_logout AS (
        SELECT
            agent_session_id,
            minIf(event_timestamp_epoch, is_logout = 1) AS logout_epoch
        FROM agent_session_ids
        GROUP BY agent_session_id
    ),

    agent_session_boundaries_with_end AS (
        SELECT
            agent_session_id,
            client_id,
            ifNull(account_id, 'default') AS account_id,
            agent_id,
            event_timestamp_epoch AS session_event_epoch,
            leadInFrame(event_timestamp_epoch, 1, 0) OVER (
                PARTITION BY client_id, ifNull(account_id, 'default'), agent_id
                ORDER BY event_timestamp_epoch ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS next_session_event_epoch
        FROM agent_session_ids
    ),

    agent_session_groups AS (
        SELECT
            agent_session_id,
            client_id,
            ifNull(account_id, 'default') AS account_id,
            agent_id,
            team_id,
            groupArray((
                event_id,
                event_timestamp_epoch,
                agent_current_status,
                agent_previous_status
            )) AS status_events
        FROM agent_session_ids
        GROUP BY agent_session_id, client_id, account_id, agent_id, team_id
    ),

    agent_status_segments AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            event_timestamp_epoch AS segment_start_epoch,
            leadInFrame(event_timestamp_epoch, 1, 0) OVER (
                PARTITION BY agent_session_id
                ORDER BY event_timestamp_epoch ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS segment_end_epoch,
            agent_current_status
        FROM agent_session_ids
    ),

    -- Keep only segments inside [Login, Logout). Clip open/next ends at logout_epoch.
    -- Post-Logout Offline (and any other post-logout status) is excluded.
    agent_status_segments_filtered AS (
        SELECT
            seg.agent_session_id AS agent_session_id,
            seg.client_id AS client_id,
            seg.account_id AS account_id,
            seg.agent_id AS agent_id,
            seg.team_id AS team_id,
            seg.segment_start_epoch AS segment_start_epoch,
            multiIf(
                lo.logout_epoch IS NOT NULL
                    AND (seg.segment_end_epoch = 0 OR seg.segment_end_epoch > lo.logout_epoch),
                lo.logout_epoch,
                seg.segment_end_epoch
            ) AS segment_end_epoch,
            seg.agent_current_status AS agent_current_status
        FROM agent_status_segments AS seg
        LEFT JOIN agent_session_logout AS lo
            ON seg.agent_session_id = lo.agent_session_id
        WHERE (lo.logout_epoch IS NULL OR seg.segment_start_epoch < lo.logout_epoch)
          AND multiIf(
                lo.logout_epoch IS NOT NULL
                    AND (seg.segment_end_epoch = 0 OR seg.segment_end_epoch > lo.logout_epoch),
                lo.logout_epoch,
                seg.segment_end_epoch
            ) IS NOT NULL
          AND multiIf(
                lo.logout_epoch IS NOT NULL
                    AND (seg.segment_end_epoch = 0 OR seg.segment_end_epoch > lo.logout_epoch),
                lo.logout_epoch,
                seg.segment_end_epoch
            ) != 0
    ),

    conversation_events AS (
        SELECT
            EventId AS event_id,
            EventUniqueId AS event_unique_id,
            EventName AS event_name,
            EventTimeStampEpoch AS event_timestamp_epoch,
            ClientOrg AS client_id,
            coalesce(
                EventValue6,
                JSONExtractString(data, 'AgentId'),
                JSONExtractString(data, 'assignee', 'id')
            ) AS agent_id,
            ConversationId AS conversation_id,
            InteractionId AS interaction_id,
            EventValue1 AS account_id,
            EventValue8 AS team_id,
            EventValue3 AS queue_id,
            EventValue4 AS queue_name
        FROM {{ params.client_schema }}.eg_assist_cw_distributed
        WHERE (
                ((EventName = 'AGENT_ASSIGNED') AND (EventValue15 = 'assigned'))
                OR (EventName IN (
                    'CONVERSATION_UPDATED',
                    'CONVERSATION_STATUS_CHANGED',
                    'CONVERSATION_ENDED'
                ))
            )
          AND (EventValue6 IS NOT NULL)
          AND (EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000))
    ),

    conversation_events_dedup AS (
        SELECT *
        FROM (
            SELECT
                *,
                row_number() OVER (
                    PARTITION BY event_unique_id
                    ORDER BY event_timestamp_epoch DESC
                ) AS rn
            FROM conversation_events
        )
        WHERE rn = 1
    ),

    conversation_session_candidates AS (
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
            a.agent_session_id,
            a.session_event_epoch,
            row_number() OVER (
                PARTITION BY c.event_id
                ORDER BY a.session_event_epoch DESC
            ) AS session_rank
        FROM conversation_events_dedup AS c
        CROSS JOIN agent_session_boundaries_with_end AS a
        WHERE (c.client_id = a.client_id)
          AND (ifNull(c.account_id, 'default') = a.account_id)
          AND (c.agent_id = a.agent_id)
          AND (a.session_event_epoch <= c.event_timestamp_epoch)
          AND (
                c.event_timestamp_epoch < if(
                    a.next_session_event_epoch = 0,
                    c.event_timestamp_epoch + 86400000,
                    a.next_session_event_epoch
                )
            )
    ),

    conversation_with_session AS (
        SELECT
            event_id,
            event_unique_id,
            event_name,
            event_timestamp_epoch,
            client_id,
            agent_id,
            conversation_id,
            interaction_id,
            account_id,
            team_id,
            queue_id,
            queue_name,
            agent_session_id
        FROM conversation_session_candidates
        WHERE session_rank = 1
    ),

    interaction_sessions AS (
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
                (event_name = 'AGENT_ASSIGNED') OR (event_name = 'CONVERSATION_UPDATED')
            ) AS interaction_start_epoch,
            maxIf(
                event_timestamp_epoch,
                event_name IN ('CONVERSATION_ENDED', 'CONVERSATION_STATUS_CHANGED')
            ) AS interaction_end_epoch,
            maxIf(1, event_name = 'CONVERSATION_ENDED') AS is_disposed,
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
        HAVING interaction_start_epoch IS NOT NULL
    ),

    interaction_sessions_filtered AS (
        SELECT *
        FROM interaction_sessions
        WHERE (interaction_end_epoch IS NOT NULL)
          AND (interaction_end_epoch >= interaction_start_epoch)
    ),

    -- Seconds inside the Login→Logout window only (post-logout Offline excluded upstream).
    agent_status_seconds AS (
        SELECT
            agent_session_id,
            client_id,
            account_id,
            agent_id,
            team_id,
            agent_current_status,
            second_epoch,
            intDiv(second_epoch, 900) * 900 AS time_bucket_start
        FROM agent_status_segments_filtered
        ARRAY JOIN range(
            toUInt64(floor(segment_start_epoch / 1000)),
            toUInt64(floor(segment_end_epoch / 1000))
        ) AS second_epoch
        WHERE ((segment_end_epoch - segment_start_epoch) / 1000) < 86400
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
            conversation_id,
            second_epoch,
            intDiv(second_epoch, 900) * 900 AS time_bucket_start
        FROM interaction_sessions_filtered
        ARRAY JOIN range(
            toUInt64(floor(interaction_start_epoch / 1000)),
            toUInt64(floor(interaction_end_epoch / 1000))
        ) AS second_epoch
        WHERE ((interaction_end_epoch - interaction_start_epoch) / 1000) < 86400
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
            uniq(interaction_id) AS concurrent_conversations
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

    bucket_metrics_by_queue_role AS (
        SELECT
            ass.agent_session_id AS agent_session_id,
            ass.client_id AS client_id,
            ass.account_id AS account_id,
            ass.agent_id AS agent_id,
            ass.team_id AS team_id,
            ifNull(ic.queue_id, 'N/A') AS queue,
            ifNull(ic.participant_role, 'N/A') AS role,
            ass.time_bucket_start AS time_bucket,
            -- loginTime: all seconds between Login and Logout
            uniq(ass.second_epoch) AS login_time,
            -- breakTime: Offline/Unavailable only while still logged in
            uniqIf(
                ass.second_epoch,
                ass.agent_current_status IN ('Unavailable', 'offline')
            ) AS break_time,
            uniqIf(
                ass.second_epoch,
                ass.agent_current_status IN ('busy', 'Passive')
            ) AS busy_time,
            uniqIf(
                ass.second_epoch,
                ass.agent_current_status IN ('online', 'Active')
            ) AS active_time,
            uniqIf(
                ic.second_epoch,
                (ic.concurrent_conversations > 0) AND (ic.participant_role = 'OWNER')
            ) AS chat_time,
            uniqIf(ic.second_epoch, ic.concurrent_conversations > 0) AS engage_time,
            sum(ifNull(ic.concurrent_conversations, 0)) AS handle_time,
            uniqIf(ic.second_epoch, ic.concurrent_conversations > 1) AS multiple_chat_time,
            max(ifNull(ic.concurrent_conversations, 0)) AS max_concurrency,
            uniqIf(
                ass.second_epoch,
                (ass.agent_current_status IN ('Unavailable', 'offline', 'busy', 'Passive'))
                    AND (ic.concurrent_conversations > 0)
            ) AS time_not_available_but_chatting,
            uniqIf(
                ass.second_epoch,
                (ass.agent_current_status IN ('online', 'Active'))
                    AND (ifNull(ic.concurrent_conversations, 0) = 0)
            ) AS time_available_but_not_chatting
        FROM agent_status_seconds AS ass
        LEFT JOIN interaction_concurrency AS ic
            ON (ass.agent_session_id = ic.agent_session_id)
           AND (ass.second_epoch = ic.second_epoch)
           AND (ass.time_bucket_start = ic.time_bucket_start)
        GROUP BY
            ass.agent_session_id,
            ass.client_id,
            ass.account_id,
            ass.agent_id,
            ass.team_id,
            queue,
            role,
            time_bucket
    ),

    bucket_metrics_overall AS (
        SELECT
            ass.agent_session_id AS agent_session_id,
            ass.client_id AS client_id,
            ass.account_id AS account_id,
            ass.agent_id AS agent_id,
            ass.team_id AS team_id,
            ic.queue_id AS queue,
            'Overall' AS role,
            ass.time_bucket_start AS time_bucket,
            -- loginTime: all seconds between Login and Logout
            uniq(ass.second_epoch) AS login_time,
            -- breakTime: Offline/Unavailable only while still logged in
            uniqIf(
                ass.second_epoch,
                ass.agent_current_status IN ('Unavailable', 'offline')
            ) AS break_time,
            uniqIf(
                ass.second_epoch,
                ass.agent_current_status IN ('busy', 'Passive')
            ) AS busy_time,
            uniqIf(
                ass.second_epoch,
                ass.agent_current_status IN ('online', 'Active')
            ) AS active_time,
            uniqIf(
                ic.second_epoch,
                (ic.concurrent_conversations > 0) AND (ic.participant_role = 'OWNER')
            ) AS actual_chat_time,
            uniqIf(ic.second_epoch, ic.concurrent_conversations > 0) AS engage_time,
            sumIf(ic.concurrent_conversations, ic.participant_role = 'OWNER') AS handle_time,
            uniqIf(
                ic.second_epoch,
                (ic.concurrent_conversations > 0) AND (ic.participant_role = 'OWNER')
            ) AS engage_time_without_wrap,
            uniqIf(
                ic.second_epoch,
                (ic.concurrent_conversations > 1) AND (ic.participant_role = 'OWNER')
            ) AS multiple_chat_time,
            maxIf(ic.concurrent_conversations, ic.participant_role = 'OWNER') AS max_concurrency,
            uniqIf(
                ass.second_epoch,
                (ass.agent_current_status IN ('Unavailable', 'offline', 'busy', 'Passive'))
                    AND (ic.concurrent_conversations > 0)
                    AND (ic.participant_role = 'OWNER')
            ) AS time_not_available_but_chatting,
            uniqIf(
                ass.second_epoch,
                (ass.agent_current_status IN ('online', 'Active'))
                    AND (ifNull(ic.concurrent_conversations, 0) = 0)
            ) AS time_available_but_not_chatting,
            0 AS wrapup_time
        FROM agent_status_seconds AS ass
        LEFT JOIN interaction_concurrency AS ic
            ON (ass.agent_session_id = ic.agent_session_id)
           AND (ass.second_epoch = ic.second_epoch)
           AND (ass.time_bucket_start = ic.time_bucket_start)
        GROUP BY
            ass.agent_session_id,
            ass.client_id,
            ass.account_id,
            ass.agent_id,
            ass.team_id,
            queue,
            time_bucket
    ),

    all_utilization_metrics AS (
        SELECT
            concat(
                agent_session_id,
                '$$',
                toString(time_bucket),
                '$$',
                queue,
                '$$',
                role
            ) AS id,
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
    WHERE toDate(fromUnixTimestamp(timeBucket)) >= toDate('{{ params.cutoff_date }}')
    ORDER BY timeBucket DESC
)
