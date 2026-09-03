-- =============================================================================
-- assist_chatsession — corrected build
--
-- Same output contract as queries/assist_chatsession__original.sql. Every
-- change here maps to a numbered finding in REVIEW.md; see that file for the
-- reproduction of each defect.
--
-- Two conventions are applied throughout, because most of the original bugs
-- came from breaking them:
--
--   1. The payload is unwrapped exactly once, into `payload`, and every JSON
--      path reads from it. The original mixed `JSONExtractString(data, ...)`
--      with `JSONExtractString(JSONExtractString(data,'string'), ...)`, so one
--      of the two families always returned ''.
--   2. Anything that can be absent is turned into a real NULL at the point it
--      is read (`nullIf(x, '')`). `coalesce()` cannot see '' as missing, and
--      neither can `IS NULL`, which is what silently disabled ~40 fallbacks.
--
-- The positional EventValue -> field mapping in `base_events` is the one thing
-- that cannot be derived from the query itself: the original contained two
-- contradictory mappings for the same events. The mapping below is per event
-- type and must be confirmed against the producer's contract.
-- =============================================================================
WITH
base_events AS (
  SELECT
    -- Unwrap the payload once. Tolerates both shapes: {"string":"{...}"} and a
    -- plain JSON object.
    if(JSONHas(data, 'string'), JSONExtractString(data, 'string'), data) AS payload,

    EventName                                    AS event_name,
    EventUniqueId                                AS event_unique_id,
    -- Cast to a signed type: elsewhere this value is combined with
    -- toInt64OrNull(...) results, and Int64/UInt64 has no common supertype.
    toInt64(EventTimeStampEpoch)                 AS event_time_epoch,
    toDateTime64(EventTimeStampEpoch / 1000, 3)  AS event_timestamp,
    ChannelUserId                                AS channel_user_id,
    ClientOrg                                    AS client_id,

    -- --- identifiers ------------------------------------------------------
    coalesce(
      nullIf(InteractionId, ''),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'interactionId'), ''),
      nullIf(JSONExtractString(payload, 'TaskSid'), '')
    )                                            AS interaction_id,

    coalesce(
      nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'conversationId'), ''),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'chatConversationId'), ''),
      -- EventValue2 only carries the conversation id on conversation-scoped
      -- events; on message events it drifts.
      if(event_name LIKE 'CONVERSATION%' OR event_name IN ('AGENT_ASSIGNED', 'RESERVATION_ACCEPTED'),
         nullIf(EventValue2, ''), NULL)
    )                                            AS conversation_id,

    coalesce(
      nullIf(EventValue1, ''),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'accountId'), '')
    )                                            AS account_id,

    -- --- event classification --------------------------------------------
    ((event_name = 'AGENT_ASSIGNED' AND EventValue15 = 'assigned')
      OR event_name = 'RESERVATION_ACCEPTED')    AS is_agent_connect,

    event_name IN ('MESSAGE_SENT', 'MESSAGE_RECEIVED', 'MESSAGE_CREATED')
                                                 AS is_message,
    -- The visitor's traffic arrives as MESSAGE_RECEIVED; the original looked
    -- for MESSAGE_SENT with a 'user' role, which never co-occur.
    (event_name = 'MESSAGE_RECEIVED' OR lower(EventValue18) = 'user')
                                                 AS is_visitor_message,

    -- --- agent / queue identity, normalised per event type ----------------
    coalesce(
      multiIf(event_name = 'AGENT_ASSIGNED',      nullIf(EventValue3, ''),
              event_name = 'RESERVATION_ACCEPTED', nullIf(EventValue6, ''),
              NULL),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'queueId'), '')
    )                                            AS queue_id,

    coalesce(
      if(event_name = 'AGENT_ASSIGNED', nullIf(EventValue4, ''), NULL),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'queueName'), '')
    )                                            AS queue_name,

    coalesce(
      multiIf(event_name = 'AGENT_ASSIGNED',      nullIf(EventValue6, ''),
              event_name = 'RESERVATION_ACCEPTED', nullIf(EventValue2, ''),
              NULL),
      nullIf(JSONExtractString(payload, 'WorkerAttributes', 'WorkerName'), '')
    )                                            AS agent_id,

    coalesce(
      multiIf(event_name = 'AGENT_ASSIGNED',      nullIf(EventValue7, ''),
              event_name = 'RESERVATION_ACCEPTED', nullIf(EventValue3, ''),
              NULL),
      nullIf(JSONExtractString(payload, 'WorkerAttributes', 'full_name'), '')
    )                                            AS agent_name,

    -- The original read EventValue4 here, which is the queue name on
    -- AGENT_ASSIGNED, so the enterprise id column echoed the queue name.
    coalesce(
      if(event_name = 'RESERVATION_ACCEPTED', nullIf(EventValue4, ''), NULL),
      nullIf(JSONExtractString(payload, 'WorkerAttributes', 'email'), '')
    )                                            AS agent_enterprise_id,

    coalesce(
      nullIf(EventValue8, ''),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'TeamId'), '')
    )                                            AS agent_team_id,

    coalesce(
      if(event_name = 'AGENT_ASSIGNED', nullIf(EventValue9, ''), NULL),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'TeamName'), '')
    )                                            AS agent_team_name,

    nullIf(JSONExtractString(payload, 'WorkerSid'), '')
                                                 AS worker_sid,

    -- --- lifecycle --------------------------------------------------------
    lower(nullIf(EventValue5, ''))               AS end_status,
    if(EventKey16 = 'TerminationReason', nullIf(EventValue16, ''), NULL)
                                                 AS termination_reason,
    nullIf(EventValue16, '')                     AS event_value_16,
    nullIf(JSONExtractString(payload, 'status'), '')
                                                 AS conversation_status,
    nullIf(JSONExtractString(payload, 'TaskAttributes', 'TransferType'), '')
                                                 AS transfer_type,
    nullIf(JSONExtractString(payload, 'TaskAttributes', 'TransferStatus'), '')
                                                 AS transfer_status,

    -- --- messages ---------------------------------------------------------
    nullIf(EventValue4, '')                      AS message_id,
    nullIf(EventValue12, '')                     AS message_author,
    nullIf(EventValue17, '')                     AS message_body,

    -- --- visitor payload --------------------------------------------------
    nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'visitorInfo'), '')
                                                 AS visitor_info,
    nullIf(EventValue12, '')                     AS consumer_name

  FROM {{ params.client_schema }}.eg_assist_cw_distributed
  -- Compare on the stored epoch so the partition/primary key can be used;
  -- wrapping the column in fromUnixTimestamp64Milli()/toDate() defeats pruning.
  WHERE EventTimeStampEpoch >= toUnixTimestamp64Milli(toDateTime64('{{ params.cutoff_date }} 00:00:00', 3, 'UTC'))
),

