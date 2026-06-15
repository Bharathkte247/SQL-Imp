WITH events AS (
  SELECT
    agentic_runtime_ConversationId AS ConversationId,
    agentic_runtime_InteractionId AS InteractionId,
    agentic_runtime_EventId AS EventId,
    agentic_runtime_EventGroup AS EventGroup,
    agentic_runtime_EventName AS EventName,
    SAFE_CAST(agentic_runtime_EventTimeStampISO AS TIMESTAMP) AS EventDateTime,

    agentic_runtime_EventValue1 AS EventValue1,
    agentic_runtime_EventValue2 AS EventValue2,
    agentic_runtime_EventValue3 AS EventValue3,
    agentic_runtime_EventValue4 AS EventValue4,
    agentic_runtime_EventValue5 AS EventValue5,

    agentic_runtime_EventKey1 AS EventKey1,
    agentic_runtime_EventKey2 AS EventKey2,
    agentic_runtime_EventKey3 AS EventKey3,
    agentic_runtime_EventKey4 AS EventKey4,
    agentic_runtime_EventKey5 AS EventKey5,

    agentic_runtime_ClientId AS ClientId,
    agentic_runtime_ChannelId AS ChannelId,
    agentic_runtime_VisitorId AS VisitorId
  FROM `brahmos.agentic_runtime`
),

conv_bounds AS (
  SELECT
    ConversationId,

    ARRAY_AGG(ClientId IGNORE NULLS ORDER BY EventDateTime LIMIT 1)[SAFE_OFFSET(0)] AS client_id,
    ARRAY_AGG(ChannelId IGNORE NULLS ORDER BY EventDateTime LIMIT 1)[SAFE_OFFSET(0)] AS channel_id,
    ARRAY_AGG(VisitorId IGNORE NULLS ORDER BY EventDateTime LIMIT 1)[SAFE_OFFSET(0)] AS visitor_id,

    MIN(IF(EventName = 'CONVERSATION_STARTED', EventDateTime, NULL)) AS conversation_start_time,
    MAX(IF(EventName = 'CONVERSATION_ENDED', EventDateTime, NULL)) AS conversation_end_time,
    MAX(EventDateTime) AS last_event_time
  FROM events
  WHERE ConversationId IS NOT NULL
  GROUP BY ConversationId
),

visitor_repeat_base AS (
  SELECT
    ConversationId,
    visitor_id,
    COALESCE(conversation_start_time, last_event_time) AS conversation_anchor_time,
    LAG(COALESCE(conversation_start_time, last_event_time)) OVER (
      PARTITION BY visitor_id
      ORDER BY COALESCE(conversation_start_time, last_event_time), ConversationId
    ) AS previous_conversation_anchor_time
  FROM conv_bounds
  WHERE visitor_id IS NOT NULL
    AND COALESCE(conversation_start_time, last_event_time) IS NOT NULL
),

visitor_repeat_flags AS (
  SELECT
    ConversationId,
    previous_conversation_anchor_time,
    TIMESTAMP_DIFF(
      conversation_anchor_time,
      previous_conversation_anchor_time,
      SECOND
    ) AS seconds_since_previous_conversation,

    previous_conversation_anchor_time IS NOT NULL AS is_repeat_visitor,

    previous_conversation_anchor_time IS NOT NULL
      AND TIMESTAMP_DIFF(conversation_anchor_time, previous_conversation_anchor_time, SECOND) <= 24 * 60 * 60
      AS is_repeat_within_24_hours,

    previous_conversation_anchor_time IS NOT NULL
      AND TIMESTAMP_DIFF(conversation_anchor_time, previous_conversation_anchor_time, SECOND) <= 48 * 60 * 60
      AS is_repeat_within_48_hours,

    previous_conversation_anchor_time IS NOT NULL
      AND TIMESTAMP_DIFF(conversation_anchor_time, previous_conversation_anchor_time, SECOND) <= 7 * 24 * 60 * 60
      AS is_repeat_within_7_days,

    CASE
      WHEN previous_conversation_anchor_time IS NULL THEN 'first_time_visitor'
      WHEN TIMESTAMP_DIFF(conversation_anchor_time, previous_conversation_anchor_time, SECOND) <= 24 * 60 * 60 THEN 'repeat_24_hours'
      WHEN TIMESTAMP_DIFF(conversation_anchor_time, previous_conversation_anchor_time, SECOND) <= 48 * 60 * 60 THEN 'repeat_48_hours'
      WHEN TIMESTAMP_DIFF(conversation_anchor_time, previous_conversation_anchor_time, SECOND) <= 7 * 24 * 60 * 60 THEN 'repeat_7_days'
      ELSE 'repeat_after_7_days'
    END AS repeat_window_identifier
  FROM visitor_repeat_base
),

