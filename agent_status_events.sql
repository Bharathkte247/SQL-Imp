-- ClickHouse: AGENT_STATUS events from assist-cw distributed table
-- Source: client1.eg_assist_cw_distributed
-- Window: last 60 days (EventTimeStampEpoch in milliseconds)
--
-- Field mapping (EventValue*):
--   EventValue1 = account_id
--   EventValue4 = agent_email
--   EventValue5 = agent_current_status
--   EventValue6 = agent_id
--   EventValue6 = agent_previous_status  -- NOTE: same source as agent_id; confirm if another EventValue* is intended
--   EventValue7 = agent_name
--   EventValue8 = team_id
--   EventValue9 = team_name

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
FROM client1.eg_assist_cw_distributed
WHERE EventName = 'AGENT_STATUS'
  AND EventTimeStampEpoch >= (toUnixTimestamp(now() - toIntervalDay(60)) * 1000)
;
