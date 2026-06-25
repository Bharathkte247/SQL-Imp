CREATE OR REPLACE VIEW tfsdemo.agentic_runtime_engagement_details AS
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

      minIf(EventDateTime, EventName = 'REQUESTED_FOR_CONSULTATION' AND isNotNull(EventDateTime)) AS escalation_time,
      minIf(EventDateTime, EventName = 'AGENT_CONNECTED' AND isNotNull(EventDateTime)) AS agent_connected_time,
      maxIf(EventDateTime, EventName = 'AGENT_DISCONNECTED' AND isNotNull(EventDateTime)) AS agent_disconnected_time
    FROM events
    WHERE ConversationId IS NOT NULL
    GROUP BY ConversationId
  )
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
  ed.escalation_time,
  ed.agent_connected_time,
  ed.agent_disconnected_time
FROM engagement_details AS ed
LEFT JOIN conv_bounds AS cb
  ON ed.ConversationId = cb.ConversationId;
