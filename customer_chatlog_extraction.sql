-- ClickHouse: human-readable user + bot transcript as a single text blob
-- Source: {{ params.client_schema }}.eg_agentic_runtime_distributed
-- Grain: one row per ConversationId
--
-- Role mapping on the customer channel (EventValue2 = 'customer'):
--   User = MESSAGE_RECEIVED  (visitor → system), e.g. menu picks like "Online Banking"
--   Bot  = MESSAGE_SENT      (concierge/bot → visitor), e.g. HTML <p> replies from HAL-E
--
-- Cleaning (matches raw EventValue1 samples with <div class="hxelement"> / <p> wrappers):
--   1) strip HTML tags
--   2) decode a few common entities
--   3) collapse whitespace
--   4) drop empty / noise lines (/f commands, intent cards, bare bot-name chips)
--
-- Single blob column `combined_chat_log` (newline-separated):
--   [YYYY-MM-DD HH:MM:SS] User: ...
--   [YYYY-MM-DD HH:MM:SS] Bot: ...
--
-- Timestamp: prefer EventTimeStampISO; else EventTimeStampEpoch (auto ms vs sec).
-- Airflow/Jinja: set params.client_schema (e.g. ftbank).

WITH
messages AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        coalesce(
            parseDateTimeBestEffortOrNull(EventTimeStampISO),
            if(
                toUInt64OrZero(toString(EventTimeStampEpoch)) > toUInt64(1000000000000),
                toDateTime(intDiv(toUInt64OrZero(toString(EventTimeStampEpoch)), 1000)),
                toDateTime(toUInt64OrZero(toString(EventTimeStampEpoch)))
            )
        ) AS event_ts,
        trimBoth(
            replaceRegexpAll(
                replaceAll(
                    replaceAll(
                        replaceAll(
                            replaceAll(
                                replaceRegexpAll(ifNull(EventValue1, ''), '<[^>]*>', ''),
                                '&nbsp;',
                                ' '
                            ),
                            '&amp;',
                            '&'
                        ),
                        '&lt;',
                        '<'
                    ),
                    '&gt;',
                    '>'
                ),
                '\\s+',
                ' '
            )
        ) AS clean_text
    FROM {{ params.client_schema }}.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
),
usable AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        clean_text,
        if(EventName = 'MESSAGE_RECEIVED', 'User', 'Bot') AS speaker
    FROM messages
    WHERE length(clean_text) > 0
      AND clean_text NOT IN ('HAL-E', 'Employee Information:')
      AND NOT startsWith(clean_text, '/f ')
      AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
),
bot_info AS (
    SELECT
        ConversationId AS interaction_id,
        arrayStringConcat(
            arrayMap(
                x -> concat(
                    '[',
                    formatDateTime(x.1, '%Y-%m-%d %H:%M:%S'),
                    '] ',
                    x.2,
                    ': ',
                    x.3
                ),
                arraySort(
                    x -> x.4,
                    groupArray((event_ts, speaker, clean_text, EventTimeStampEpoch))
                )
            ),
            '\n'
        ) AS combined_chat_log
    FROM usable
    GROUP BY ConversationId
)
SELECT
    interaction_id,
    combined_chat_log
FROM bot_info
ORDER BY interaction_id
;


-- -----------------------------------------------------------------------------
-- Standalone SELECT for sample ConversationIds (ad-hoc checks)
-- Replace __CLIENT_SCHEMA__ before running outside Airflow.
-- -----------------------------------------------------------------------------
/*
WITH
messages AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        coalesce(
            parseDateTimeBestEffortOrNull(EventTimeStampISO),
            if(
                toUInt64OrZero(toString(EventTimeStampEpoch)) > toUInt64(1000000000000),
                toDateTime(intDiv(toUInt64OrZero(toString(EventTimeStampEpoch)), 1000)),
                toDateTime(toUInt64OrZero(toString(EventTimeStampEpoch)))
            )
        ) AS event_ts,
        trimBoth(
            replaceRegexpAll(
                replaceAll(
                    replaceAll(
                        replaceAll(
                            replaceAll(
                                replaceRegexpAll(ifNull(EventValue1, ''), '<[^>]*>', ''),
                                '&nbsp;',
                                ' '
                            ),
                            '&amp;',
                            '&'
                        ),
                        '&lt;',
                        '<'
                    ),
                    '&gt;',
                    '>'
                ),
                '\\s+',
                ' '
            )
        ) AS clean_text
    FROM __CLIENT_SCHEMA__.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
      AND ConversationId IN (
          '0fe9edda-1c04-4097-9abc-d9741c5f1b10',
          'c7e85ffa-435b-48da-ac74-f86c6882dd85',
          'fa3f2424-7ba4-4cc5-8089-0d92efd00b27'
      )
),
usable AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        clean_text,
        if(EventName = 'MESSAGE_RECEIVED', 'User', 'Bot') AS speaker
    FROM messages
    WHERE length(clean_text) > 0
      AND clean_text NOT IN ('HAL-E', 'Employee Information:')
      AND NOT startsWith(clean_text, '/f ')
      AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
)
SELECT
    ConversationId AS interaction_id,
    arrayStringConcat(
        arrayMap(
            x -> concat(
                '[',
                formatDateTime(x.1, '%Y-%m-%d %H:%M:%S'),
                '] ',
                x.2,
                ': ',
                x.3
            ),
            arraySort(
                x -> x.4,
                groupArray((event_ts, speaker, clean_text, EventTimeStampEpoch))
            )
        ),
        '\n'
    ) AS combined_chat_log
FROM usable
GROUP BY ConversationId
ORDER BY ConversationId
;
*/