intents AS (
  SELECT
    ConversationId,

    ARRAY_AGG(
      IF(EventName = 'UPDATE_INTENT', EventValue1, NULL)
      IGNORE NULLS ORDER BY EventDateTime ASC LIMIT 1
    )[SAFE_OFFSET(0)] AS first_identified_intent,

    ARRAY_AGG(
      IF(EventName = 'UPDATE_INTENT', EventValue1, NULL)
      IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1
    )[SAFE_OFFSET(0)] AS last_identified_intent,

    ARRAY_AGG(
      IF(EventName = 'INTENT_CLASSIFIED', EventValue1, NULL)
      IGNORE NULLS ORDER BY EventDateTime ASC LIMIT 1
    )[SAFE_OFFSET(0)] AS first_identified_intent_classified,

    ARRAY_AGG(
      IF(EventName = 'INTENT_COMPLETED', EventValue1, NULL)
      IGNORE NULLS ORDER BY EventDateTime ASC LIMIT 1
    )[SAFE_OFFSET(0)] AS first_completed_intent,

    ARRAY_AGG(
      IF(EventName = 'INTENT_COMPLETED', EventValue1, NULL)
      IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1
    )[SAFE_OFFSET(0)] AS last_completed_intent
  FROM events
  GROUP BY ConversationId
),

engagement_details AS (
  SELECT
    ConversationId,

    COUNTIF(EventName = 'MESSAGE_SENT' AND LOWER(EventValue2) = 'customer') > 0 AS is_engaged,
    COUNTIF(EventName = 'REQUESTED_FOR_CONSULTATION') > 0 AS is_transferred,

    MIN(IF(EventName = 'REQUESTED_FOR_CONSULTATION', EventDateTime, NULL)) AS escalation_time,
    MIN(IF(EventName = 'AGENT_CONNECTED', EventDateTime, NULL)) AS agent_connected_time,
    MAX(IF(EventName = 'AGENT_DISCONNECTED', EventDateTime, NULL)) AS agent_disconnected_time,

    MAX(IF(EventName = 'MESSAGE_SENT', EventDateTime, NULL)) AS last_concierge_message_time,

    COUNTIF(
      EventName = 'REQUESTED_FOR_CONSULTATION'
      OR (
        EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
        AND LOWER(EventValue2) = 'brand'
      )
    ) > 0 AS is_consultant_involved,

    MAX(
      IF(
        EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
        AND LOWER(EventValue2) = 'customer',
        EventDateTime,
        NULL
      )
    ) AS last_received_message_from_visitor,

    MAX(
      IF(
        EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
        AND LOWER(EventValue2) = 'brand',
        EventDateTime,
        NULL
      )
    ) AS last_received_message_from_brand,

    COUNTIF(EventName = 'MESSAGE_RECEIVED' AND LOWER(EventValue2) = 'customer') AS visitor_message_count,
    COUNTIF(EventName = 'MESSAGE_SENT' AND LOWER(EventValue2) = 'customer') AS concierge_to_visitor_message_count,
    COUNTIF(EventName = 'MESSAGE_RECEIVED' AND LOWER(EventValue2) = 'brand') AS brand_to_concierge_message_count,
    COUNTIF(EventName = 'MESSAGE_SENT' AND LOWER(EventValue2) = 'brand') AS concierge_to_brand_message_count
  FROM events
  GROUP BY ConversationId
),