-- =============================================================================
-- DEDUPLICATION: one row per EventUniqueId
-- =============================================================================
base_events_dedup AS (
  SELECT * EXCEPT rn
  FROM (
    SELECT
      *,
      row_number() OVER (PARTITION BY event_unique_id ORDER BY event_time_epoch DESC) AS rn
    FROM base_events
    -- Events with no resolvable interaction id cannot be attributed. The
    -- original grouped them all together under '' and merged unrelated
    -- conversations into a single output row.
    WHERE interaction_id IS NOT NULL
  )
  WHERE rn = 1
),

-- =============================================================================
-- STEP 2: Core interaction attributes
-- =============================================================================
core_attributes AS (
  SELECT
    interaction_id,

    coalesce(
      anyIf(account_id, event_name = 'CONVERSATION_CREATED'),
      any(account_id)
    )                                                     AS account_id,

    -- Read the conversation id off CONVERSATION_CREATED first; `any()` over
    -- every event of the interaction picks an arbitrary row.
    coalesce(
      anyIf(conversation_id, event_name = 'CONVERSATION_CREATED'),
      any(conversation_id)
    )                                                     AS chat_conversation_id,

    coalesce(
      anyIf(
        coalesce(
          nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'chatInteractionType'), ''),
          nullIf(JSONExtractString(payload, 'TaskAttributes', 'chatInteractionType'), '')
        ),
        event_name = 'CONVERSATION_CREATED'
      ),
      ''
    )                                                     AS agent_interaction_type,

    nullIf(minIf(event_time_epoch, event_name = 'CONVERSATION_CREATED'), 0)
                                                          AS agent_interaction_queued_time_raw

  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 3: Timestamps
