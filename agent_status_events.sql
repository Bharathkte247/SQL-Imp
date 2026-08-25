-- ClickHouse: AGENT_STATUS events from assist-cw distributed table
-- Source: client1.eg_assist_cw_distributed
-- Window: last 60 days (EventTimeStampEpoch in milliseconds)
--
-- Field mapping (EventValue*):
--   EventValue1  = account_id
--   EventValue4  = agent_email
--   EventValue5  = agent_current_status
--   EventValue6  = agent_id
--   EventValue7  = agent_name
--   EventValue8  = team_id
--   EventValue9  = team_name
--   EventValue12 = agent_previous_status
--
-- Offline filtering:
--   KEEP Offline when it falls after Login and before Logout (in-session).
--   DROP Offline when it falls after Logout (post-session / after logout).
--   All non-Offline statuses are kept as-is.
--
-- Login / Logout detection (case-insensitive on EventValue5):
--   login  ∈ {login, logged in, loggedin, logged_in}
--   logout ∈ {logout, logged out, loggedout, logged_out}
-- Adjust these sets if your tenant uses different status labels.

WITH status_events AS (
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
        EventValue12 AS agent_previous_status,
        EventValue9 AS team_name,
        EventValue8 AS team_id,
        lowerUTF8(trimBoth(ifNull(EventValue5, ''))) AS status_norm
    FROM client1.eg_assist_cw_distributed
    WHERE EventName = 'AGENT_STATUS'
      AND EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000)
),

with_session AS (
    SELECT
        event_id,
        event_unique_id,
        event_name,
        event_timestamp_epoch,
        client_id,
        agent_id,
        account_id,
        agent_name,
        agent_email,
        agent_current_status,
        agent_previous_status,
        team_name,
        team_id,
        status_norm,
        -- Most recent login at or before this event (per agent)
        maxIf(
            event_timestamp_epoch,
            status_norm IN ('login', 'logged in', 'loggedin', 'logged_in')
        ) OVER (
            PARTITION BY client_id, agent_id
            ORDER BY event_timestamp_epoch, event_id
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS last_login_ts,
        -- Most recent logout at or before this event (per agent)
        maxIf(
            event_timestamp_epoch,
            status_norm IN ('logout', 'logged out', 'loggedout', 'logged_out')
        ) OVER (
            PARTITION BY client_id, agent_id
            ORDER BY event_timestamp_epoch, event_id
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS last_logout_ts
    FROM status_events
)

SELECT
    event_id,
    event_unique_id,
    event_name,
    event_timestamp_epoch,
    client_id,
    agent_id,
    account_id,
    agent_name,
    agent_email,
    agent_current_status,
    agent_previous_status,
    team_name,
    team_id
FROM with_session
WHERE
    -- Non-offline statuses: always keep
    status_norm != 'offline'
    OR (
        -- Offline: keep only inside an active session (after login, before logout)
        last_login_ts > 0
        AND last_login_ts > ifNull(last_logout_ts, toUInt64(0))
    )
;