latest_disposition AS (
  SELECT *
  FROM events
  WHERE EventName = 'DISPOSITION'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY ConversationId
    ORDER BY EventDateTime DESC
  ) = 1
),

resolved_details AS (
  SELECT
    ConversationId,

    LOWER(EventValue4) = 'resolved' AS is_resolved,

    IF(
      LOWER(EventValue4) = 'resolved',
      EventDateTime,
      NULL
    ) AS resolved_timestamp,

    IF(
      LOWER(EventValue4) = 'resolved',
      EventValue5,
      NULL
    ) AS resolution_offered
  FROM latest_disposition
),

conversation_event_attributes AS (
  SELECT
    ConversationId,

    MAX(IF(EventName = 'DISPOSITION' AND rn = 1, EventValue1, NULL)) AS intent_level_1,
    MAX(IF(EventName = 'DISPOSITION' AND rn = 1, EventValue2, NULL)) AS intent_level_2,
    MAX(IF(EventName = 'DISPOSITION' AND rn = 1, EventValue3, NULL)) AS intent_description,
    MAX(IF(EventName = 'DISPOSITION' AND rn = 1, EventValue4, NULL)) AS resolution_status,
    MAX(IF(EventName = 'DISPOSITION' AND rn = 1, EventValue5, NULL)) AS wrapup_note,

    MAX(IF(EventName = 'CONVERSATION_SUMMARY' AND rn = 1, EventValue2, NULL)) AS completion_tokens,
    MAX(IF(EventName = 'CONVERSATION_SUMMARY' AND rn = 1, EventValue3, NULL)) AS prompt_tokens,
    MAX(IF(EventName = 'CONVERSATION_SUMMARY' AND rn = 1, EventValue4, NULL)) AS conversation_summary,

    MAX(IF(EventName = 'REQUESTED_FOR_CONSULTATION' AND rn = 1, EventValue1, NULL)) AS escalation_message,
    MAX(IF(EventName = 'REQUESTED_FOR_CONSULTATION' AND rn = 1, EventValue2, NULL)) AS escalation_queue_id,
    MAX(IF(EventName = 'REQUESTED_FOR_CONSULTATION' AND rn = 1, EventValue3, NULL)) AS task_type,

    MAX(IF(EventName = 'CONSULTATION_TERMINATION' AND rn = 1, EventValue1, NULL)) AS termination_reason,
    MAX(IF(EventName = 'CONSULTATION_TERMINATION' AND rn = 1, EventValue2, NULL)) AS is_terminated,

    MAX(IF(EventName = 'CONVERSATION_ENDED' AND rn = 1, EventValue1, NULL)) AS termination_source,
    MAX(IF(EventName = 'CONVERSATION_ENDED' AND rn = 1, EventValue2, NULL)) AS termination_message
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER (
        PARTITION BY ConversationId, EventName
        ORDER BY EventDateTime DESC
      ) AS rn
    FROM events
    WHERE EventName IN (
      'DISPOSITION',
      'CONVERSATION_SUMMARY',
      'REQUESTED_FOR_CONSULTATION',
      'CONSULTATION_TERMINATION',
      'CONVERSATION_ENDED'
    )
  )
  GROUP BY ConversationId
),