-- =============================================================================
timestamps AS (
  SELECT
    interaction_id,

    -- Prefer the actual connect event; only fall back to the first message.
    coalesce(
      nullIf(minIf(event_timestamp, is_agent_connect), toDateTime64(0, 3)),
      nullIf(minIf(event_timestamp, is_message), toDateTime64(0, 3))
    )                                                     AS agent_interaction_start_time,

    nullIf(minIf(event_timestamp, event_name = 'CONVERSATION_ENDED'), toDateTime64(0, 3))
                                                          AS agent_interaction_end_time,

    nullIf(minIf(event_timestamp, event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_STATUS_CHANGED')), toDateTime64(0, 3))
                                                          AS agent_interaction_requested_time,

    -- First inbound visitor message.
    nullIf(minIf(event_timestamp, is_message AND is_visitor_message), toDateTime64(0, 3))
                                                          AS agent_interaction_interactive_time,

    -- CONVERSATION_TERMINATED, not CONVERSATION_ENDED: the original made this
    -- column an exact duplicate of agent_interaction_end_time.
    nullIf(minIf(event_timestamp, event_name = 'CONVERSATION_TERMINATED'), toDateTime64(0, 3))
                                                          AS agent_interaction_terminated_time,

    if(countIf(event_name = 'CONVERSATION_TERMINATED'
               AND lower(coalesce(termination_reason, event_value_16, '')) IN ('agent_timeout', 'agent_pass')) > 0,
       'agentNotAccepted',
       CAST(NULL AS Nullable(String)))                     AS agent_exit_type,

    nullIf(minIf(event_timestamp, event_name = 'CONVERSATION_ENDED' AND end_status = 'canceled'), toDateTime64(0, 3))
                                                          AS chat_abandoned_time,

    nullIf(minIf(event_timestamp, is_agent_connect), toDateTime64(0, 3))
                                                          AS chat_start_date_time,

    -- Ultimate fallback for the output date filter, so interactions that never
    -- emitted CONVERSATION_CREATED are not dropped silently.
    min(event_timestamp)                                  AS first_event_time

  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 4/5/6: Agent information (single normalised CTE)
--
-- Replaces first_agent / last_agent / last_agent_started. Those three read
-- overlapping event sets with three different positional mappings and were
-- stitched together with coalesce() across a LEFT JOIN, which never falls
-- through because a missed LEFT JOIN yields '' rather than NULL.
-- =============================================================================
agent_info AS (
  SELECT
    interaction_id,

    argMin(tuple(account_id, queue_id, queue_name, agent_id, agent_name,
                 agent_enterprise_id, agent_team_id, agent_team_name),
           event_time_epoch)                              AS first_agent_info,
    argMax(tuple(account_id, queue_id, queue_name, agent_id, agent_name,
                 agent_enterprise_id, agent_team_id, agent_team_name),
           event_time_epoch)                              AS last_agent_info,

    argMin(worker_sid, event_time_epoch)                   AS first_connected_agent_session_id,
    argMax(worker_sid, event_time_epoch)                   AS last_connected_session_id_agent_id,

    arrayStringConcat(arrayDistinct(groupArray(queue_id)), ',')   AS list_of_queues_involved,
    arrayStringConcat(arrayDistinct(groupArray(agent_name)), ',') AS list_of_agents_involved

  FROM base_events_dedup
  WHERE is_agent_connect
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 7: Transfers (interaction-level part)
--
-- The original gated every counter on a row_number() computed over the whole
-- unfiltered event partition, so the flags were ~never 1; the "completed"
-- counters additionally required one event to be both CONVERSATION_TERMINATED
-- and CONVERSATION_CREATED. "Completed" is a conversation-level fact and is
-- derived in with_previous_values instead.
-- =============================================================================
transfers AS (
  SELECT
    interaction_id,

    countIf(event_name = 'CONVERSATION_TERMINATED' AND termination_reason = 'agent_timeout')
                                                          AS num_agent_transfers_initiated,
    countIf(event_name = 'CONVERSATION_TERMINATED' AND termination_reason = 'queue_transfer')
                                                          AS num_queue_transfers_initiated,

    countIf(transfer_type = 'account')                     AS num_account_transfers_initiated,
    countIf(transfer_type = 'account' AND transfer_status = 'completed')
                                                          AS num_account_transfers_completed

  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 8: Status flags
-- =============================================================================
status_flags AS (
  SELECT
    interaction_id,

    -- isPremiumVisitor is only present on CONVERSATION_CREATED; `any()` over
    -- all events returned whichever row the scan happened to reach first.
    countIf(JSONExtractString(payload, 'TaskAttributes', 'isPremiumVisitor') = 'true') > 0
                                                          AS is_premium_visitor,

    countIf(is_agent_connect) > 0                          AS is_connected,
    countIf(event_name = 'CONVERSATION_ENDED' AND end_status = 'canceled') > 0
                                                          AS is_canceled,
    (countIf(event_name = 'MESSAGE_SENT') > 0 AND countIf(event_name = 'MESSAGE_RECEIVED') > 0)
                                                          AS is_interactive_chat,
    countIf(event_name = 'CONVERSATION_TERMINATED'
            AND termination_reason IN ('queue_transfer', 'agent_timeout')) > 0
                                                          AS is_transferred

  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 9: Time metrics
-- =============================================================================
time_metrics AS (
  SELECT
    interaction_id,
    first_connect_time,
    last_connect_time,
    conversation_created_time,
    conversation_ended_time,
    last_queued_time,

    if(first_connect_time IS NULL OR conversation_ended_time IS NULL, NULL,
       greatest(0, dateDiff('millisecond', first_connect_time, conversation_ended_time)))
                                                          AS agent_handle_time,

    if(first_connect_time IS NULL OR conversation_ended_time IS NULL, NULL,
       greatest(0, dateDiff('millisecond', first_connect_time, conversation_ended_time)))
                                                          AS agent_chat_time,

    if(conversation_created_time IS NULL OR first_connect_time IS NULL, NULL,
       greatest(0, dateDiff('millisecond', conversation_created_time, first_connect_time)))
                                                          AS first_queue_wait_time,

    if(last_queued_time IS NULL OR last_connect_time IS NULL, NULL,
       greatest(0, dateDiff('millisecond', last_queued_time, last_connect_time)))
                                                          AS last_queue_wait_time,

    if(conversation_created_time IS NULL OR first_connect_time IS NULL, NULL,
       greatest(0, dateDiff('millisecond', conversation_created_time, first_connect_time)))
                                                          AS total_queue_wait_time

  FROM (
    SELECT
      interaction_id,
      nullIf(minIf(event_timestamp, is_agent_connect), toDateTime64(0, 3))          AS first_connect_time,
      nullIf(maxIf(event_timestamp, is_agent_connect), toDateTime64(0, 3))          AS last_connect_time,
      nullIf(minIf(event_timestamp, event_name = 'CONVERSATION_CREATED'), toDateTime64(0, 3)) AS conversation_created_time,
      nullIf(minIf(event_timestamp, event_name = 'CONVERSATION_ENDED'), toDateTime64(0, 3))   AS conversation_ended_time,
      nullIf(maxIf(event_timestamp, event_name = 'CONVERSATION_STATUS_CHANGED' AND conversation_status = 'queued'), toDateTime64(0, 3))
                                                                                    AS last_queued_time
    FROM base_events_dedup
    GROUP BY interaction_id
  )
),

-- =============================================================================
-- STEP 10: Cancellation / termination reasons
-- =============================================================================
termination_reasons AS (
  SELECT
    interaction_id,

    -- ifNull() could never apply the 'visitor_leave' default, because an
    -- absent EventValue16 arrives as '' rather than NULL.
    if(countIf(event_name = 'CONVERSATION_ENDED' AND end_status = 'canceled') > 0,
       coalesce(anyIf(event_value_16, event_name = 'CONVERSATION_ENDED' AND end_status = 'canceled'), 'visitor_leave'),
       CAST(NULL AS Nullable(String)))                     AS agent_interaction_canceled_reason,

    anyIf(termination_reason, event_name = 'CONVERSATION_TERMINATED')
                                                          AS agent_interaction_termination_reason_text

  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 11.5: visitorInfo, reduced to one row per interaction
--
-- The original left this CTE un-aggregated and LEFT JOINed it per event, which
-- multiplied rows and made the surrounding any() calls arbitrary.
-- =============================================================================
visitor_info_parsed AS (
  SELECT
    interaction_id,
    argMin(visitor_info, event_time_epoch) AS visitor_info_json_str
  FROM base_events_dedup
  WHERE event_name = 'CONVERSATION_CREATED' AND visitor_info IS NOT NULL
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 12: Visitor / contact information (CONVERSATION_CREATED)
-- =============================================================================
visitor_info AS (
  SELECT
    interaction_id,
    any(consumer_name)                                     AS consumer_name,

    -- WorkerAttributes.email is the *agent* mailbox; the consumer address lives
    -- in the task attributes.
    any(coalesce(
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'email'), ''),
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'visitorEmail'), '')
    ))                                                     AS email,

    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'pageCounterInSection'), ''))         AS page_counter_in_section,
    any(nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'repeatVisitorCount'), '')) AS repeat_visitor_count,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'interactionSourceType'), ''))        AS interactionsourcetype
  FROM base_events_dedup
  WHERE event_name = 'CONVERSATION_CREATED'
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 12b: Geo / device, preferring the visitorInfo blob
-- =============================================================================
visitor_geo AS (
  SELECT
    be.interaction_id                                                     AS interaction_id,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'url'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'url'), '')))            AS url,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'ipAddress'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'ipAddress'), '')))      AS ip_address,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'geoCountry'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'country'), '')))        AS country,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'geoCity'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'city'), '')))           AS city,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'geoWorldRegion'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'worldRegion'), '')))    AS world_region,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'geoPostalCode'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'postalCode'), '')))     AS postal_code,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'operatingSystem'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'operatingSystem'), ''))) AS operating_system,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'browser'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'browser'), '')))        AS browser,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'deviceId'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'deviceId'), '')))       AS device_id,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'ruleId'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'ruleId'), '')))         AS rule_id,
    any(coalesce(nullIf(JSONExtractString(vip.visitor_info_json_str, 'tpId'), ''),
                 nullIf(JSONExtractString(be.payload, 'TaskAttributes', 'targetPopulation'), ''))) AS target_population
  FROM base_events_dedup be
  LEFT JOIN visitor_info_parsed vip ON be.interaction_id = vip.interaction_id
  WHERE be.event_name = 'CONVERSATION_CREATED'
  GROUP BY be.interaction_id
),

