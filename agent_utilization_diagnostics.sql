-- Diagnostics for empty agent_utilization results.
-- Run each block separately in your query tool.
-- Schema: firstam.eg_assist_cw_distributed

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
  AND EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000);

-- 2) Exact EventValue5 values seen (adjust login/logout sets from this)
SELECT
    EventValue5 AS agent_current_status,
    lowerUTF8(trimBoth(ifNull(EventValue5, ''))) AS status_norm,
    count() AS cnt
FROM firstam.eg_assist_cw_distributed
WHERE EventName = 'AGENT_STATUS'
  AND EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000)
GROUP BY agent_current_status, status_norm
ORDER BY cnt DESC
LIMIT 100;

-- 3) How many events look like login / logout with current matchers
SELECT
    countIf(
        lowerUTF8(trimBoth(ifNull(EventValue5, ''))) IN (
            'login', 'logged in', 'loggedin', 'logged_in', 'online'
        )
    ) AS login_like_rows,
    countIf(
        lowerUTF8(trimBoth(ifNull(EventValue5, ''))) IN (
            'logout', 'logged out', 'loggedout', 'logged_out'
        )
    ) AS logout_like_rows,
    count() AS total_status_rows
FROM firstam.eg_assist_cw_distributed
WHERE EventName = 'AGENT_STATUS'
  AND EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000);

-- 4) If login_like_rows = 0, sessions never start and utilization is empty.
--    Update is_login / is_logout sets in agent_utilization.sql from query (2).
