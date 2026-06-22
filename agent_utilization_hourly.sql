WITH agent_util_data AS (
    SELECT
        toStartOfHour(date) AS hour_start,
        sum(login_time_in_seconds) AS login_seconds,
        sum(busy_time__in_seconds) AS busy_seconds,
        sum(break_time_in_seconds) AS break_seconds,
        sum(total_chats) AS total_chats,
        sum(engage_time__in_seconds) AS engaged_seconds,
        sum(engage_time__in_seconds) / 3600 AS engaged_time_in_hours,
        sum(login_time_in_seconds - (busy_time__in_seconds + break_time_in_seconds)) / 3600 AS actual_login_hrs,
        count(DISTINCT agent_name) AS agent_count
    FROM columbia.bq_agent_utilization
    GROUP BY hour_start
),
di_data AS (
    SELECT
        toStartOfHour(session_start_time) AS hour_start,
        toStartOfHour(chat_start_date_time) AS hour_chat_start,
        count(DISTINCT aiva_interaction_id) AS bot_int_count,
        count(DISTINCT chat_interaction_id) AS chat_id_count,
        count(DISTINCT chat_conversation_id) AS conv_id
    FROM columbia.bq_digital_interaction
    GROUP BY
        hour_start,
        hour_chat_start
)
SELECT *
FROM di_data AS a
LEFT JOIN agent_util_data AS b
    ON a.hour_start = b.hour_start;
