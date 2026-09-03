SELECT * FROM (
WITH 
base_events AS (
  SELECT
    coalesce(
      InteractionId,
      JSONExtractString(data, 'TaskAttributes', 'interactionId'),
      JSONExtractString(data, 'TaskSid')
    ) AS interaction_id,
    
    EventName AS event_name,
    EventUniqueId AS event_unique_id,
    EventTimeStampEpoch AS event_time_epoch,
    ChannelUserId AS channel_user_id,
    toDateTime64(EventTimeStampEpoch / 1000, 3) AS event_timestamp,
    
    -- Flattened columns
    EventValue1 AS event_value_1,
    EventValue2 AS event_value_2,
    EventValue3 AS event_value_3,
    EventValue4 AS event_value_4,
    EventValue5 AS event_value_5,
    EventValue6 AS event_value_6,
    EventValue7 AS event_value_7,
    EventValue8 AS event_value_8,
    EventValue9 AS event_value_9,
    EventValue10 AS event_value_10,
    EventValue11 AS event_value_11,
    EventValue12 AS event_value_12,
    EventValue13 AS event_value_13,
    EventValue14 AS event_value_14,
    EventValue15 AS event_value_15,
    EventValue16 AS event_value_16,
    EventValue17 AS event_value_17,
    EventValue18 AS event_value_18,
    EventValue19 AS event_value_19,
     EventValue20 AS event_value_20,
     EventKey16 AS event_key_16,
    
     data AS event_data,
     ClientOrg as client_id,
    
    coalesce(
      EventValue1,
      JSONExtractString(data, 'TaskAttributes', 'accountId')
    ) AS account_id
    
   FROM {{ params.client_schema }}.eg_assist_cw_distributed 
  WHERE (
    InteractionId IS NOT NULL 
   -- OR JSONExtractString(data, 'TaskAttributes', 'interactionId') IS NOT NULL
  ) AND   toDate( fromUnixTimestamp64Milli(event_time_epoch)) >= toDate('{{ params.cutoff_date }}')
  --EventTimeStampEpoch >= toUnixTimestamp(now() - INTERVAL 60 DAY) * 1000 
),

-- =============================================================================
-- DEDUPLICATION: Handle duplicate events from upstream replays
-- =============================================================================
base_events_dedup AS (
  SELECT *
  FROM (
    SELECT 
      *,
      row_number() OVER (
        PARTITION BY event_unique_id 
        ORDER BY event_time_epoch DESC
      ) AS rn
    FROM base_events
  )
  WHERE rn = 1 
  --AND toDate( fromUnixTimestamp64Milli(event_time_epoch)) >= toDate('{{ params.cutoff_date }}')
),

-- =============================================================================
-- STEP 2: Core Interaction Attributes (account_id onwards)
-- =============================================================================
core_attributes AS (
  SELECT
    interaction_id,
    
    -- account_id (Column 39 in original)
    any(account_id) AS account_id,
    
    -- chat_conversation_id (Column 40)
    any(coalesce(
      event_value_2,
      JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'conversationId'),
      JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'chatConversationId')
    )) AS chat_conversation_id,
    
    -- agent_interaction_type (Column 41) - SYNC or ASYNC
    anyIf(
      JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'chatInteractionType'),
      event_name IN ('CONVERSATION_CREATED')
    ) AS agent_interaction_type,
    
    -- agent_interaction_queued_time (Column 42)
    minIf(
      event_time_epoch,
      event_name = 'CONVERSATION_CREATED'
    ) AS agent_interaction_queued_time_raw,
    
    -- For time_elapsed_on_queue calculation
    minIf(event_time_epoch, event_name = 'CONVERSATION_CREATED') AS conversation_created_time,
    minIf(event_time_epoch, (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED') AS first_agent_assigned_time,
    minIf(event_time_epoch, event_name IN ('CONVERSATION_STATUS_CHANGED') AND JSONExtractString(JSONExtractString(event_data, 'string'), 'status') = 'queued') AS first_queued_time
    
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 3: Timestamps
-- =============================================================================
timestamps AS (
  SELECT
    interaction_id,
    
    -- agent_interaction_start_time (Column 55)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'MESSAGE_CREATED'
    ), toDateTime64(0, 3)) AS agent_interaction_start_time,
    
    -- agent_interaction_end_time (Column 56)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name IN ('CONVERSATION_ENDED')
    ), toDateTime64(0, 3)) AS agent_interaction_end_time,
    
    -- chat_interaction_id (Column 68) - same as interaction_id
    any(interaction_id) AS chat_interaction_id,
    
    -- agent_interaction_requested_time (Column 69)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_STATUS_CHANGED')
    ), toDateTime64(0, 3)) AS agent_interaction_requested_time,
    
    -- agent_interaction_interactive_time (Column 70) - Timestamp of last MESSAGE_SENT from user
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name = 'MESSAGE_SENT' AND lower(event_value_18) = 'user'
    ), toDateTime64(0, 3)) AS agent_interaction_interactive_time,
    
    -- agent_interaction_terminated_time (Column 71)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name IN ('CONVERSATION_ENDED')
    ), toDateTime64(0, 3)) AS agent_interaction_terminated_time,
    
    -- agentExitType - Set to 'agentNotAccepted' when agent times out or passes
    anyIf(
      'agentNotAccepted',
      event_name = 'CONVERSATION_TERMINATED' 
        AND lower(event_value_16) IN ('agent_timeout', 'agent_pass')
    ) AS agent_exit_type,
    
    -- chat_abandoned_time (Column 73)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name = 'CONVERSATION_ENDED' AND lower(event_value_5) = 'canceled'
    ), toDateTime64(0, 3)) AS chat_abandoned_time,
    
    -- interaction_cancelled_time - Timestamp when conversation was cancelled
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name = 'CONVERSATION_ENDED' AND lower(event_value_5) = 'canceled'
    ), toDateTime64(0, 3)) AS interaction_cancelled_time,
    
    -- chat_start_date_time (Column 74)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'
    ), toDateTime64(0, 3)) AS chat_start_date_time,
    
    -- chat_end_date_time (Column 75)
    nullIf(minIf(
      toDateTime64(event_time_epoch / 1000, 3),
      event_name IN ('CONVERSATION_ENDED')
    ), toDateTime64(0, 3)) AS chat_end_date_time
    
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 4: Agent Information - First Connected
-- =============================================================================
first_agent AS (
  SELECT
    interaction_id,
    argMin(
      tuple(
        account_id,
        coalesce(event_value_3, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId')),
        coalesce(event_value_4, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId')),
        coalesce(event_value_6, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'WorkerName')),
        coalesce(event_value_7, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'full_name')),
        coalesce(event_value_4, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'email')),
        coalesce(event_value_8, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId')),
        coalesce(event_value_9, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId'))
      ),
      event_time_epoch
    ) AS first_agent_info
    
  FROM base_events_dedup
  WHERE (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 5: Agent Information - Last Connected
-- =============================================================================
last_agent AS (
  SELECT
    interaction_id,
    argMax(
      tuple(
        account_id,
        coalesce(event_value_3, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId')),
        coalesce(event_value_4, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId')),
        coalesce(event_value_6, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'WorkerName')),
        coalesce(event_value_7, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'full_name')),
        coalesce(event_value_4, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'email')),
        coalesce(event_value_8, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId')),
        coalesce(event_value_9, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId')),
        event_name
      ),
      tuple(
        if(event_name = 'CONVERSATION_ENDED', 0, 1),
        event_time_epoch
      )
    ) AS last_agent_info
    
  FROM base_events_dedup
  WHERE (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 6: Agent Information - Last Connected Started (alternative source)
-- =============================================================================
last_agent_started AS (
  SELECT
    interaction_id,
    argMax(
      tuple(
        account_id,
        coalesce(event_value_6, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId')),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueName'),
        coalesce(event_value_2, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'WorkerName')),
        coalesce(event_value_3, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'full_name')),
        coalesce(event_value_4, JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'email')),
        coalesce(event_value_8, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId')),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamName')
      ),
      event_time_epoch
    ) AS last_agent_started_info
    
  FROM base_events_dedup
  WHERE (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 7: Transfer Counts
-- =============================================================================
transfers AS (
  SELECT
    bq.interaction_id,
    
    -- num_agent_transfers_initiated (Column 67)
    -- Only count agent transfers at the conversation end of first interaction in each conversation
    uniqIf(
      bq.event_value_2,
      bq.event_name = 'CONVERSATION_TERMINATED' AND bq.event_key_16 ='TerminationReason'
      AND bq.event_value_16 = 'agent_timeout'
      AND bq.is_conversation_end_event = 1
    ) AS num_agent_transfers_initiated,
    
    -- num_agent_transfers_completed (Column 68)
    -- Count agent transfers completed at conversation_created time of 2nd interaction
    uniqIf(
      bq.event_value_2,
      bq.event_name = 'CONVERSATION_TERMINATED' AND bq.event_key_16 ='TerminationReason'
      AND bq.event_value_16 = 'agent_timeout'
      AND bq.is_second_interaction_created_event = 1
    ) AS num_agent_transfers_completed,
    
    -- num_account_transfers_initiated (Column 115)
    countIf(coalesce(bq.event_value_2, JSONExtractString(JSONExtractString(bq.event_data, 'string'), 'TaskAttributes', 'TransferType')) = 'account') AS num_account_transfers_initiated,
    
    -- num_queue_transfers_initiated (Column 116)
    uniqIf(
      bq.event_value_2,
      bq.event_name = 'CONVERSATION_TERMINATED' AND bq.event_key_16 ='TerminationReason'
      AND bq.event_value_16 = 'queue_transfer'
      AND bq.is_conversation_end_event = 1
    ) 
    AS num_queue_transfers_initiated,
    
    -- num_account_transfers_completed (Column 117)
    countIf(
      coalesce(bq.event_value_2, JSONExtractString(JSONExtractString(bq.event_data, 'string'), 'TaskAttributes', 'TransferType')) = 'account'
      AND coalesce(bq.event_value_3, JSONExtractString(JSONExtractString(bq.event_data, 'string'), 'TaskAttributes', 'TransferStatus')) = 'completed'
    ) AS num_account_transfers_completed,
    
    -- num_queue_transfers_completed (Column 118)
    uniqIf(
      bq.event_value_2,
      bq.event_name = 'CONVERSATION_TERMINATED' AND bq.event_key_16 ='TerminationReason'
      AND bq.event_value_16 = 'queue_transfer'
      AND bq.is_second_interaction_created_event = 1
    ) AS num_queue_transfers_completed
    
  FROM (
    SELECT
      *,
      -- Mark events that are conversation end times of the first interaction
      if(
        event_name IN ('CONVERSATION_ENDED', 'CONVERSATION_TERMINATED', 'RESERVATION_COMPLETED')
        AND row_number() OVER (PARTITION BY interaction_id ORDER BY event_time_epoch) = 1,
        1,
        0
      ) AS is_conversation_end_event,
      -- Mark events that are conversation created times of the second interaction
      if(
        event_name = 'CONVERSATION_CREATED'
        AND row_number() OVER (PARTITION BY chat_conversation_id ORDER BY event_time_epoch) = 2,
        1,
        0
      ) AS is_second_interaction_created_event
    FROM (
      SELECT
        *,
        coalesce(
          interaction_id,
          JSONExtractString(event_data, 'TaskAttributes', 'interaction_Id'),
          JSONExtractString(event_data, 'TaskSid')
        ) AS interaction_id,
        coalesce(
          JSONExtractString(event_data, 'TaskAttributes', 'chatConversationId'),
          JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'chatConversationId')
        ) AS chat_conversation_id
      FROM base_events_dedup
    )
  ) bq
  WHERE bq.event_name IN ('CONVERSATION_UPDATED', 'TASK_UPDATED', 'CONVERSATION_ENDED', 'CONVERSATION_TERMINATED', 'RESERVATION_COMPLETED', 'CONVERSATION_CREATED')
  GROUP BY bq.interaction_id
),

-- =============================================================================
-- STEP 8: Status Flags
-- =============================================================================
status_flags AS (
  SELECT
    interaction_id,
    
    -- is_premium_visitor (Column 69)
    any(coalesce(
      JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'isPremiumVisitor'),
      'false'
    )) = 'true' AS is_premium_visitor,
    
    -- is_connected (Column 76)
    countIf(event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') > 0 AS is_connected,
    
    -- is_canceled (Column 77)
   -- countIf(event_name = 'CONVERSATION_STATUS_CHANGED' AND coalesce(event_value_2, JSONExtractString(JSONExtractString(event_data, 'string'), 'status')) = 'canceled') > 0 AS is_canceled,
    countIf(event_name = 'CONVERSATION_ENDED' AND lower(event_value_5) = 'canceled') > 0 AS is_canceled,
    -- is_interactive_chat (Column 78)
  
    --countIf(event_name = 'MESSAGE_SENT') > 0 AS is_interactive_chat,
  (
    countIf(event_name = 'MESSAGE_SENT') > 0
    AND
    countIf(event_name = 'MESSAGE_RECEIVED') > 0
) AS is_interactive_chat,
    
    -- is_transferred (Column 79)
    -- Check if transferred via queue_transfer or agent_timeout 
    countIf(
      event_name = 'CONVERSATION_TERMINATED'
      AND event_key_16 = 'TerminationReason'
      AND (event_value_16 = 'queue_transfer' OR event_value_16 = 'agent_timeout')
    ) > 0 AS is_transferred
    
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 9: Time Metrics (Derived)
-- =============================================================================
time_metrics AS (
  SELECT
    interaction_id,
    
    -- agent_handle_time (from agent assigned to end) 
    if(
      nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'), toDateTime64(0, 3)) IS NULL
      OR nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_ENDED'), toDateTime64(0, 3)) IS NULL,
      NULL,
      greatest(0, dateDiff('millisecond',
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'), toDateTime64(0, 3)),
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_ENDED'), toDateTime64(0, 3))
      ))
    ) AS agent_handle_time,

    -- agent_chat_time (from agent assigned to end)
    if(
      nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'), toDateTime64(0, 3)) IS NULL
      OR nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_ENDED'), toDateTime64(0, 3)) IS NULL,
      NULL,
      greatest(0, dateDiff('millisecond',
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'), toDateTime64(0, 3)),
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_ENDED'), toDateTime64(0, 3))
      ))
    ) AS agent_chat_time,
    
    -- first_queue_wait_time (Column 83) - From created to first agent assigned
    if(
      nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_CREATED'), toDateTime64(0, 3)) IS NULL
      OR nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'), toDateTime64(0, 3)) IS NULL,
      NULL,
      greatest(0, dateDiff('millisecond',
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_CREATED'), toDateTime64(0, 3)),
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'), toDateTime64(0, 3))
      ))
    ) AS first_queue_wait_time,
    
    -- last_queue_wait_time (Column 84) - From last queued to last agent assigned
    if(
      nullIf(maxIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_STATUS_CHANGED' AND JSONExtractString(JSONExtractString(event_data, 'string'), 'status') = 'queued'), toDateTime64(0, 3)) IS NULL
      OR nullIf(maxIf(toDateTime64(event_time_epoch / 1000, 3), (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'), toDateTime64(0, 3)) IS NULL,
      NULL,
      greatest(0, dateDiff('millisecond',
        nullIf(maxIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_STATUS_CHANGED' AND JSONExtractString(JSONExtractString(event_data, 'string'), 'status') = 'queued'), toDateTime64(0, 3)),
        nullIf(maxIf(toDateTime64(event_time_epoch / 1000, 3), (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'), toDateTime64(0, 3))
      ))
    ) AS last_queue_wait_time,
    
    -- total_queue_wait_time (Column 85) - From earliest queue event to first agent assigned
    if(
      nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_CREATED'), toDateTime64(0, 3)) IS NULL
      OR nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'), toDateTime64(0, 3)) IS NULL,
      NULL,
      greatest(0, dateDiff('millisecond',
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), event_name = 'CONVERSATION_CREATED'), toDateTime64(0, 3)),
        nullIf(minIf(toDateTime64(event_time_epoch / 1000, 3), (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'), toDateTime64(0, 3))
      ))
    ) AS total_queue_wait_time
    
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 10: Cancellation/Termination Reasons
-- =============================================================================
termination_reasons AS (
  SELECT
    interaction_id,
    
    -- agent_interaction_canceled_reason (Column 93)
    anyIf( ifNull(event_value_16, 'visitor_leave'), event_name = 'CONVERSATION_ENDED' AND lower(event_value_5) = 'canceled') AS agent_interaction_canceled_reason,
    
    -- agent_interaction_termination_reason_text (Column 94)
    anyIf(
      event_value_16,
      event_key_16 = 'TerminationReason' AND event_name = 'CONVERSATION_TERMINATED'
      --event_value_16,
      --event_name IN ('CONVERSATION_TERMINATED','RESERVATION_COMPLETED', 'TASK_COMPLETED', 'CONVERSATION_RESOLVED')
    ) 
  AS agent_interaction_termination_reason_text
    
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 11: Lists of Queues and Agents
-- =============================================================================
lists AS (
  SELECT
    interaction_id,
    
    -- list_of_queues_involved (Column 105)
    arrayStringConcat(
      arrayDistinct(
        groupArray(coalesce(
          event_value_4,
          JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId')
        ))
      ),
      ','
    ) AS list_of_queues_involved,
    
    -- list_of_agents_involved (Column 106)
    arrayStringConcat(
      arrayDistinct(
        groupArray(coalesce(
          event_value_7,
          JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'WorkerName')
        ))
      ),
      ','
    ) AS list_of_agents_involved
    
  FROM base_events_dedup
  WHERE (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name IN ('RESERVATION_ACCEPTED', 'CONVERSATION_UPDATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 11.5: Extract and Parse visitorInfo JSON String
-- =============================================================================
visitor_info_parsed AS (
  SELECT
    interaction_id,
    JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'visitorInfo') AS visitor_info_json_str
  FROM base_events_dedup
  WHERE event_name = 'CONVERSATION_CREATED'
    AND JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'visitorInfo') != ''
),

-- =============================================================================
-- STEP 12: Visitor/Contact Information
-- =============================================================================
visitor_info AS (
  SELECT
    be.interaction_id,
    
    -- consumer_name (Column 107)
    any(be.event_value_12) AS consumer_name,
    
    -- email (Column 119)
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'WorkerAttributes', 'email')) AS email,
    
    -- page_counter_in_section (Column 120)
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'pageCounterInSection')) AS page_counter_in_section,
    
    -- repeat_visitor_count (Column 121)
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'repeatVisitorCount')) AS repeat_visitor_count,
    
    -- Extract visitorInfo as a string first for debugging
    any(vip.visitor_info_json_str) AS visitor_info_str,
    
    -- url (Column 122) - Parse visitorInfo string as JSON
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'url'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'url')
    )) AS url,
    
    -- Geo fields - Parse visitorInfo JSON string using simpleJSONExtractString
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'ipAddress'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'ipAddress')
    )) AS ip_address,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'geoCountry'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'country')
    )) AS country,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'geoCity'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'city')
    )) AS city,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'geoWorldRegion'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'worldRegion')
    )) AS world_region,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'geoPostalCode'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'postalCode')
    )) AS postal_code,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'operatingSystem'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'operatingSystem')
    )) AS operating_system,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'browser'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'browser')
    )) AS browser,
    
    -- device_id - Parse visitorInfo JSON string using simpleJSONExtractString
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'deviceId'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'deviceId')
    )) AS device_id,
    
    -- interactionsourcetype (Column 151) - LAST column from assist_chatsession
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'interactionSourceType')) AS interactionsourcetype
    
  FROM base_events_dedup be
  LEFT JOIN visitor_info_parsed vip ON be.interaction_id = vip.interaction_id
  WHERE be.event_name IN ('CONVERSATION_CREATED')
  GROUP BY be.interaction_id
),

