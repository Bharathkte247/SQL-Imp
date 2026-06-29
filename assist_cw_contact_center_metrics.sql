-- Hourly assist-cw contact center metrics plus agentic_runtime engagement metrics.
-- Includes volume comparison: last hour vs average of the prior 7 hours.
-- assist-cw: columbia.all_events (EventGroup = assist-cw), bucketed by InteractionId start time.
-- agentic_runtime: tfsdemo.all_events (EventGroup = agentic_runtime), bucketed by conversation start time.
WITH
    events AS (
        SELECT
            ConversationId,
            InteractionId,
            EventId,
            EventGroup,
            EventName,
            parseDateTimeBestEffortOrNull(EventTimeStampISO) AS EventDateTime,
            EventValue1,
            EventValue2,
            EventValue3,
            EventValue4,
            EventValue5,
            EventKey1,
            EventKey2,
            EventKey3,
            EventKey4,
            EventKey5,
            ClientId,
            ChannelId,
            VisitorId
        FROM tfsdemo.all_events
        WHERE EventGroup = 'agentic_runtime'
    ),

    conv_bounds AS (
        SELECT
            ConversationId,
            argMinIf(toNullable(ClientId), EventDateTime, isNotNull(ClientId) AND isNotNull(EventDateTime)) AS client_id,
            argMinIf(toNullable(ChannelId), EventDateTime, isNotNull(ChannelId) AND isNotNull(EventDateTime)) AS channel_id,
            argMinIf(toNullable(VisitorId), EventDateTime, isNotNull(VisitorId) AND isNotNull(EventDateTime)) AS visitor_id,
            minIf(EventDateTime, EventName = 'CONVERSATION_STARTED' AND isNotNull(EventDateTime)) AS conversation_start_time,
            maxIf(EventDateTime, EventName = 'CONVERSATION_ENDED' AND isNotNull(EventDateTime)) AS conversation_end_time,
            max(EventDateTime) AS last_event_time
        FROM events
        WHERE ConversationId IS NOT NULL
        GROUP BY ConversationId
    ),

    engagement_details AS (
        SELECT
            ConversationId,
            countIf(EventName = 'MESSAGE_SENT' AND lower(ifNull(EventValue2, '')) = 'customer') > 0 AS is_engaged,
            countIf(EventName = 'REQUESTED_FOR_CONSULTATION') > 0 AS is_transferred,
            countIf(EventName = 'REQUESTED_FOR_CONSULTATION') AS RequestCount,
            minIf(EventDateTime, EventName = 'REQUESTED_FOR_CONSULTATION' AND isNotNull(EventDateTime)) AS escalation_time,
            minIf(EventDateTime, EventName = 'AGENT_CONNECTED' AND isNotNull(EventDateTime)) AS agent_connected_time,
            maxIf(EventDateTime, EventName = 'AGENT_DISCONNECTED' AND isNotNull(EventDateTime)) AS agent_disconnected_time
        FROM events
        WHERE ConversationId IS NOT NULL
        GROUP BY ConversationId
    ),

    finalselect AS (
        SELECT
            ed.ConversationId,
            cb.client_id,
            cb.channel_id,
            cb.visitor_id,
            cb.conversation_start_time,
            cb.conversation_end_time,
            cb.last_event_time,
            ed.is_engaged,
            ed.is_transferred,
            ed.RequestCount,
            ed.escalation_time,
            ed.agent_connected_time,
            ed.agent_disconnected_time
        FROM engagement_details AS ed
        LEFT JOIN conv_bounds AS cb
            ON ed.ConversationId = cb.ConversationId
    ),

    agentic_hourly AS (
        SELECT
            toStartOfHour(conversation_start_time) AS hour_start,
            count(ConversationId) AS conversationcount,
            sum(RequestCount) AS TotalAgentrequest
        FROM finalselect
        WHERE conversation_start_time IS NOT NULL
        GROUP BY hour_start
    ),

    assist_cw_conversations AS (
        SELECT
            InteractionId,
            minIf(EventDateTime, EventName = 'CONVERSATION_CREATED' AND isNotNull(EventDateTime)) AS agent_conv_start_time,
            lower(argMaxIf(EventValue5, EventDateTime, EventKey5 = 'Status')) AS effective_status,
            max(if(EventName = 'AGENT_ASSIGNED' AND EventKey15 = 'EventType' AND EventValue15 = 'assigned', 1, 0)) AS has_agent,
            minIf(toUnixTimestamp64Milli(EventDateTime), EventName = 'AGENT_ASSIGNED' AND EventKey15 = 'EventType' AND EventValue15 = 'assigned')
                - minIf(toUnixTimestamp64Milli(EventDateTime), EventName = 'CONVERSATION_CREATED') AS wait_ms,
            maxIf(toUnixTimestamp64Milli(EventDateTime), EventName = 'CONVERSATION_ENDED')
                - minIf(toUnixTimestamp64Milli(EventDateTime), EventName = 'AGENT_ASSIGNED' AND EventKey15 = 'EventType' AND EventValue15 = 'assigned') AS handle_ms,
            minIf(toUnixTimestamp64Milli(EventDateTime), EventName = 'CONVERSATION_CREATED') AS created_at_ms,
            toUnixTimestamp64Milli(now64())
                - minIf(toUnixTimestamp64Milli(EventDateTime), EventName = 'CONVERSATION_CREATED') AS pending_wait_ms
        FROM columbia.all_events
        WHERE InteractionId IS NOT NULL
          AND InteractionId != ''
          AND EventName IN ('CONVERSATION_CREATED', 'AGENT_ASSIGNED', 'CONVERSATION_ENDED')
          AND EventGroup IN ('assist-cw')
        GROUP BY InteractionId
        HAVING agent_conv_start_time IS NOT NULL
    ),

    assist_cw_hourly AS (
        SELECT
            toStartOfHour(agent_conv_start_time) AS hour_start,
            countIf(effective_status = 'completed') AS completed_calls,
            countIf(effective_status = 'assigned') AS live_calls,
            0 AS total_conversations_on_hold,
            0 AS conversations_in_wrap_up,
            CASE
                WHEN countIf(effective_status = 'completed') > 0
                THEN round(
                    (
                        sumIf(wait_ms, effective_status = 'completed' AND wait_ms > 0)
                        + sumIf(wait_ms, effective_status = 'canceled' AND wait_ms > 0)
                    ) / countIf(effective_status = 'completed')
                )
                ELSE 0
            END AS asa,
            CASE
                WHEN countIf(effective_status = 'completed' AND has_agent = 1 AND handle_ms > 0) > 0
                THEN round(
                    sumIf(handle_ms, effective_status = 'completed' AND has_agent = 1 AND handle_ms > 0)
                    / countIf(effective_status = 'completed' AND has_agent = 1 AND handle_ms > 0)
                )
                ELSE 0
            END AS avg_handle_time,
            countIf(effective_status = 'pending') AS calls_in_queue,
            countIf(effective_status = 'canceled') AS abandon,
            round(maxIf(pending_wait_ms, effective_status = 'pending')) AS current_longest_wait_time
        FROM assist_cw_conversations
        GROUP BY hour_start
    ),

    hourly_metrics AS (
        SELECT
            coalesce(acw.hour_start, ar.hour_start) AS hour_start,
            coalesce(acw.completed_calls, 0) AS completed_calls,
            coalesce(acw.live_calls, 0) AS live_calls,
            coalesce(acw.total_conversations_on_hold, 0) AS total_conversations_on_hold,
            coalesce(acw.conversations_in_wrap_up, 0) AS conversations_in_wrap_up,
            coalesce(acw.asa, 0) AS asa,
            coalesce(acw.avg_handle_time, 0) AS avg_handle_time,
            coalesce(acw.calls_in_queue, 0) AS calls_in_queue,
            coalesce(acw.abandon, 0) AS abandon,
            coalesce(acw.current_longest_wait_time, 0) AS current_longest_wait_time,
            coalesce(ar.conversationcount, 0) AS conversationcount,
            coalesce(ar.TotalAgentrequest, 0) AS TotalAgentrequest,
            coalesce(ar.conversationcount, 0) AS agentic_volume,
            coalesce(acw.completed_calls, 0)
                + coalesce(acw.live_calls, 0)
                + coalesce(acw.calls_in_queue, 0)
                + coalesce(acw.abandon, 0) AS assist_cw_volume,
            coalesce(ar.conversationcount, 0)
                + coalesce(acw.completed_calls, 0)
                + coalesce(acw.live_calls, 0)
                + coalesce(acw.calls_in_queue, 0)
                + coalesce(acw.abandon, 0) AS total_volume
        FROM assist_cw_hourly AS acw
        FULL OUTER JOIN agentic_hourly AS ar
            ON acw.hour_start = ar.hour_start
    ),

    volume_bounds AS (
        SELECT max(hour_start) AS last_hour_start
        FROM hourly_metrics
    ),

    volume_comparison AS (
        SELECT
            b.last_hour_start,
            sumIf(h.total_volume, h.hour_start = b.last_hour_start) AS last_hour_volume,
            avgIf(
                h.total_volume,
                h.hour_start < b.last_hour_start
                AND h.hour_start >= b.last_hour_start - toIntervalHour(7)
            ) AS avg_volume_prior_7_hours,
            sumIf(h.agentic_volume, h.hour_start = b.last_hour_start) AS last_hour_agentic_volume,
            avgIf(
                h.agentic_volume,
                h.hour_start < b.last_hour_start
                AND h.hour_start >= b.last_hour_start - toIntervalHour(7)
            ) AS avg_agentic_volume_prior_7_hours,
            sumIf(h.assist_cw_volume, h.hour_start = b.last_hour_start) AS last_hour_assist_cw_volume,
            avgIf(
                h.assist_cw_volume,
                h.hour_start < b.last_hour_start
                AND h.hour_start >= b.last_hour_start - toIntervalHour(7)
            ) AS avg_assist_cw_volume_prior_7_hours
        FROM hourly_metrics AS h
        CROSS JOIN volume_bounds AS b
        GROUP BY b.last_hour_start
    )