-- =============================================================================
-- STEP 14: Additional timestamps
-- =============================================================================
additional_timestamps AS (
  SELECT
    interaction_id,

    -- nullIf(..., 0) on every one of these: minIf() over an empty match set
    -- returns 0, which the original emitted as a real 1970-01-01 timestamp.
    CAST(nullIf(minIf(event_time_epoch, event_name = 'CONVERSATION_CREATED'), 0) AS Nullable(UInt64))
                                                                             AS interaction_initiated_time,

    CAST(nullIf(minIf(event_time_epoch,
      event_name IN ('CONVERSATION_RESOLVED', 'CONVERSATION_STATUS_CHANGED')
      AND conversation_status = 'resolved'), 0) AS Nullable(UInt64))         AS interaction_ended_time,

    nullIf(minIf(
      coalesce(
        toInt64OrNull(JSONExtractString(payload, 'TaskAttributes', 'queuedTime')),
        toInt64OrNull(JSONExtractString(payload, 'TaskDateCreated')),
        event_time_epoch
      ),
      is_agent_connect), 0)                                                  AS start_time,

    any(toInt64OrNull(JSONExtractString(payload, 'TaskAttributes', 'conversationAutoCloseTimeMillis')))
                                                                             AS conversation_timeout,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'uuidsessionid'), ''))  AS uuid_session_id,
    any(client_id)                                                           AS client_id,
    coalesce(anyIf(nullIf(JSONExtractString(payload, 'TaskAttributes', 'accountName'), ''),
                   event_name = 'CONVERSATION_CREATED'),
             any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'accountName'), '')))
                                                                             AS account_name
  FROM base_events_dedup
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 16: Requested queue
--
-- The original sourced this from CONVERSATION_ENDED/canceled events, so
-- first_requested_* was empty for every row and last_requested_* only ever
-- populated for abandoned chats. Read the request events instead.
-- =============================================================================
queue_request_info AS (
  SELECT
    interaction_id,
    argMin(tuple(queue_id, queue_name, account_id), event_time_epoch) AS first_requested_info,
    argMax(tuple(queue_id, queue_name, account_id), event_time_epoch) AS last_requested_info
  FROM base_events_dedup
  WHERE event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_STATUS_CHANGED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 18: Invitation information
-- =============================================================================
invitation_info AS (
  SELECT
    interaction_id,
    argMin(tuple(agent_id, worker_sid, agent_team_id), event_time_epoch) AS first_invited_info,
    argMax(tuple(agent_id, worker_sid, agent_team_id), event_time_epoch) AS last_invited_info
  FROM base_events_dedup
  WHERE event_name IN ('RESERVATION_CREATED', 'AGENT_INVITED')
    AND JSONExtractString(payload, 'participantRole') = 'OWNER'
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 19: Visitor / contact extended information
-- =============================================================================
visitor_extended_info AS (
  SELECT
    interaction_id,
    any(channel_user_id)                                                                    AS visitor_name,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'urls'), ''))                   AS urls,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'page'), ''))                    AS page,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'invitePage'), ''))              AS invite_page,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'browserVersion'), ''))          AS browser_version,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'browserCapabilities'), ''))     AS browser_capabilities,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'countryCode'), ''))             AS country_code,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'regionCode'), ''))              AS region_code,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'timeZone'), ''))                AS time_zone,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'geo'), ''))                     AS geo,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'isp'), ''))                     AS isp,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'repeatVisit'), ''))             AS repeat_visit,
    any(nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'isVisitorVerified'), '')) AS is_visitor_verified
  FROM base_events_dedup
  WHERE event_name IN ('CONTACT_UPDATED', 'CONVERSATION_UPDATED', 'CONVERSATION_CREATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 20: Interaction context & routing
-- =============================================================================
interaction_context AS (
  SELECT
    interaction_id,
    any(nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'sourceServiceChannel'), '')) AS source_service_channel,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'buttonName'), ''))   AS button_name,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'buttonType'), ''))   AS button_type,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sourceCat'), ''))    AS source_cat,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sourceCat2'), ''))   AS source_cat2,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sourceCat3'), ''))   AS source_cat3,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sourceCat4'), ''))   AS source_cat4,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sourceCat5'), ''))   AS source_cat5,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'ruleCatId'), ''))    AS rule_cat_id,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'skillType'), ''))    AS skill_type,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'priority'), ''))     AS priority,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'mode'), ''))         AS mode,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sid'), ''))          AS sid,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'psid'), ''))         AS psid,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'bd'), ''))           AS bd,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'pName'), ''))        AS p_name
  FROM base_events_dedup
  WHERE event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_UPDATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 21: Custom fields