-- =============================================================================
-- STEP 14: Additional timestamps
-- =============================================================================
additional_timestamps AS (
  SELECT
    interaction_id,
    
    -- interactionInitiatedTime - First conversation created
    minIf(event_time_epoch, event_name = 'CONVERSATION_CREATED') AS interaction_initiated_time,
    
    -- interactionEndedTime - Final resolved/completed
    minIf(
      event_time_epoch,
      event_name IN ('CONVERSATION_RESOLVED', 'CONVERSATION_STATUS_CHANGED') 
        AND JSONExtractString(JSONExtractString(event_data, 'string'), 'status') = 'resolved'
    ) AS interaction_ended_time,
    
    -- startTime - Actual start time from queued or assigned
    minIf(
      coalesce(
        toInt64OrNull(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queuedTime')),
        toInt64OrNull(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskDateCreated')),
        event_time_epoch
      ),
      event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned'
    ) AS start_time,
    
    -- conversationtimeout - Auto-close timeout
    any(toInt64OrNull(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'conversationAutoCloseTimeMillis'))) AS conversation_timeout,
    
    -- uuidsessionid - Session UUID
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'uuidsessionid')) AS uuid_session_id,
    
    -- clientId & accountName
    any(client_id) AS client_id,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'accountName')) AS account_name
    
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 16: Queue/Request Information
-- =============================================================================
queue_request_info AS (
  SELECT
    interaction_id,
    
    -- First requested queue info
    argMin(
      tuple(
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId'),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueName'),
        account_id
      ),
      event_time_epoch
    ) AS first_requested_info,
    
    -- Last requested queue info
    /*argMax(
      tuple(
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueId'),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'queueName'),
        account_id
      ),
      event_time_epoch
    ) AS last_requested_info
  */
  argMax(

      tuple(

        event_value_3,
        event_value_4,
        account_id

      ),
      event_time_epoch) AS last_requested_info
    
  FROM base_events_dedup
  WHERE event_name='CONVERSATION_ENDED' AND lower(event_value_5)='canceled'
  -- event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_STATUS_CHANGED') AND (JSONExtractString(JSONExtractString(event_data, 'string'), 'status') = 'queued' OR JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TaskAssignmentStatus') = 'pending')
  
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 17: Agent Session IDs
-- =============================================================================
agent_sessions AS (
  SELECT
    interaction_id,
    
    -- First connected agent session ID
    argMin(
      JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerSid'),
      event_time_epoch
    ) AS first_connected_agent_session_id,
    
    -- Last connected agent session ID
    argMax(
      JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerSid'),
      event_time_epoch
    ) AS last_connected_session_id_agent_id
    
  FROM base_events_dedup
  WHERE (event_name = 'AGENT_ASSIGNED' AND event_value_15 = 'assigned') OR event_name = 'RESERVATION_ACCEPTED'
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 18: Invitation Information
-- =============================================================================
invitation_info AS (
  SELECT
    interaction_id,
    
    -- First invited agent info
    argMin(
      tuple(
        JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'WorkerName'),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerSid'),
        coalesce(event_value_8, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId'))
      ),
      event_time_epoch
    ) AS first_invited_info,
    
    -- Last invited agent info
    argMax(
      tuple(
        JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'WorkerName'),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerSid'),
        coalesce(event_value_8, JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'TeamId'))
      ),
      event_time_epoch
    ) AS last_invited_info
    
  FROM base_events_dedup
  WHERE event_name IN ('RESERVATION_CREATED', 'AGENT_INVITED')
    AND JSONExtractString(JSONExtractString(event_data, 'string'), 'participantRole') = 'OWNER'
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 19: Visitor/Contact Extended Information
-- =============================================================================
visitor_extended_info AS (
  SELECT
    interaction_id,
    
    -- Visitor names
    any(channel_user_id) AS visitor_name,
    
    -- Page/URL info
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'urls')) AS urls,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'page')) AS page,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'invitePage')) AS invite_page,
    
    -- Browser details
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'browserVersion')) AS browser_version,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'browserCapabilities')) AS browser_capabilities,
    
    -- Geographic codes
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'countryCode')) AS country_code,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'regionCode')) AS region_code,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'timeZone')) AS time_zone,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'geo')) AS geo,
    
    -- Network
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'isp')) AS isp,
    
    -- Visitor flags
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'repeatVisit')) AS repeat_visit,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'isVisitorVerified')) AS is_visitor_verified
    
  FROM base_events_dedup
  WHERE event_name IN ('CONTACT_UPDATED', 'CONVERSATION_UPDATED', 'CONVERSATION_CREATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 20: Interaction Context & Routing
-- =============================================================================
interaction_context AS (
  SELECT
    be.interaction_id,
    
    -- Service & Source
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'sourceServiceChannel')) AS source_service_channel,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'buttonName')) AS button_name,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'buttonType')) AS button_type,
    
    -- Source categories
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'sourceCat')) AS source_cat,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'sourceCat2')) AS source_cat2,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'sourceCat3')) AS source_cat3,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'sourceCat4')) AS source_cat4,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'sourceCat5')) AS source_cat5,
    
    -- Routing - Parse from visitorInfo JSON string using simpleJSONExtractString
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'ruleId'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'ruleId')
    )) AS rule_id,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'ruleCatId')) AS rule_cat_id,
    any(coalesce(
      nullIf(simpleJSONExtractString(vip.visitor_info_json_str, 'tpId'), ''),
      JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'targetPopulation')
    )) AS target_population,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'skillType')) AS skill_type,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'priority')) AS priority,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'mode')) AS mode,
    
    -- Session IDs
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'sid')) AS sid,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'psid')) AS psid,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'bd')) AS bd,
    any(JSONExtractString(JSONExtractString(be.event_data, 'string'), 'TaskAttributes', 'pName')) AS p_name
    
  FROM base_events_dedup be
  LEFT JOIN visitor_info_parsed vip ON be.interaction_id = vip.interaction_id
  WHERE be.event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_UPDATED')
  GROUP BY be.interaction_id
),