SELECT
    h.hour_start,
    h.completed_calls,
    h.live_calls,
    h.total_conversations_on_hold,
    h.conversations_in_wrap_up,
    h.asa,
    h.avg_handle_time,
    h.calls_in_queue,
    h.abandon,
    h.current_longest_wait_time,
    h.conversationcount,
    h.TotalAgentrequest,
    h.agentic_volume,
    h.assist_cw_volume,
    h.total_volume,
    vc.last_hour_start,
    vc.last_hour_volume,
    vc.avg_volume_prior_7_hours,
    round(vc.last_hour_volume - vc.avg_volume_prior_7_hours, 2) AS volume_delta_vs_prior_7h_avg,
    round(
        (vc.last_hour_volume - vc.avg_volume_prior_7_hours)
        / nullIf(vc.avg_volume_prior_7_hours, 0) * 100,
        2
    ) AS volume_pct_change_vs_prior_7h_avg,
    round(
        vc.last_hour_volume / nullIf(vc.avg_volume_prior_7_hours, 0),
        2
    ) AS volume_ratio_vs_prior_7h_avg,
    vc.last_hour_agentic_volume,
    vc.avg_agentic_volume_prior_7_hours,
    vc.last_hour_assist_cw_volume,
    vc.avg_assist_cw_volume_prior_7_hours,
    if(h.hour_start = vc.last_hour_start, 1, 0) AS is_last_hour
FROM hourly_metrics AS h
CROSS JOIN volume_comparison AS vc
ORDER BY h.hour_start;
