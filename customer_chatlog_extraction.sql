-- ClickHouse: customer chatlog extraction (bot_info CTE)
-- Source: {{ params.client_schema }}.eg_agentic_runtime_distributed
-- Grain: one row per ConversationId
--
-- Builds combined_chat_log from customer MESSAGE_RECEIVED / MESSAGE_SENT
-- payloads (EventValue1), ordered by EventTimeStampEpoch, with HTML tags
-- stripped via replaceRegexpAll(..., '<[^>]*>', '').
--
-- Airflow/Jinja: set params.client_schema (e.g. ftbank). For ad-hoc runs,
-- replace {{ params.client_schema }} with the target schema name.

WITH
bot_info AS (
    SELECT
        ConversationId AS interaction_id,
        concat(
            'info: ',
            arrayStringConcat(
                arrayMap(
                    x -> replaceRegexpAll(
                        x.2,
                        '<[^>]*>',
                        ''
                    ),
                    arraySort(
                        x -> x.1,
                        groupArray((EventTimeStampEpoch, EventValue1))
                    )
                ),
                ' '
            )
        ) AS combined_chat_log
    FROM {{ params.client_schema }}.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
    GROUP BY ConversationId
)
SELECT
    interaction_id,
    combined_chat_log
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
    concat(
        'info: ',
        arrayStringConcat(
            arrayMap(
                x -> replaceRegexpAll(
                    x.2,
                    '<[^>]*>',
                    ''
                ),
                arraySort(
                    x -> x.1,
                    groupArray((EventTimeStampEpoch, EventValue1))
                )
            ),
            ' '
        )
    ) AS combined_chat_log
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