-- =============================================================================
-- STEP 21: Custom Fields
-- =============================================================================
custom_fields AS (
  SELECT
    interaction_id,
    
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField01')) AS custom_field_01,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField02')) AS custom_field_02,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField03')) AS custom_field_03,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField04')) AS custom_field_04,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField05')) AS custom_field_05,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField06')) AS custom_field_06,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField07')) AS custom_field_07,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField08')) AS custom_field_08,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField09')) AS custom_field_09,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customField10')) AS custom_field_10
    
  FROM base_events_dedup
  WHERE event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_UPDATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 22: Outbound/SMS Fields
-- =============================================================================
outbound_info AS (
  SELECT
    interaction_id,
    
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'sentSMSText')) AS sent_sms_text,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundCampaignId')) AS outbound_campaign_id,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundCampaignName')) AS outbound_campaign_name,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundMessageInitiatorAgentName')) AS outbound_message_initiator_agent_name,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundMessageInitiatorAgentID')) AS outbound_message_initiator_agent_id,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundSMSSentTime')) AS outbound_sms_sent_time,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundProspectFirstName')) AS outbound_prospect_first_name,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'outboundProspectLastName')) AS outbound_prospect_last_name
    
  FROM base_events_dedup
  WHERE event_name IN ('CONVERSATION_CREATED', 'MESSAGE_CREATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 23: Additional Interaction Attributes
-- =============================================================================
interaction_attributes AS (
  SELECT
    interaction_id,
    
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'WorkerAttributes', 'TaskAttributes', 'consumerChannel')) AS consumer_channel,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'topic')) AS topic,
    any(JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'customerState')) AS customer_state,
    
    -- Transfer initiator for async only
    anyIf(
      JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'transferInitiator'),
      lower(coalesce(
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'chatInteractionType'),
        JSONExtractString(JSONExtractString(event_data, 'string'), 'TaskAttributes', 'COMMUNICATION_MODE')
      )) = 'async'
    ) AS transfer_initiator_async
    
  FROM base_events_dedup
  WHERE event_name IN ('MESSAGE_CREATED', 'CONVERSATION_UPDATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 24: Chat Log
-- =============================================================================

  
 bot_info AS (
  SELECT
    ConversationId AS interaction_id,
    EventTimeStampEpoch AS event_time_epoch,
    if(EventName = 'MESSAGE_RECEIVED', 'visitor', 'Brand') AS speaker,
    trimBoth(
        replaceRegexpAll(
            replaceRegexpAll(
                -- Decode entities before tag strip so &lt;p&gt;… becomes <p>… then drops.
                replaceAll(
                    replaceAll(
                        replaceAll(
                            replaceAll(
                                replaceAll(
                                    replaceAll(
                                        replaceAll(
                                            -- JSONExtractString returns '' on non-JSON / missing keys
                                            coalesce(
                                                nullIf(JSONExtractString(ifNull(EventValue1, ''), 'text'), ''),
                                                nullIf(JSONExtractString(ifNull(EventValue1, ''), 'message'), ''),
                                                nullIf(JSONExtractString(ifNull(EventValue1, ''), 'content'), ''),
                                                nullIf(JSONExtractString(ifNull(EventValue1, ''), 'body'), ''),
                                                nullIf(JSONExtractString(ifNull(EventValue1, ''), 'value'), ''),
                                                ifNull(EventValue1, '')
                                            ),
                                            '&amp;', '&'
                                        ),
                                        '&nbsp;', ' '
                                    ),
                                    '&#39;', '\''
                                ),
                                '&apos;', '\''
                            ),
                            '&quot;', '"'
                        ),
                        '&lt;', '<'
                    ),
                    '&gt;', '>'
                ),
                -- HTML tags (complete) + leftover tag names + orphan attrs + JSON blobs/keys + punct
                '(?i)<[^>]*>|</?[A-Za-z][A-Za-z0-9]*|\\s*(?:class|version|style|id|href|src|type|role|aria-[A-Za-z0-9-]+)\\s*=\\s*(\"[^\"]*\"|\'[^\']*\'|[^\\s<>]+)|\\{[^\\n]*\\}|\\[[^\\n]*\\]|\"[A-Za-z_][A-Za-z0-9_]*\"\\s*:\\s*|[\\{\\}\\[\\]<>\"]+',
                ' '
            ),
            '\\s+',
            ' '
        )
    ) AS clean_text
  FROM {{ params.client_schema }}.eg_agentic_runtime_distributed
  WHERE EventName IN ('MESSAGE_RECEIVED','MESSAGE_SENT')
    AND EventValue2 = 'customer' AND    (InteractionId='' or InteractionId IS null)
    --AND ConversationId   IN ('c7e85ffa-435b-48da-ac74-f86c6882dd85','0fe9edda-1c04-4097-9abc-d9741c5f1b10','fa3f2424-7ba4-4cc5-8089-0d92efd00b27')
),
  
usable AS (
    SELECT
        interaction_id,
        event_time_epoch,
        speaker,
        clean_text
    FROM bot_info
    WHERE length(clean_text) > 0
      AND clean_text NOT IN ('HAL-E', 'Employee Information:', 'Employee')
      AND NOT startsWith(clean_text, '/f ')
      AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
      AND positionCaseInsensitive(clean_text, 'Intent: HAL_E') = 0
      AND NOT match(clean_text, '(?i)^(div|span|p|br|strong|hxelement|version)(\\s|$)')
),

combined_chat AS (
    SELECT interaction_id,
    arrayStringConcat(
        arrayMap(
            x -> concat(x.2, ': ', x.3),
            arraySort(
                x -> x.1,
                groupArray((event_time_epoch, speaker, clean_text))
            )
        ),
        '\n'
    ) AS combined_chat_log
    FROM usable
    GROUP BY interaction_id
),

chat_log AS (
  SELECT
    t1.interaction_id,
    
    -- Aggregate all messages into a single chat log, ordered by time
   concat(
        t2.combined_chat_log,
        '\n',
    arrayStringConcat(
      arrayMap(
        x -> x.2,
        arraySort(
          x -> x.1,
          groupArray(
            tuple(
              event_time_epoch,
              nullIf(
                concat(
                  coalesce(
                    event_value_12,
                    if(event_name = 'MESSAGE_SENT', 'Agent', 'Visitor')
                  ),
                  '(',
                  formatDateTime(
                            toTimeZone(
                                toDateTime64(event_time_epoch / 1000, 3),
                                'US/Eastern'
                            ),
                            '%T'),
                  '): ',
                  replaceRegexpAll(
                    replaceRegexpAll(
                      event_value_17,
                      '<[^>]*>\\n|<[^>]*>\\n|<[^<]+?>|amp;',
                      ''
                    ),
                    '[?]{2,}',
                    '?'
                  )
                ),
                ''
              )
            )
          )
        )
      ),
      '\n'
    ) 
     ) AS chat_log
    
  FROM base_events_dedup AS t1
  LEFT JOIN combined_chat AS t2
    ON t1.event_value_2 = t2.interaction_id
  WHERE event_name IN ('MESSAGE_SENT', 'MESSAGE_RECEIVED')
    AND event_value_4 IS NOT NULL
    AND trim(event_value_4) != ''
  GROUP BY t1.interaction_id, combined_chat_log
),

-- =============================================================================
-- STEP 15: Combine All CTEs (Matching Original Column Order)
-- =============================================================================
combined AS (
  SELECT
    -- Column 39: account_id
    ca.account_id AS account_id,
    
    -- Column 40: chat_conversation_id
    ca.chat_conversation_id AS chat_conversation_id,
    
    -- Column 41: agent_interaction_type
    ca.agent_interaction_type AS agent_interaction_type,
    
    -- Column 42: agent_interaction_queued_time
    if(
      ca.agent_interaction_queued_time_raw = 0,
      ts.agent_interaction_start_time,
      toDateTime64(ca.agent_interaction_queued_time_raw / 1000, 3)
    ) AS agent_interaction_queued_time,
    
    -- Column 43: time_elapsed_on_queue
    multiIf(
      ca.agent_interaction_queued_time_raw = 0 AND lower(ca.agent_interaction_type) = 'async', 0,
      ca.agent_interaction_queued_time_raw > 0 AND lower(ca.agent_interaction_type) = 'async', tm.total_queue_wait_time,
      lower(ca.agent_interaction_type) = 'sync' AND ts.agent_interaction_requested_time IS NOT NULL AND ts.agent_interaction_start_time IS NOT NULL, 
        greatest(0, dateDiff('millisecond', ts.agent_interaction_requested_time, ts.agent_interaction_start_time)),
      tm.total_queue_wait_time
    ) AS time_elapsed_on_queue,
    
    -- Column 55: agent_interaction_start_time
    ts.agent_interaction_start_time AS agent_interaction_start_time,
    
    -- Column 56: agent_interaction_end_time
    ts.agent_interaction_end_time AS agent_interaction_end_time,
    
    -- Column 57-58: SKIP (agent_first_response_time - from transcript table)
    CAST(NULL AS Nullable(String)) AS agent_first_response_time,
    
    -- Columns 59-66: last_connected info with COALESCE logic
    coalesce(la.last_agent_info.1, las.last_agent_started_info.1) AS last_connected_account_id_temp,
    coalesce(la.last_agent_info.2, las.last_agent_started_info.2) AS last_connected_queue_id,
    coalesce(la.last_agent_info.3, las.last_agent_started_info.3) AS last_connected_queue_name,
    coalesce(la.last_agent_info.4, las.last_agent_started_info.4) AS last_connected_agent_id,
    coalesce(la.last_agent_info.5, las.last_agent_started_info.5) AS last_connected_agent_name,
    coalesce(la.last_agent_info.7, las.last_agent_started_info.7) AS last_connected_agent_team_id,
    coalesce(la.last_agent_info.8, las.last_agent_started_info.8) AS last_connected_agent_team_name,
    
    -- Column 67: num_agent_transfers_initiated
    tr.num_agent_transfers_initiated AS num_agent_transfers_initiated,
    
    -- Column 68: num_agent_transfers_completed
    tr.num_agent_transfers_completed AS num_agent_transfers_completed,
    
    -- Column 69: is_premium_visitor
    sf.is_premium_visitor AS is_premium_visitor,
    
    -- Column 70: chat_interaction_id
    ts.chat_interaction_id AS chat_interaction_id,
    
    -- Column 71: agent_interaction_requested_time
    ts.agent_interaction_requested_time AS agent_interaction_requested_time,
    
    -- Column 72: agent_interaction_interactive_time
    ts.agent_interaction_interactive_time AS agent_interaction_interactive_time,
    
    -- Column 73: agent_interaction_terminated_time
    ts.agent_interaction_terminated_time AS agent_interaction_terminated_time,
    
    -- agentExitType
    ts.agent_exit_type AS agent_exit_type,
    
    -- Column 75: chat_abandoned_time
    ts.chat_abandoned_time AS chat_abandoned_time,
    
    -- interaction_cancelled_time
    ts.interaction_cancelled_time AS interaction_cancelled_time,
    
    -- Column 76: chat_start_date_time
    ts.chat_start_date_time AS chat_start_date_time,
    
    -- Column 77: chat_end_date_time
    ts.chat_end_date_time AS chat_end_date_time,
    
    -- Column 78: is_connected
    sf.is_connected AS is_connected,
    
    -- Column 79: is_canceled
    sf.is_canceled AS is_canceled,
    
    -- Column 80: is_interactive_chat
    sf.is_interactive_chat AS is_interactive_chat,
    
    -- Column 81: is_transferred
    sf.is_transferred AS is_transferred,
    
    -- Column 82: agent_handle_time
    tm.agent_handle_time AS agent_handle_time,

    -- Column 83: agent_chat_time
    tm.agent_chat_time AS agent_chat_time,
    
    -- Column 85: first_queue_wait_time
    tm.first_queue_wait_time AS first_queue_wait_time,
    
    -- Column 86: last_queue_wait_time
    tm.last_queue_wait_time AS last_queue_wait_time,
    
    -- Column 87: total_queue_wait_time
    tm.total_queue_wait_time AS total_queue_wait_time,
    
    -- Column 88-90: SLA flags
    if(tm.first_queue_wait_time < 30000, 1, 0) AS is_first_agent_connected_sla_met,
    if(tm.last_queue_wait_time < 30000, 1, 0) AS is_last_agent_connected_sla_met,
    if(tm.total_queue_wait_time < 30000, 1, 0) AS is_connected_sla_met,
    
    -- Column 91-92: SKIP (agent/consumer average response time - from transcript table)
    CAST(NULL AS Nullable(String)) AS agent_average_response_time,
    CAST(NULL AS Nullable(String)) AS consumer_average_response_time,
    
    -- Column 93: agent_interaction_canceled_reason
    tr_reasons.agent_interaction_canceled_reason AS agent_interaction_canceled_reason,
    
    -- Column 94: agent_interaction_termination_reason_text
    tr_reasons.agent_interaction_termination_reason_text AS agent_interaction_termination_reason_text,
    
    -- Columns 95-102: first_connected info
    fa.first_agent_info.1 AS first_connected_account_id,
    fa.first_agent_info.2 AS first_connected_queue_id,
    fa.first_agent_info.3 AS first_connected_queue_name,
    fa.first_agent_info.4 AS first_connected_agent_id,
    fa.first_agent_info.5 AS first_connected_agent_name,
    fa.first_agent_info.6 AS first_connected_agent_enterprise_id,
    fa.first_agent_info.7 AS first_connected_agent_team_id,
    fa.first_agent_info.8 AS first_connected_agent_team_name,
    
    -- Columns 103-104: last_connected account and enterprise (with COALESCE)
    coalesce(la.last_agent_info.1, las.last_agent_started_info.1) AS last_connected_account_id,
    coalesce(la.last_agent_info.6, las.last_agent_started_info.6) AS last_connected_agent_enterprise_id,
    
    -- Columns 105-106: lists
    lists.list_of_queues_involved AS list_of_queues_involved,
    lists.list_of_agents_involved AS list_of_agents_involved,
    
    -- Column 107: consumer_name
    vi.consumer_name AS consumer_name,
    
    -- Column 108: SKIP (hold_on_count - from transcript table)
    CAST(NULL AS Nullable(String)) AS hold_on_count,
    
    -- Columns 109-114: SKIP (transcript metrics - from transcript table)
    CAST(NULL AS Nullable(String)) AS num_agent_chat_turns,
    CAST(NULL AS Nullable(String)) AS num_agent_words,
    CAST(NULL AS Nullable(String)) AS num_consumer_words,
    CAST(NULL AS Nullable(String)) AS num_agent_lines,
    CAST(NULL AS Nullable(String)) AS num_consumer_lines,
    CAST(NULL AS Nullable(String)) AS num_agent_art,
    CAST(NULL AS Nullable(String)) AS num_consumer_art,
    CAST(NULL AS Nullable(String)) AS num_agent_msgs,
    CAST(NULL AS Nullable(String)) AS num_consumer_msgs,
    
    -- Columns 115-118: transfer counts
    tr.num_account_transfers_initiated AS num_account_transfers_initiated,
    tr.num_queue_transfers_initiated AS num_queue_transfers_initiated,
    tr.num_account_transfers_completed AS num_account_transfers_completed,
    tr.num_queue_transfers_completed AS num_queue_transfers_completed,
    
    -- Column 119: email
    vi.email AS email,
    
    -- Column 120: page_counter_in_section
    vi.page_counter_in_section AS page_counter_in_section,
    
    -- Column 121: repeat_visitor_count
    vi.repeat_visitor_count AS repeat_visitor_count,
    
    -- Column 122: url
    vi.url AS url,
    
    -- Add visitorInfo extracted fields
    vi.ip_address AS ip_address,
    vi.country AS geo_country,
    vi.city AS geo_city,
    vi.world_region AS geo_world_region,
    vi.postal_code AS geo_postal_code,
    vi.operating_system AS operating_system,
    vi.browser AS browser,
    
    -- Columns 123-131: SKIP (prechat survey - from online table, not assist_chatsession)
    CAST(NULL AS Nullable(DateTime64(3))) AS prechat_survey_submit_time,
    CAST(NULL AS Nullable(String)) AS prechat_survey_questions,
    CAST(NULL AS Nullable(String)) AS prechat_survey_details,
    CAST(NULL AS Nullable(String)) AS enc_prechat_survey,
    
    -- Columns 139-147: SKIP (survey metrics from other tables)
    CAST(NULL AS Nullable(String)) AS nps_via_chatcx_survey,
    CAST(NULL AS Nullable(String)) AS nps_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String)) AS csat_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String)) AS issue_resolution_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String)) AS asat_value_via_chatcx_survey,
    CAST(NULL AS Nullable(UInt8)) AS fcr_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String)) AS inscope_interaction,
    CAST(NULL AS Nullable(String)) AS reason_for_non_resolution,
    CAST(NULL AS Nullable(String)) AS enc_custom_field,
    
    -- Column 148-151: Additional assist_chatsession columns
    vi.interactionsourcetype AS assist_chatsession_interactionsourcetype,
    
    -- Store interaction_id for final select
    ca.interaction_id AS interaction_id,

    ats.interaction_initiated_time AS interaction_initiated_time,
    ats.interaction_ended_time AS interaction_ended_time,
    ats.start_time AS start_time,
    ats.conversation_timeout AS conversation_timeout,
    ats.uuid_session_id AS uuid_session_id,
    ats.client_id AS client_id,
    ats.account_name AS account_name,
    
    -- From queue_request_info
    qri.first_requested_info.1 AS first_requested_queue_id,
    qri.first_requested_info.2 AS first_requested_queue_name,
    qri.first_requested_info.3 AS first_requested_account_id,
    qri.last_requested_info.1 AS last_requested_queue_id,
    qri.last_requested_info.2 AS last_requested_queue_name,
    qri.last_requested_info.3 AS last_requested_account_id,
    
    -- From agent_sessions
    ags_sess.first_connected_agent_session_id AS first_connected_agent_session_id,
    ags_sess.last_connected_session_id_agent_id AS last_connected_session_id_agent_id,
    
    -- From invitation_info
    inv.first_invited_info.1 AS first_invited_agent_id,
    inv.first_invited_info.2 AS first_invited_agent_session_id,
    inv.first_invited_info.3 AS first_invited_agent_team_id,
    inv.last_invited_info.1 AS last_invited_agent_id,
    inv.last_invited_info.2 AS last_invited_agent_session_id,
    inv.last_invited_info.3 AS last_invited_agent_team_id,
    
    -- From visitor_extended_info
    vei.visitor_name AS visitor_name,
    vei.urls AS urls,
    vei.page AS page,
    vei.invite_page AS invite_page,
    vei.browser_version AS browser_version,
    vei.browser_capabilities AS browser_capabilities,
    vi.device_id AS device_id,
    vei.country_code AS country_code,
    vei.region_code AS region_code,
    vei.time_zone AS time_zone,
    vei.geo AS geo,
    vei.isp AS isp,
    vei.repeat_visit AS repeat_visit,
    vei.is_visitor_verified AS is_visitor_verified,
    
    -- From interaction_context
    ic.source_service_channel AS source_service_channel,
    ic.button_name AS button_name,
    ic.button_type AS button_type,
    ic.source_cat AS source_cat,
    ic.source_cat2 AS source_cat2,
    ic.source_cat3 AS source_cat3,
    ic.source_cat4 AS source_cat4,
    ic.source_cat5 AS source_cat5,
    ic.rule_id AS rule_id,
    ic.rule_cat_id AS rule_cat_id,
    ic.target_population AS target_population,
    ic.skill_type AS skill_type,
    ic.priority AS priority,
    ic.mode AS mode,
    ic.sid AS sid,
    ic.psid AS psid,
    ic.bd AS bd,
    ic.p_name AS p_name,
    
    -- From custom_fields
    cf.custom_field_01 AS custom_field_01,
    cf.custom_field_02 AS custom_field_02,
    cf.custom_field_03 AS custom_field_03,
    cf.custom_field_04 AS custom_field_04,
    cf.custom_field_05 AS custom_field_05,
    cf.custom_field_06 AS custom_field_06,
    cf.custom_field_07 AS custom_field_07,
    cf.custom_field_08 AS custom_field_08,
    cf.custom_field_09 AS custom_field_09,
    cf.custom_field_10 AS custom_field_10,
    
    -- From outbound_info
    obi.sent_sms_text AS sent_sms_text,
    obi.outbound_campaign_id AS outbound_campaign_id,
    obi.outbound_campaign_name AS outbound_campaign_name,
    obi.outbound_message_initiator_agent_name AS outbound_message_initiator_agent_name,
    obi.outbound_message_initiator_agent_id AS outbound_message_initiator_agent_id,
    obi.outbound_sms_sent_time AS outbound_sms_sent_time,
    obi.outbound_prospect_first_name AS outbound_prospect_first_name,
    obi.outbound_prospect_last_name AS outbound_prospect_last_name,
    
    -- From interaction_attributes
    ia.consumer_channel AS consumer_channel,
    ia.topic AS topic,
    ia.customer_state AS customer_state,
    ia.transfer_initiator_async AS transfer_initiator_async,
    cl.chat_log AS chat_log
    
  FROM core_attributes ca
  LEFT JOIN timestamps ts ON ca.interaction_id = ts.interaction_id
  LEFT JOIN first_agent fa ON ca.interaction_id = fa.interaction_id
  LEFT JOIN last_agent la ON ca.interaction_id = la.interaction_id
  LEFT JOIN last_agent_started las ON ca.interaction_id = las.interaction_id
  LEFT JOIN transfers tr ON ca.interaction_id = tr.interaction_id
  LEFT JOIN status_flags sf ON ca.interaction_id = sf.interaction_id
  LEFT JOIN time_metrics tm ON ca.interaction_id = tm.interaction_id
  LEFT JOIN termination_reasons tr_reasons ON ca.interaction_id = tr_reasons.interaction_id
  LEFT JOIN lists ON ca.interaction_id = lists.interaction_id
  LEFT JOIN visitor_info vi ON ca.interaction_id = vi.interaction_id
  LEFT JOIN additional_timestamps ats ON ca.interaction_id = ats.interaction_id
  LEFT JOIN queue_request_info qri ON ca.interaction_id = qri.interaction_id
  LEFT JOIN agent_sessions ags_sess ON ca.interaction_id = ags_sess.interaction_id
  LEFT JOIN invitation_info inv ON ca.interaction_id = inv.interaction_id
  LEFT JOIN visitor_extended_info vei ON ca.interaction_id = vei.interaction_id
  LEFT JOIN interaction_context ic ON ca.interaction_id = ic.interaction_id
  LEFT JOIN custom_fields cf ON ca.interaction_id = cf.interaction_id
  LEFT JOIN outbound_info obi ON ca.interaction_id = obi.interaction_id
  LEFT JOIN interaction_attributes ia ON ca.interaction_id = ia.interaction_id
  LEFT JOIN chat_log cl ON ca.interaction_id = cl.interaction_id
),

