-- ClickHouse: conversation / interaction canceled flag from ftbank.all_events
-- Grain: event_date × ConversationId × InteractionId
--
-- is_canceled = 1 when any CONVERSATION_STATUS_CHANGED event resolves to status
-- 'canceled' (or 'cancelled') via event_value_2, or JSON in event_data.
--
-- Status resolution order:
--   1) event_value_2
--   2) JSONExtractString(JSONExtractString(event_data, 'string'), 'status')
--      (double-encoded payload under a "string" key)
--   3) JSONExtractString(event_data, 'status')
--
-- Change the date filter as needed.

SELECT
    toDate(EventDateTime) AS event_date,
    ConversationId,
    InteractionId,
    max(
        event_name = 'CONVERSATION_STATUS_CHANGED'
        AND lower(
            coalesce(
                nullIf(trimBoth(ifNull(event_value_2, '')), ''),
                nullIf(
                    JSONExtractString(
                        JSONExtractString(ifNull(event_data, ''), 'string'),
                        'status'
                    ),
                    ''
                ),
                nullIf(JSONExtractString(ifNull(event_data, ''), 'status'), '')
            )
        ) IN ('canceled', 'cancelled')
    ) AS is_canceled
FROM ftbank.all_events
WHERE toDate(EventDateTime) = toDate('2026-08-17')
  AND ConversationId IS NOT NULL
  AND ConversationId != ''
GROUP BY
    event_date,
    ConversationId,
    InteractionId
ORDER BY
    event_date,
    ConversationId,
    InteractionId
;


-- -----------------------------------------------------------------------------
-- Optional: only rows that were canceled
-- -----------------------------------------------------------------------------
/*
SELECT
    toDate(EventDateTime) AS event_date,
    ConversationId,
    InteractionId,
    max(
        event_name = 'CONVERSATION_STATUS_CHANGED'
        AND lower(
            coalesce(
                nullIf(trimBoth(ifNull(event_value_2, '')), ''),
                nullIf(
                    JSONExtractString(
                        JSONExtractString(ifNull(event_data, ''), 'string'),
                        'status'
                    ),
                    ''
                ),
                nullIf(JSONExtractString(ifNull(event_data, ''), 'status'), '')
            )
        ) IN ('canceled', 'cancelled')
    ) AS is_canceled
FROM ftbank.all_events
WHERE toDate(EventDateTime) = toDate('2026-08-17')
  AND ConversationId IS NOT NULL
  AND ConversationId != ''
GROUP BY
    event_date,
    ConversationId,
    InteractionId
HAVING is_canceled = 1
ORDER BY
    event_date,
    ConversationId,
    InteractionId
;
*/
