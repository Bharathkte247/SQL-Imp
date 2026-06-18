WITH agent_util_data AS (
    SELECT
        toStartOfHour(timestamp_column) AS hour_start,
        sum(login_time_in_seconds) AS login_seconds,
        sum(busy_time__in_seconds) AS busy_seconds,
        sum(break_time_in_seconds) AS break_seconds,
        sum(total_chats) AS total_chats,
        sum(engage_time__in_seconds) AS engaged_seconds
    FROM columbia.agent_utilization
    GROUP BY hour_start
)
SELECT *
FROM agent_util_data;