-- =============================================================================
-- STEP 25: Calculate Previous Interaction Values using Window Functions
-- =============================================================================
with_previous_values AS (
  SELECT
    *,
    -- Get previous interaction_id within same conversation_id, ordered by start time
    lagInFrame(interaction_id, 1) OVER (
      PARTITION BY chat_conversation_id 
      ORDER BY agent_interaction_start_time
    ) AS previous_interaction_id,
    
    -- Get previous agent_id (last connected agent from previous interaction)
    lagInFrame(last_connected_agent_id, 1) OVER (
      PARTITION BY chat_conversation_id 
      ORDER BY agent_interaction_start_time
    ) AS previous_interaction_agent_id,
    
    -- Get previous queue_id (last connected queue from previous interaction)
    lagInFrame(last_connected_queue_id, 1) OVER (
      PARTITION BY chat_conversation_id 
      ORDER BY agent_interaction_start_time
    ) AS previous_queue_id,
    
    -- Get previous interaction end state (canceled/resolved/terminated status)
    lagInFrame(
      multiIf(
        is_canceled, 'canceled',
        agent_interaction_end_time IS NOT NULL, 'resolved',
        agent_interaction_terminated_time IS NOT NULL, 'terminated',
        'unknown'
      ),
      1
    ) OVER (
      PARTITION BY chat_conversation_id 
      ORDER BY agent_interaction_start_time
    ) AS previous_interaction_end_state,
    
    -- Get previous interaction wrapup note (if available - will be NULL for Chatwoot)
    lagInFrame(agent_interaction_termination_reason_text, 1) OVER (
      PARTITION BY chat_conversation_id 
      ORDER BY agent_interaction_start_time
    ) AS previous_interaction_wrapup_note
    
  FROM combined
)

