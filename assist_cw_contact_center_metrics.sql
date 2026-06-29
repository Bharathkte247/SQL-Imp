-- Hourly assist-cw contact center metrics from columbia.all_events.
-- Inner query: one row per InteractionId with status and timing fields.
-- Outer query: aggregates conversations into hourly buckets by conversation start time.
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
FROM (
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
)
GROUP BY hour_start
ORDER BY hour_start;