-- =============================================================================
custom_fields AS (
  SELECT
    interaction_id,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField01'), '')) AS custom_field_01,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField02'), '')) AS custom_field_02,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField03'), '')) AS custom_field_03,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField04'), '')) AS custom_field_04,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField05'), '')) AS custom_field_05,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField06'), '')) AS custom_field_06,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField07'), '')) AS custom_field_07,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField08'), '')) AS custom_field_08,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField09'), '')) AS custom_field_09,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customField10'), '')) AS custom_field_10
  FROM base_events_dedup
  WHERE event_name IN ('CONVERSATION_CREATED', 'CONVERSATION_UPDATED')
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 22: Outbound / SMS
--
-- MESSAGE_CREATED is not a name this source emits (it sends MESSAGE_SENT /
-- MESSAGE_RECEIVED), so the original filter matched CONVERSATION_CREATED only.
-- =============================================================================
outbound_info AS (
  SELECT
    interaction_id,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'sentSMSText'), ''))                       AS sent_sms_text,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundCampaignId'), ''))               AS outbound_campaign_id,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundCampaignName'), ''))             AS outbound_campaign_name,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundMessageInitiatorAgentName'), '')) AS outbound_message_initiator_agent_name,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundMessageInitiatorAgentID'), ''))   AS outbound_message_initiator_agent_id,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundSMSSentTime'), ''))              AS outbound_sms_sent_time,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundProspectFirstName'), ''))        AS outbound_prospect_first_name,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'outboundProspectLastName'), ''))         AS outbound_prospect_last_name
  FROM base_events_dedup
  WHERE event_name = 'CONVERSATION_CREATED' OR is_message
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 23: Additional interaction attributes
-- =============================================================================
interaction_attributes AS (
  SELECT
    interaction_id,
    any(nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'consumerChannel'), '')) AS consumer_channel,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'topic'), ''))          AS topic,
    any(nullIf(JSONExtractString(payload, 'TaskAttributes', 'customerState'), ''))  AS customer_state,
    anyIf(
      nullIf(JSONExtractString(payload, 'TaskAttributes', 'transferInitiator'), ''),
      lower(coalesce(
        nullIf(JSONExtractString(payload, 'TaskAttributes', 'chatInteractionType'), ''),
        nullIf(JSONExtractString(payload, 'WorkerAttributes', 'TaskAttributes', 'chatInteractionType'), ''),
        nullIf(JSONExtractString(payload, 'TaskAttributes', 'COMMUNICATION_MODE'), ''),
        ''
      )) = 'async'
    )                                                                               AS transfer_initiator_async
  FROM base_events_dedup
  WHERE event_name IN ('CONVERSATION_UPDATED', 'CONVERSATION_CREATED') OR is_message
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 24: Chat log
-- =============================================================================
bot_info AS (
  SELECT
    ConversationId                                                      AS conversation_id,
    EventTimeStampEpoch                                                 AS event_time_epoch,
    if(EventName = 'MESSAGE_RECEIVED', 'visitor', 'Brand')              AS speaker,
    trimBoth(
      replaceRegexpAll(
        replaceRegexpAll(
          replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(
            coalesce(
              nullIf(JSONExtractString(ifNull(EventValue1, ''), 'text'), ''),
              nullIf(JSONExtractString(ifNull(EventValue1, ''), 'message'), ''),
              nullIf(JSONExtractString(ifNull(EventValue1, ''), 'content'), ''),
              nullIf(JSONExtractString(ifNull(EventValue1, ''), 'body'), ''),
              nullIf(JSONExtractString(ifNull(EventValue1, ''), 'value'), ''),
              ifNull(EventValue1, '')
            ),
            '&amp;', '&'), '&nbsp;', ' '), '&#39;', ''''), '&apos;', ''''),
            '&quot;', '"'), '&lt;', '<'), '&gt;', '>'),
          '(?i)<[^>]*>|</?[A-Za-z][A-Za-z0-9]*|\\s*(?:class|version|style|id|href|src|type|role|aria-[A-Za-z0-9-]+)\\s*=\\s*(\"[^\"]*\"|\'[^\']*\'|[^\\s<>]+)|\\{[^\\n]*\\}|\\[[^\\n]*\\]|\"[A-Za-z_][A-Za-z0-9_]*\"\\s*:\\s*|[\\{\\}\\[\\]<>\"]+',
          ' '),
        '\\s+', ' ')
    )                                                                   AS clean_text
  FROM {{ params.client_schema }}.eg_agentic_runtime_distributed
  WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
    AND EventValue2 = 'customer'
    AND (InteractionId = '' OR InteractionId IS NULL)
    AND EventTimeStampEpoch >= toUnixTimestamp64Milli(toDateTime64('{{ params.cutoff_date }} 00:00:00', 3, 'UTC'))
),

usable AS (
  SELECT conversation_id, event_time_epoch, speaker, clean_text
  FROM bot_info
  WHERE length(clean_text) > 0
    AND clean_text NOT IN ('HAL-E', 'Employee Information:', 'Employee')
    AND NOT startsWith(clean_text, '/f ')
    AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
    AND positionCaseInsensitive(clean_text, 'Intent: HAL_E') = 0
    AND NOT match(clean_text, '(?i)^(div|span|p|br|strong|hxelement|version)(\\s|$)')
),

-- One row per conversation.
bot_chat AS (
  SELECT
    conversation_id,
    arrayStringConcat(
      arrayMap(x -> concat(x.2, ': ', x.3),
               arraySort(x -> x.1, groupArray((event_time_epoch, speaker, clean_text)))),
      '\n'
    ) AS bot_chat_log
  FROM usable
  GROUP BY conversation_id
),

