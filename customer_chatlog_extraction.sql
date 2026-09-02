-- ClickHouse: user + bot chatlog extraction (bot_info CTE)
-- Source: {{ params.client_schema }}.eg_agentic_runtime_distributed
-- Grain: one row per ConversationId
--
-- Role mapping on the customer channel (EventValue2 = 'customer'):
--   user = MESSAGE_RECEIVED  (visitor → system)
--   bot  = MESSAGE_SENT      (concierge/bot → visitor)
--
-- Text cleanup: strip HTML tags from EventValue1 via
--   replaceRegexpAll(..., '<[^>]*>', '')
-- Ordering: EventTimeStampEpoch ascending.
--
-- Airflow/Jinja: set params.client_schema (e.g. ftbank). For ad-hoc runs,
-- replace {{ params.client_schema }} with the target schema name.

WITH
bot_info AS (
    SELECT
        ConversationId AS interaction_id,

        -- Interleaved transcript with role labels, time-ordered
        arrayStringConcat(
            arrayMap(
                x -> concat(
                    if(x.3 = 'MESSAGE_RECEIVED', 'user: ', 'bot: '),
                    replaceRegexpAll(ifNull(x.2, ''), '<[^>]*>', '')
                ),
                arraySort(
                    x -> x.1,
                    groupArray((EventTimeStampEpoch, EventValue1, EventName))
                )
            ),
            ' '
        ) AS combined_chat_log,

        -- User-only text (MESSAGE_RECEIVED), time-ordered
        arrayStringConcat(
            arrayMap(
                x -> replaceRegexpAll(ifNull(x.2, ''), '<[^>]*>', ''),
                arraySort(
                    x -> x.1,
                    groupArrayIf(
                        (EventTimeStampEpoch, EventValue1),
                        EventName = 'MESSAGE_RECEIVED'
                    )
                )
            ),
            ' '
        ) AS user_chat_log,

        -- Bot-only text (MESSAGE_SENT), time-ordered
        arrayStringConcat(
            arrayMap(
                x -> replaceRegexpAll(ifNull(x.2, ''), '<[^>]*>', ''),
                arraySort(
                    x -> x.1,
                    groupArrayIf(
                        (EventTimeStampEpoch, EventValue1),
                        EventName = 'MESSAGE_SENT'
                    )
                )
            ),
            ' '
        ) AS bot_chat_log
    FROM {{ params.client_schema }}.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
    GROUP BY ConversationId
)
SELECT
    interaction_id,
    combined_chat_log,
    user_chat_log,
    bot_chat_log
FROM bot_info
ORDER BY interaction_id
;


-- -----------------------------------------------------------------------------
-- Standalone SELECT (same logic; sample ConversationIds for ad-hoc checks)
-- Replace __CLIENT_SCHEMA__ before running outside Airflow.
-- -----------------------------------------------------------------------------
/*
SELECT
    ConversationId AS interaction_id,
    arrayStringConcat(
        arrayMap(
            x -> concat(
                if(x.3 = 'MESSAGE_RECEIVED', 'user: ', 'bot: '),
                replaceRegexpAll(ifNull(x.2, ''), '<[^>]*>', '')
            ),
            arraySort(
                x -> x.1,
                groupArray((EventTimeStampEpoch, EventValue1, EventName))
            )
        ),
        ' '
    ) AS combined_chat_log,
    arrayStringConcat(
        arrayMap(
            x -> replaceRegexpAll(ifNull(x.2, ''), '<[^>]*>', ''),
            arraySort(
                x -> x.1,
                groupArrayIf(
                    (EventTimeStampEpoch, EventValue1),
                    EventName = 'MESSAGE_RECEIVED'
                )
            )
        ),
        ' '
    ) AS user_chat_log,
    arrayStringConcat(
        arrayMap(
            x -> replaceRegexpAll(ifNull(x.2, ''), '<[^>]*>', ''),
            arraySort(
                x -> x.1,
                groupArrayIf(
                    (EventTimeStampEpoch, EventValue1),
                    EventName = 'MESSAGE_SENT'
                )
            )
        ),
        ' '
    ) AS bot_chat_log
FROM __CLIENT_SCHEMA__.eg_agentic_runtime_distributed
WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
  AND EventValue2 = 'customer'
  AND ConversationId IN (
      '0fe9edda-1c04-4097-9abc-d9741c5f1b10',
      'c7e85ffa-435b-48da-ac74-f86c6882dd85',
      'fa3f2424-7ba4-4cc5-8089-0d92efd00b27'
  )
GROUP BY ConversationId
ORDER BY ConversationId
;
*/
