-- ClickHouse: customer chatlog extraction from agentic runtime events
-- Source: ftbank.eg_agentic_runtime_distributed
-- Grain: one row per ConversationId
--
-- Builds a single combined_chat_log per conversation from customer
-- MESSAGE_RECEIVED / MESSAGE_SENT payloads (EventValue1).
--
-- Text is pulled from HTML-entity-wrapped snippets via:
--   &gt;([^&<>]{2,500})&lt;
-- e.g. "&lt;p&gt;I need help with my bill&lt;/p&gt;" → "I need help with my bill"
--
-- Filters:
--   - EventValue2 = 'customer' (visitor-side messages only)
--   - InteractionId IS NULL (conversation-level events, pre-consult)
--   - ConversationId list is the sample set for this extract; replace or
--     remove for a broader pull.
--
-- Messages are ordered by EventTimeStampISO before aggregation.

WITH ordered_customer_messages AS (
    SELECT
        ConversationId,
        ifNull(EventValue1, '') AS message_payload,
        parseDateTimeBestEffortOrNull(EventTimeStampISO) AS event_ts
    FROM ftbank.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
      AND InteractionId IS NULL
      AND ConversationId IN (
          '0fe9edda-1c04-4097-9abc-d9741c5f1b10',
          'c7e85ffa-435b-48da-ac74-f86c6882dd85',
          'fa3f2424-7ba4-4cc5-8089-0d92efd00b27'
      )
    ORDER BY
        ConversationId,
        event_ts ASC,
        EventId ASC
)
SELECT
    ConversationId AS interaction_id,
    concat(
        'info: ',
        arrayStringConcat(
            arrayFlatten(
                groupArray(
                    extractAll(
                        message_payload,
                        '&gt;([^&<>]{2,500})&lt;'
                    )
                )
            ),
            ' '
        )
    ) AS combined_chat_log
FROM ordered_customer_messages
GROUP BY ConversationId
ORDER BY ConversationId
;


-- -----------------------------------------------------------------------------
-- Optional: same extract without a ConversationId allow-list
-- (add a date / client filter before running at scale)
-- -----------------------------------------------------------------------------
/*
WITH ordered_customer_messages AS (
    SELECT
        ConversationId,
        ifNull(EventValue1, '') AS message_payload,
        parseDateTimeBestEffortOrNull(EventTimeStampISO) AS event_ts
    FROM ftbank.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
      AND InteractionId IS NULL
      AND toDate(parseDateTimeBestEffortOrNull(EventTimeStampISO)) = toDate('2026-08-17')
    ORDER BY
        ConversationId,
        event_ts ASC,
        EventId ASC
)
SELECT
    ConversationId AS interaction_id,
    concat(
        'info: ',
        arrayStringConcat(
            arrayFlatten(
                groupArray(
                    extractAll(
                        message_payload,
                        '&gt;([^&<>]{2,500})&lt;'
                    )
                )
            ),
            ' '
        )
    ) AS combined_chat_log
FROM ordered_customer_messages
GROUP BY ConversationId
ORDER BY ConversationId
;
*/