intent_attributes AS (
  SELECT
    ConversationId,
    ARRAY_AGG(EventValue1 IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS session_id,
    ARRAY_AGG(EventValue2 IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS visitor_id_ir_event,
    ARRAY_AGG(EventValue3 IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS treatment_name,
    ARRAY_AGG(EventValue4 IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS treatment_category,

    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'journey_type': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS journey_type,
    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'is_authenticated': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS is_authenticated,
    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'intentName': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS intent_name,
    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'trackingId': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS tracking_id,
    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'billType': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS bill_type,

    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'intentName': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime ASC LIMIT 1)[SAFE_OFFSET(0)] AS first_resolved_intent,
    ARRAY_AGG(REGEXP_EXTRACT(EventValue5, r"'intentName': '([^']*)'") IGNORE NULLS ORDER BY EventDateTime DESC LIMIT 1)[SAFE_OFFSET(0)] AS last_resolved_intent,

    COUNT(*) AS intent_resolution_count
  FROM events
  WHERE EventName = 'INTENT_RESOLUTION'
  GROUP BY ConversationId
),

agent_interactions AS (
  SELECT
    ac.ConversationId,
    ac.InteractionId,
    ac.EventValue1 AS agent_name,
    ac.EventDateTime AS agent_interaction_start_time,

    COALESCE(
      (
        SELECT MIN(e.EventDateTime)
        FROM events e
        WHERE e.ConversationId = ac.ConversationId
          AND e.EventName = 'AGENT_DISCONNECTED'
          AND e.EventDateTime >= ac.EventDateTime
          AND (
            ac.InteractionId IS NULL
            OR ac.InteractionId = ''
            OR e.InteractionId = ac.InteractionId
          )
      ),
      (
        SELECT MIN(e.EventDateTime)
        FROM events e
        WHERE e.ConversationId = ac.ConversationId
          AND e.EventName = 'CONSULTATION_TERMINATION'
          AND e.EventDateTime >= ac.EventDateTime
          AND (
            ac.InteractionId IS NULL
            OR ac.InteractionId = ''
            OR e.InteractionId = ac.InteractionId
          )
      ),
      (
        SELECT MIN(e.EventDateTime)
        FROM events e
        WHERE e.ConversationId = ac.ConversationId
          AND e.EventName = 'CONVERSATION_ENDED'
          AND e.EventDateTime >= ac.EventDateTime
          AND (
            ac.InteractionId IS NULL
            OR ac.InteractionId = ''
            OR e.InteractionId = ac.InteractionId
          )
      )
    ) AS agent_interaction_end_time
  FROM events ac
  WHERE ac.EventName = 'AGENT_CONNECTED'
    AND ac.EventKey1 = 'AgentName'
),

agent_interaction_ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY ConversationId
      ORDER BY agent_interaction_start_time ASC
    ) AS rn_first,

    ROW_NUMBER() OVER (
      PARTITION BY ConversationId
      ORDER BY agent_interaction_start_time DESC
    ) AS rn_last
  FROM agent_interactions
),

agent_interaction_details AS (
  SELECT
    ConversationId,

    MAX(IF(rn_first = 1, agent_name, NULL)) AS first_agent_connected_name,
    MAX(IF(rn_last = 1, agent_name, NULL)) AS last_agent_connected_name,

    MAX(IF(rn_first = 1, InteractionId, NULL)) AS first_interaction_id,
    MAX(IF(rn_last = 1, InteractionId, NULL)) AS last_interaction_id,

    MAX(IF(rn_first = 1, agent_interaction_start_time, NULL)) AS first_agent_interaction_start_time,
    MAX(IF(rn_first = 1, agent_interaction_end_time, NULL)) AS first_agent_interaction_end_time,

    MAX(IF(rn_last = 1, agent_interaction_start_time, NULL)) AS last_agent_interaction_start_time,
    MAX(IF(rn_last = 1, agent_interaction_end_time, NULL)) AS last_agent_interaction_end_time,

    COUNT(*) AS agent_interaction_count,

    SUM(
      IF(
        agent_interaction_end_time IS NOT NULL,
        TIMESTAMP_DIFF(agent_interaction_end_time, agent_interaction_start_time, SECOND),
        0
      )
    ) AS total_agent_connected_duration_seconds
  FROM agent_interaction_ranked
  GROUP BY ConversationId
),

resolution_events AS (
  SELECT
    ConversationId,

    MAX(IF(EventName = 'CONVERSATION_ENDED', EventDateTime, NULL)) AS conversation_end_time_for_resolution,

    MAX(
      IF(
        EventName = 'CONSULTATION_TERMINATION'
        AND LOWER(EventValue1) IN ('resolved', 'agent_resolved'),
        EventDateTime,
        NULL
      )
    ) AS consultation_resolved_time,

    MAX(
      IF(
        EventName = 'MESSAGE_SENT'
        AND LOWER(EventValue2) = 'customer',
        EventDateTime,
        NULL
      )
    ) AS last_message_sent_to_customer_time,

    MAX(
      IF(
        EventName = 'DISPOSITION'
        AND LOWER(EventValue4) = 'resolved',
        EventDateTime,
        NULL
      )
    ) AS disposition_resolved_time,

    MAX(IF(EventName = 'DISPOSITION', EventDateTime, NULL)) AS disposition_time,

    COUNTIF(
      EventName = 'DISPOSITION'
      AND LOWER(EventValue4) = 'resolved'
    ) > 0
    OR COUNTIF(
      EventName = 'CONSULTATION_TERMINATION'
      AND LOWER(EventValue1) IN ('resolved', 'agent_resolved')
    ) > 0
    OR COUNTIF(
      EventName = 'CONVERSATION_ENDED'
      AND LOWER(EventValue2) LIKE '%resolved%'
    ) > 0 AS is_resolved
  FROM events
  GROUP BY ConversationId
),

resolution_time_details AS (
  SELECT
    cb.ConversationId,

    CASE
      WHEN re.is_resolved THEN COALESCE(
        re.conversation_end_time_for_resolution,
        re.consultation_resolved_time,
        re.last_message_sent_to_customer_time,
        re.disposition_resolved_time
      )
    END AS resolution_provided_time,

    re.disposition_time,

    TIMESTAMP_DIFF(
      CASE
        WHEN re.is_resolved THEN COALESCE(
          re.conversation_end_time_for_resolution,
          re.consultation_resolved_time,
          re.last_message_sent_to_customer_time,
          re.disposition_resolved_time
        )
      END,
      cb.conversation_start_time,
      SECOND
    ) AS total_resolution_time_seconds,

    CASE
      WHEN re.disposition_time IS NOT NULL
        AND re.is_resolved
        AND re.disposition_time > COALESCE(
          re.conversation_end_time_for_resolution,
          re.consultation_resolved_time,
          re.last_message_sent_to_customer_time,
          re.disposition_resolved_time
        )
      THEN TIMESTAMP_DIFF(
        re.disposition_time,
        COALESCE(
          re.conversation_end_time_for_resolution,
          re.consultation_resolved_time,
          re.last_message_sent_to_customer_time,
          re.disposition_resolved_time
        ),
        SECOND
      )
      ELSE 0
    END AS excluded_disposition_time_seconds
  FROM conv_bounds cb
  LEFT JOIN resolution_events re
    USING (ConversationId)
),

brand_message_turns AS (
  SELECT
    ConversationId,
    InteractionId,
    EventId,
    EventName,
    EventDateTime,

    LAG(EventName) OVER (
      PARTITION BY ConversationId, InteractionId
      ORDER BY EventDateTime, EventId
    ) AS prev_event_name,

    LAG(EventDateTime) OVER (
      PARTITION BY ConversationId, InteractionId
      ORDER BY EventDateTime, EventId
    ) AS prev_event_time
  FROM events
  WHERE EventName IN ('MESSAGE_SENT', 'MESSAGE_RECEIVED')
    AND LOWER(EventValue2) = 'brand'
),

visitor_message_turns AS (
  SELECT
    ConversationId,
    EventId,
    EventName,
    EventDateTime,

    LAG(EventName) OVER (
      PARTITION BY ConversationId
      ORDER BY EventDateTime, EventId
    ) AS prev_event_name,

    LAG(EventDateTime) OVER (
      PARTITION BY ConversationId
      ORDER BY EventDateTime, EventId
    ) AS prev_event_time
  FROM events
  WHERE EventName IN ('MESSAGE_SENT', 'MESSAGE_RECEIVED')
    AND LOWER(EventValue2) = 'customer'
),

visitor_response_turns AS (
  SELECT
    ConversationId,
    prev_event_time AS visitor_response_requested_time,
    EventDateTime AS visitor_response_time,
    TIMESTAMP_DIFF(EventDateTime, prev_event_time, SECOND) AS visitor_response_seconds
  FROM visitor_message_turns
  WHERE EventName = 'MESSAGE_RECEIVED'
    AND prev_event_name = 'MESSAGE_SENT'
    AND prev_event_time IS NOT NULL
),

visitor_response_details AS (
  SELECT
    ConversationId,
    SUM(visitor_response_seconds) AS total_visitor_time_seconds,
    COUNT(*) AS visitor_turn_count,
    AVG(visitor_response_seconds) AS average_visitor_response_time_seconds
  FROM visitor_response_turns
  GROUP BY ConversationId
),

agent_response_turns AS (
  SELECT
    ConversationId,
    InteractionId,
    prev_event_time AS agent_response_requested_time,
    EventDateTime AS agent_response_time,
    TIMESTAMP_DIFF(EventDateTime, prev_event_time, SECOND) AS agent_response_seconds
  FROM brand_message_turns
  WHERE EventName = 'MESSAGE_RECEIVED'
    AND prev_event_name = 'MESSAGE_SENT'
    AND prev_event_time IS NOT NULL
),

agent_response_details AS (
  SELECT
    ConversationId,

    SUM(agent_response_seconds) AS total_agent_response_time_seconds,
    COUNT(*) AS agent_response_count,
    AVG(agent_response_seconds) AS average_agent_response_time_seconds,

    MIN(agent_response_requested_time) AS first_agent_response_requested_time,
    MIN(agent_response_time) AS first_agent_response_time,
    MAX(agent_response_time) AS last_agent_response_time
  FROM agent_response_turns
  GROUP BY ConversationId
),

ai_coworker_raw AS (
  SELECT
    SAFE_CAST(conversation_id AS STRING) AS ConversationId,
    SAFE_CAST(request_id AS STRING) AS request_id,
    SAFE_CAST(request_start_time AS TIMESTAMP) AS request_start_time,
    SAFE_CAST(request_end_time AS TIMESTAMP) AS request_end_time,
    NULLIF(TRIM(capability_name), '') AS capability_name,
    LOWER(TRIM(final_outcome)) AS final_outcome,
    SAFE_CAST(total_duration_ms AS INT64) AS total_duration_ms
  FROM superset.ai_agent_coworker_view
  WHERE conversation_id IS NOT NULL
),

ai_coworker_counts AS (
  SELECT
    ConversationId,
    COUNT(*) AS request_count_per_conversation,
    COUNTIF(final_outcome = 'success') AS final_outcome_success_count,
    COUNTIF(final_outcome = 'failure') AS final_outcome_failure_count,
    COUNTIF(final_outcome = 'system') AS final_outcome_system_count,
    SUM(
      COALESCE(
        total_duration_ms,
        IF(
          request_start_time IS NOT NULL AND request_end_time IS NOT NULL,
          TIMESTAMP_DIFF(request_end_time, request_start_time, MILLISECOND),
          0
        )
      )
    ) AS ai_coworker_total_duration_ms
  FROM ai_coworker_raw
  GROUP BY ConversationId
),

ai_coworker_capability_ranked AS (
  SELECT
    ConversationId,
    capability_name,
    ROW_NUMBER() OVER (
      PARTITION BY ConversationId
      ORDER BY MIN(request_start_time), capability_name
    ) AS capability_rank
  FROM ai_coworker_raw
  WHERE capability_name IS NOT NULL
  GROUP BY ConversationId, capability_name
),

ai_coworker_capability_pivot AS (
  SELECT
    ConversationId,
    MAX(IF(capability_rank = 1, capability_name, NULL)) AS Capabilities1,
    MAX(IF(capability_rank = 2, capability_name, NULL)) AS Capability2,
    MAX(IF(capability_rank = 3, capability_name, NULL)) AS Capability3,
    MAX(IF(capability_rank = 4, capability_name, NULL)) AS Capability4,
    MAX(IF(capability_rank = 5, capability_name, NULL)) AS Capability5
  FROM ai_coworker_capability_ranked
  WHERE capability_rank <= 5
  GROUP BY ConversationId
)

SELECT
  cb.ConversationId,
  cb.client_id,
  cb.channel_id,
  cb.visitor_id,
  cb.conversation_start_time,
  cb.conversation_end_time,
  cb.last_event_time,
  vrf.previous_conversation_anchor_time AS previous_conversation_time,
  vrf.seconds_since_previous_conversation,
  COALESCE(vrf.is_repeat_visitor, FALSE) AS is_repeat_visitor,
  COALESCE(vrf.is_repeat_within_24_hours, FALSE) AS is_repeat_within_24_hours,
  COALESCE(vrf.is_repeat_within_48_hours, FALSE) AS is_repeat_within_48_hours,
  COALESCE(vrf.is_repeat_within_7_days, FALSE) AS is_repeat_within_7_days,
  COALESCE(vrf.repeat_window_identifier, 'first_time_visitor') AS repeat_window_identifier,

  TIMESTAMP_DIFF(
    COALESCE(cb.conversation_end_time, cb.last_event_time),
    cb.conversation_start_time,
    SECOND
  ) AS conversation_duration_seconds,

  engage.* EXCEPT(ConversationId),
  ints.* EXCEPT(ConversationId),
  res.* EXCEPT(ConversationId),
  event_att.* EXCEPT(ConversationId),
  intent_att.* EXCEPT(ConversationId),
  aid.* EXCEPT(ConversationId),
  rtd.* EXCEPT(ConversationId),
  ard.* EXCEPT(ConversationId),

  COALESCE(ac.request_count_per_conversation, 0) AS request_count_per_conversation,
  COALESCE(ac.final_outcome_success_count, 0) AS final_outcome_success_count,
  COALESCE(ac.final_outcome_failure_count, 0) AS final_outcome_failure_count,
  COALESCE(ac.final_outcome_system_count, 0) AS final_outcome_system_count,
  COALESCE(ac.ai_coworker_total_duration_ms, 0) AS ai_coworker_total_duration_ms,
  ROUND(COALESCE(ac.ai_coworker_total_duration_ms, 0) / 1000.0, 2) AS ai_coworker_total_duration_seconds,
  COALESCE(vrd.total_visitor_time_seconds, 0) AS total_visitor_time_seconds,
  COALESCE(ard.total_agent_response_time_seconds, 0) AS total_brand_time_seconds,
  COALESCE(vrd.visitor_turn_count, 0) AS visitor_turn_count,
  COALESCE(ard.agent_response_count, 0) AS brand_turn_count,

  cap.Capabilities1,
  cap.Capability2,
  cap.Capability3,
  cap.Capability4,
  cap.Capability5

FROM conv_bounds cb
LEFT JOIN visitor_repeat_flags vrf USING (ConversationId)
LEFT JOIN engagement_details engage USING (ConversationId)
LEFT JOIN intents ints USING (ConversationId)
LEFT JOIN resolved_details res USING (ConversationId)
LEFT JOIN conversation_event_attributes event_att USING (ConversationId)
LEFT JOIN intent_attributes intent_att USING (ConversationId)
LEFT JOIN agent_interaction_details aid USING (ConversationId)
LEFT JOIN resolution_time_details rtd USING (ConversationId)
LEFT JOIN agent_response_details ard USING (ConversationId)
LEFT JOIN ai_coworker_counts ac USING (ConversationId)
LEFT JOIN ai_coworker_capability_pivot cap USING (ConversationId)
LEFT JOIN visitor_response_details vrd USING (ConversationId)
WHERE DATE(COALESCE(cb.conversation_start_time, cb.last_event_time)) >= DATE '2026-05-01'
  AND cb.client_id LIKE '%columbia%';