-- One row per interaction. The original grouped by the joined bot transcript as
-- well, which split an interaction across several output rows whenever its
-- message events disagreed about EventValue2.
agent_chat AS (
  SELECT
    interaction_id,
    arrayStringConcat(
      arrayMap(x -> x.2, arraySort(x -> x.1, groupArray((event_time_epoch, line)))),
      '\n'
    ) AS agent_chat_log
  FROM (
    SELECT
      interaction_id,
      event_time_epoch,
      concat(
        coalesce(message_author, if(event_name = 'MESSAGE_SENT', 'Agent', 'Visitor')),
        '(', formatDateTime(toTimeZone(event_timestamp, 'US/Eastern'), '%T'), '): ',
        replaceRegexpAll(
          replaceRegexpAll(message_body, '<[^>]*>\\n|<[^<]+?>|amp;', ''),
          '[?]{2,}', '?')
      ) AS line
    FROM base_events_dedup
    WHERE is_message AND message_body IS NOT NULL
  )
  GROUP BY interaction_id
),

-- =============================================================================
-- STEP 15: Combine
-- =============================================================================
combined AS (
  SELECT
    ca.interaction_id                                     AS interaction_id,
    ca.account_id                                         AS account_id,
    ca.chat_conversation_id                               AS chat_conversation_id,
    ca.agent_interaction_type                             AS agent_interaction_type,

    coalesce(
      toDateTime64(ca.agent_interaction_queued_time_raw / 1000, 3),
      ts.agent_interaction_start_time
    )                                                     AS agent_interaction_queued_time,

    multiIf(
      lower(ca.agent_interaction_type) = 'async' AND ca.agent_interaction_queued_time_raw IS NULL, 0,
      lower(ca.agent_interaction_type) = 'async', tm.total_queue_wait_time,
      lower(ca.agent_interaction_type) = 'sync'
        AND ts.agent_interaction_requested_time IS NOT NULL
        AND ts.agent_interaction_start_time IS NOT NULL,
        greatest(0, dateDiff('millisecond', ts.agent_interaction_requested_time, ts.agent_interaction_start_time)),
      tm.total_queue_wait_time
    )                                                     AS time_elapsed_on_queue,

    ts.agent_interaction_start_time                       AS agent_interaction_start_time,
    ts.agent_interaction_end_time                         AS agent_interaction_end_time,
    ts.first_event_time                                   AS first_event_time,
    CAST(NULL AS Nullable(String))                        AS agent_first_response_time,

    ai.last_agent_info.2                                  AS last_connected_queue_id,
    ai.last_agent_info.3                                  AS last_connected_queue_name,
    ai.last_agent_info.4                                  AS last_connected_agent_id,
    ai.last_agent_info.5                                  AS last_connected_agent_name,
    ai.last_agent_info.7                                  AS last_connected_agent_team_id,
    ai.last_agent_info.8                                  AS last_connected_agent_team_name,

    tr.num_agent_transfers_initiated                      AS num_agent_transfers_initiated,
    sf.is_premium_visitor                                 AS is_premium_visitor,
    ca.interaction_id                                     AS chat_interaction_id,
    ts.agent_interaction_requested_time                   AS agent_interaction_requested_time,
    ts.agent_interaction_interactive_time                 AS agent_interaction_interactive_time,
    ts.agent_interaction_terminated_time                  AS agent_interaction_terminated_time,
    ts.agent_exit_type                                    AS agent_exit_type,
    ts.chat_abandoned_time                                AS chat_abandoned_time,
    ts.chat_abandoned_time                                AS interaction_cancelled_time,
    ts.chat_start_date_time                               AS chat_start_date_time,
    ts.agent_interaction_end_time                         AS chat_end_date_time,

    sf.is_connected                                       AS is_connected,
    sf.is_canceled                                        AS is_canceled,
    sf.is_interactive_chat                                AS is_interactive_chat,
    sf.is_transferred                                     AS is_transferred,

    tm.agent_handle_time                                  AS agent_handle_time,
    tm.agent_chat_time                                    AS agent_chat_time,
    tm.first_queue_wait_time                              AS first_queue_wait_time,
    tm.last_queue_wait_time                               AS last_queue_wait_time,
    tm.total_queue_wait_time                              AS total_queue_wait_time,

    -- NULL in, NULL out: an interaction that never connected has no SLA
    -- outcome, and reporting it as "not met" hides that distinction.
    if(tm.first_queue_wait_time IS NULL, CAST(NULL AS Nullable(UInt8)), toUInt8(tm.first_queue_wait_time < 30000)) AS is_first_agent_connected_sla_met,
    if(tm.last_queue_wait_time  IS NULL, CAST(NULL AS Nullable(UInt8)), toUInt8(tm.last_queue_wait_time  < 30000)) AS is_last_agent_connected_sla_met,
    if(tm.total_queue_wait_time IS NULL, CAST(NULL AS Nullable(UInt8)), toUInt8(tm.total_queue_wait_time < 30000)) AS is_connected_sla_met,

    CAST(NULL AS Nullable(String))                        AS agent_average_response_time,
    CAST(NULL AS Nullable(String))                        AS consumer_average_response_time,

    trs.agent_interaction_canceled_reason                 AS agent_interaction_canceled_reason,
    trs.agent_interaction_termination_reason_text         AS agent_interaction_termination_reason_text,

    ai.first_agent_info.1                                 AS first_connected_account_id,
    ai.first_agent_info.2                                 AS first_connected_queue_id,
    ai.first_agent_info.3                                 AS first_connected_queue_name,
    ai.first_agent_info.4                                 AS first_connected_agent_id,
    ai.first_agent_info.5                                 AS first_connected_agent_name,
    ai.first_agent_info.6                                 AS first_connected_agent_enterprise_id,
    ai.first_agent_info.7                                 AS first_connected_agent_team_id,
    ai.first_agent_info.8                                 AS first_connected_agent_team_name,
    ai.last_agent_info.1                                  AS last_connected_account_id,
    ai.last_agent_info.6                                  AS last_connected_agent_enterprise_id,

    ai.list_of_queues_involved                            AS list_of_queues_involved,
    ai.list_of_agents_involved                            AS list_of_agents_involved,

    vi.consumer_name                                      AS consumer_name,

    CAST(NULL AS Nullable(String))                        AS hold_on_count,
    CAST(NULL AS Nullable(String))                        AS num_agent_chat_turns,
    CAST(NULL AS Nullable(String))                        AS num_agent_words,
    CAST(NULL AS Nullable(String))                        AS num_consumer_words,
    CAST(NULL AS Nullable(String))                        AS num_agent_lines,
    CAST(NULL AS Nullable(String))                        AS num_consumer_lines,
    CAST(NULL AS Nullable(String))                        AS num_agent_art,
    CAST(NULL AS Nullable(String))                        AS num_consumer_art,
    CAST(NULL AS Nullable(String))                        AS num_agent_msgs,
    CAST(NULL AS Nullable(String))                        AS num_consumer_msgs,

    tr.num_account_transfers_initiated                    AS num_account_transfers_initiated,
    tr.num_queue_transfers_initiated                      AS num_queue_transfers_initiated,
    tr.num_account_transfers_completed                    AS num_account_transfers_completed,

    vi.email                                              AS email,
    vi.page_counter_in_section                            AS page_counter_in_section,
    vi.repeat_visitor_count                               AS repeat_visitor_count,
    vg.url                                                AS url,
    vg.ip_address                                         AS ip_address,
    vg.country                                            AS geo_country,
    vg.city                                               AS geo_city,
    vg.world_region                                       AS geo_world_region,
    vg.postal_code                                        AS geo_postal_code,
    vg.operating_system                                   AS operating_system,
    vg.browser                                            AS browser,

    CAST(NULL AS Nullable(DateTime64(3)))                 AS prechat_survey_submit_time,
    CAST(NULL AS Nullable(String))                        AS prechat_survey_questions,
    CAST(NULL AS Nullable(String))                        AS prechat_survey_details,
    CAST(NULL AS Nullable(String))                        AS enc_prechat_survey,
    CAST(NULL AS Nullable(String))                        AS nps_via_chatcx_survey,
    CAST(NULL AS Nullable(String))                        AS nps_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String))                        AS csat_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String))                        AS issue_resolution_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String))                        AS asat_value_via_chatcx_survey,
    CAST(NULL AS Nullable(UInt8))                         AS fcr_value_via_chatcx_survey,
    CAST(NULL AS Nullable(String))                        AS inscope_interaction,
    CAST(NULL AS Nullable(String))                        AS reason_for_non_resolution,
    CAST(NULL AS Nullable(String))                        AS enc_custom_field,

    vi.interactionsourcetype                              AS assist_chatsession_interactionsourcetype,

    ats.interaction_initiated_time                        AS interaction_initiated_time,
    ats.interaction_ended_time                            AS interaction_ended_time,
    ats.start_time                                        AS start_time,
    ats.conversation_timeout                              AS conversation_timeout,
    ats.uuid_session_id                                   AS uuid_session_id,
    ats.client_id                                         AS client_id,
    ats.account_name                                      AS account_name,

    qri.first_requested_info.1                            AS first_requested_queue_id,
    qri.first_requested_info.2                            AS first_requested_queue_name,
    qri.first_requested_info.3                            AS first_requested_account_id,
    qri.last_requested_info.1                             AS last_requested_queue_id,
    qri.last_requested_info.2                             AS last_requested_queue_name,
    qri.last_requested_info.3                             AS last_requested_account_id,

    ai.first_connected_agent_session_id                   AS first_connected_agent_session_id,
    ai.last_connected_session_id_agent_id                 AS last_connected_session_id_agent_id,

    inv.first_invited_info.1                              AS first_invited_agent_id,
    inv.first_invited_info.2                              AS first_invited_agent_session_id,
    inv.first_invited_info.3                              AS first_invited_agent_team_id,
    inv.last_invited_info.1                               AS last_invited_agent_id,
    inv.last_invited_info.2                               AS last_invited_agent_session_id,
    inv.last_invited_info.3                               AS last_invited_agent_team_id,

    vei.visitor_name                                      AS visitor_name,
    vei.urls                                              AS urls,
    vei.page                                              AS page,
    vei.invite_page                                       AS invite_page,
    vei.browser_version                                   AS browser_version,
    vei.browser_capabilities                              AS browser_capabilities,
    vg.device_id                                          AS device_id,
    vei.country_code                                      AS country_code,
    vei.region_code                                       AS region_code,
    vei.time_zone                                         AS time_zone,
    vei.geo                                               AS geo,
    vei.isp                                               AS isp,
    vei.repeat_visit                                      AS repeat_visit,
    vei.is_visitor_verified                               AS is_visitor_verified,

    ic.source_service_channel                             AS source_service_channel,
    ic.button_name                                        AS button_name,
    ic.button_type                                        AS button_type,
    ic.source_cat                                         AS source_cat,
    ic.source_cat2                                        AS source_cat2,
    ic.source_cat3                                        AS source_cat3,
    ic.source_cat4                                        AS source_cat4,
    ic.source_cat5                                        AS source_cat5,
    vg.rule_id                                            AS rule_id,
    ic.rule_cat_id                                        AS rule_cat_id,
    vg.target_population                                  AS target_population,
    ic.skill_type                                         AS skill_type,
    ic.priority                                           AS priority,
    ic.mode                                               AS mode,
    ic.sid                                                AS sid,
    ic.psid                                               AS psid,
    ic.bd                                                 AS bd,
    ic.p_name                                             AS p_name,

    cf.custom_field_01                                    AS custom_field_01,
    cf.custom_field_02                                    AS custom_field_02,
    cf.custom_field_03                                    AS custom_field_03,
    cf.custom_field_04                                    AS custom_field_04,
    cf.custom_field_05                                    AS custom_field_05,
    cf.custom_field_06                                    AS custom_field_06,
    cf.custom_field_07                                    AS custom_field_07,
    cf.custom_field_08                                    AS custom_field_08,
    cf.custom_field_09                                    AS custom_field_09,
    cf.custom_field_10                                    AS custom_field_10,

    obi.sent_sms_text                                     AS sent_sms_text,
    obi.outbound_campaign_id                              AS outbound_campaign_id,
    obi.outbound_campaign_name                            AS outbound_campaign_name,
    obi.outbound_message_initiator_agent_name             AS outbound_message_initiator_agent_name,
    obi.outbound_message_initiator_agent_id               AS outbound_message_initiator_agent_id,
    obi.outbound_sms_sent_time                            AS outbound_sms_sent_time,
    obi.outbound_prospect_first_name                      AS outbound_prospect_first_name,
    obi.outbound_prospect_last_name                       AS outbound_prospect_last_name,

    ia.consumer_channel                                   AS consumer_channel,
    ia.topic                                              AS topic,
    ia.customer_state                                     AS customer_state,
    ia.transfer_initiator_async                           AS transfer_initiator_async,

    arrayStringConcat(
      arrayFilter(x -> x != '', [ifNull(bc.bot_chat_log, ''), ifNull(acl.agent_chat_log, '')]),
      '\n'
    )                                                     AS chat_log

  FROM core_attributes ca
  LEFT JOIN timestamps            ts  ON ca.interaction_id = ts.interaction_id
  LEFT JOIN agent_info            ai  ON ca.interaction_id = ai.interaction_id
  LEFT JOIN transfers             tr  ON ca.interaction_id = tr.interaction_id
  LEFT JOIN status_flags          sf  ON ca.interaction_id = sf.interaction_id
  LEFT JOIN time_metrics          tm  ON ca.interaction_id = tm.interaction_id
  LEFT JOIN termination_reasons   trs ON ca.interaction_id = trs.interaction_id
  LEFT JOIN visitor_info          vi  ON ca.interaction_id = vi.interaction_id
  LEFT JOIN visitor_geo           vg  ON ca.interaction_id = vg.interaction_id
  LEFT JOIN additional_timestamps ats ON ca.interaction_id = ats.interaction_id
  LEFT JOIN queue_request_info    qri ON ca.interaction_id = qri.interaction_id
  LEFT JOIN invitation_info       inv ON ca.interaction_id = inv.interaction_id
  LEFT JOIN visitor_extended_info vei ON ca.interaction_id = vei.interaction_id
  LEFT JOIN interaction_context   ic  ON ca.interaction_id = ic.interaction_id
  LEFT JOIN custom_fields         cf  ON ca.interaction_id = cf.interaction_id
  LEFT JOIN outbound_info         obi ON ca.interaction_id = obi.interaction_id
  LEFT JOIN interaction_attributes ia ON ca.interaction_id = ia.interaction_id
  LEFT JOIN agent_chat            acl ON ca.interaction_id = acl.interaction_id
  LEFT JOIN bot_chat              bc  ON ca.chat_conversation_id = bc.conversation_id
),

