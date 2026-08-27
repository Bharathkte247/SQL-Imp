-- Diagnostics for empty agent_utilization results (firstam sample vocabulary).
-- Run each block separately in your query tool.

-- 1) Source volume + status label inventory (last 60 days)
SELECT
    count() AS agent_status_rows,
    uniqExact(EventValue5) AS distinct_statuses,
    uniqExact(EventValue6) AS distinct_agents,
    min(EventTimeStampEpoch) AS min_ts_ms,
    max(EventTimeStampEpoch) AS max_ts_ms,
    toDateTime(intDiv(min(EventTimeStampEpoch), 1000)) AS min_ts,
    toDateTime(intDiv(max(EventTimeStampEpoch), 1000)) AS max_ts
FROM firstam.eg_assist_cw_distributed
WHERE EventName = 'AGENT_STATUS'
  AND EventTimeStampEpoch >= (toInt64(toUnixTimestamp(now() - toIntervalDay(60))) * 1000);

-- 2) Exact EventValue5 / EventValue12 values (firstam sample: login, available, busy, offline)
SELECT
    EventValue5 AS agent_current_status,
    EventValue12 AS agent_previous_status,
    count() AS cnt
FROM firstam.eg_assist_cw_distributed
WHERE EventName = 'AGENT_STATUS'
  AND EventTimeStampEpoch >= (toInt64(toUnixTimestamp(now() - toIntervalDay(60))) * 1000)
GROUP BY agent_current_status, agent_previous_status
ORDER BY cnt DESC
LIMIT 100;

-- 3) Session-start matches used by agent_utilization.sql
SELECT
    countIf(
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
        )
    ) AS session_start_rows,
    countIf(
        lowerUTF8(trimBoth(ifNull(EventValue5, ''))) IN (
            'logout', 'logged out', 'loggedout', 'logged_out'
        )
    ) AS logout_like_rows,
    count() AS total_status_rows
FROM firstam.eg_assist_cw_distributed
WHERE EventName = 'AGENT_STATUS'
  AND EventTimeStampEpoch >= (toInt64(toUnixTimestamp(now() - toIntervalDay(60))) * 1000);

-- 4) If session_start_rows = 0, utilization will be empty — update matchers from query (2).