-- =============================================================================
-- FINAL SELECT (Columns from assist_chatsession only, in original order)
-- =============================================================================
SELECT
  interaction_id,
  account_id,
  chat_conversation_id,
  agent_interaction_type,
  agent_interaction_queued_time,
  time_elapsed_on_queue,
  previous_interaction_id,
  previous_interaction_agent_id,
  previous_queue_id,
  previous_interaction_end_state,
  previous_interaction_wrapup_note,
  agent_interaction_start_time,
  agent_interaction_end_time,
  agent_first_response_time,
  last_connected_queue_id,
  last_connected_queue_name,
  last_connected_agent_id,
  last_connected_agent_name,
  last_connected_agent_team_id,
  last_connected_agent_team_name,
  num_agent_transfers_initiated,
  num_agent_transfers_completed,
  is_premium_visitor,
  chat_interaction_id,
  agent_interaction_requested_time,
  agent_interaction_interactive_time,
  agent_interaction_terminated_time,
  agent_exit_type,
  chat_abandoned_time,
  interaction_cancelled_time,
  chat_start_date_time,
  chat_end_date_time,
  is_connected,
  is_canceled,
  is_interactive_chat,
  is_transferred,
  agent_handle_time,
  agent_chat_time,
  first_queue_wait_time,
  last_queue_wait_time,
  total_queue_wait_time,
  is_first_agent_connected_sla_met,
  is_last_agent_connected_sla_met,
  is_connected_sla_met,
  agent_average_response_time,
  consumer_average_response_time,
  agent_interaction_canceled_reason,
  agent_interaction_termination_reason_text,
  first_connected_account_id,
  first_connected_queue_id,
  first_connected_queue_name,
  first_connected_agent_id,
  first_connected_agent_name,
  first_connected_agent_enterprise_id,
  first_connected_agent_team_id,
  first_connected_agent_team_name,
  last_connected_account_id,
  last_connected_agent_enterprise_id,
  list_of_queues_involved,
  list_of_agents_involved,
  consumer_name,
  hold_on_count,
  num_agent_chat_turns,
  num_agent_words,
  num_consumer_words,
  num_agent_lines,
  num_consumer_lines,
  num_agent_art,
  num_consumer_art,
  num_agent_msgs,
  num_consumer_msgs,
  num_account_transfers_initiated,
  num_queue_transfers_initiated,
  num_account_transfers_completed,
  num_queue_transfers_completed,
  email,
  page_counter_in_section,
  repeat_visitor_count,
  url,
  ip_address,
  geo_country,
  geo_city,
  geo_world_region,
  geo_postal_code,
  operating_system,
  browser,
  prechat_survey_submit_time,
  prechat_survey_questions,
  prechat_survey_details,
  enc_prechat_survey,
  nps_via_chatcx_survey,
  nps_value_via_chatcx_survey,
  csat_value_via_chatcx_survey,
  issue_resolution_value_via_chatcx_survey,
  asat_value_via_chatcx_survey,
  fcr_value_via_chatcx_survey,
  inscope_interaction,
  reason_for_non_resolution,
  enc_custom_field,
  assist_chatsession_interactionsourcetype,
  interaction_initiated_time,
  interaction_ended_time,
  start_time,
  conversation_timeout,
  uuid_session_id,
  client_id,
  account_name,
  first_requested_queue_id,
  first_requested_queue_name,
  first_requested_account_id,
  last_requested_queue_id,
  last_requested_queue_name,
  last_requested_account_id,
  first_connected_agent_session_id,
  last_connected_session_id_agent_id,
  first_invited_agent_id,
  first_invited_agent_session_id,
  first_invited_agent_team_id,
  last_invited_agent_id,
  last_invited_agent_session_id,
  last_invited_agent_team_id,
  visitor_name,
  urls,
  page,
  invite_page,
  browser_version,
  browser_capabilities,
  device_id,
  country_code,
  region_code,
  time_zone,
  geo,
  isp,
  repeat_visit,
  is_visitor_verified,
  source_service_channel,
  button_name,
  button_type,
  source_cat,
  source_cat2,
  source_cat3,
  source_cat4,
  source_cat5,
  rule_id,
  rule_cat_id,
  target_population,
  skill_type,
  priority,
  mode,
  sid,
  psid,
  bd,
  p_name,
  custom_field_01,
  custom_field_02,
  custom_field_03,
  custom_field_04,
  custom_field_05,
  custom_field_06,
  custom_field_07,
  custom_field_08,
  custom_field_09,
  custom_field_10,
  sent_sms_text,
  outbound_campaign_id,
  outbound_campaign_name,
  outbound_message_initiator_agent_name,
  outbound_message_initiator_agent_id,
  outbound_sms_sent_time,
  outbound_prospect_first_name,
  outbound_prospect_last_name,
  consumer_channel,
  topic,
  customer_state,
  transfer_initiator_async,
  chat_log,
  now64(3) AS inserted_at
  
FROM with_previous_values 
WHERE toDate(agent_interaction_requested_time) >= toDate('{{ params.cutoff_date }}')
ORDER BY agent_interaction_start_time DESC)