-- =============================================================================
-- STEP 25: Previous / next interaction within the conversation
--
-- Ordering by agent_interaction_start_time alone is not stable: that column is
-- NULL for every interaction that never connected, so the previous_* chain was
-- decided by physical row order. Order by the request time (always present for
-- these rows) and break ties on interaction_id.
-- =============================================================================
with_previous_values AS (
  SELECT
    *,
    lagInFrame(interaction_id, 1) OVER conv_window                AS previous_interaction_id,
    lagInFrame(last_connected_agent_id, 1) OVER conv_window       AS previous_interaction_agent_id,
    lagInFrame(last_connected_queue_id, 1) OVER conv_window       AS previous_queue_id,
    lagInFrame(
      multiIf(
        is_canceled, 'canceled',
        agent_interaction_terminated_time IS NOT NULL, 'terminated',
        agent_interaction_end_time IS NOT NULL, 'resolved',
        'unknown'
      ), 1) OVER conv_window                                      AS previous_interaction_end_state,
    lagInFrame(agent_interaction_termination_reason_text, 1) OVER conv_window
                                                                  AS previous_interaction_wrapup_note,

    -- A transfer counts as completed once a later interaction picks the
    -- conversation up.
    toUInt64(num_agent_transfers_initiated > 0
       AND leadInFrame(interaction_id, 1) OVER conv_window_full IS NOT NULL)
                                                                  AS num_agent_transfers_completed,
    toUInt64(num_queue_transfers_initiated > 0
       AND leadInFrame(interaction_id, 1) OVER conv_window_full IS NOT NULL)
                                                                  AS num_queue_transfers_completed

  FROM combined
  WINDOW
    conv_window AS (
      PARTITION BY chat_conversation_id
      ORDER BY coalesce(agent_interaction_requested_time, agent_interaction_start_time, first_event_time) ASC,
               interaction_id ASC
    ),
    conv_window_full AS (
      PARTITION BY chat_conversation_id
      ORDER BY coalesce(agent_interaction_requested_time, agent_interaction_start_time, first_event_time) ASC,
               interaction_id ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )
)

-- =============================================================================
-- FINAL SELECT
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
-- Fall back through the available timestamps so an interaction that never
-- emitted CONVERSATION_CREATED is still dated instead of dropped.
WHERE toDate(coalesce(agent_interaction_requested_time,
                      agent_interaction_start_time,
                      agent_interaction_end_time,
                      first_event_time)) >= toDate('{{ params.cutoff_date }}')
ORDER BY coalesce(agent_interaction_start_time, agent_interaction_requested_time) DESC,
         interaction_id ASC
