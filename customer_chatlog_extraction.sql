-- ClickHouse: human-readable user + bot transcript as a single text blob
-- Source: {{ params.client_schema }}.eg_agentic_runtime_distributed
-- Grain: one row per ConversationId
--
-- Role mapping on the customer channel (EventValue2 = 'customer'):
--   User = MESSAGE_RECEIVED  (visitor → system), e.g. menu picks like "Online Banking"
--   Bot  = MESSAGE_SENT      (concierge/bot → visitor), e.g. HTML <p> replies from HAL-E
--
-- Cleaning (EventValue1 often has HTML and/or JSON wrappers):
--   1) if payload is JSON, pull text/message/content/body/value first
--   2) decode HTML entities (&nbsp; &#39; &apos; &quot; &lt; &gt; &amp;)
--   3) strip complete HTML tags (<div ...>, <p>, <br>, …) — two passes
--   4) strip truncated/open tags (e.g. "<div class=..." or leftover "<ter")
--   5) strip JSON object/array fragments and "key": noise
--   6) strip leftover < > { } [ ] " chars; collapse whitespace
--   7) drop empty / system noise lines
--
-- Single blob column `combined_chat_log` (newline-separated):
--   [HH:MM:SS] User: ...
--   [HH:MM:SS] Bot: ...
--
-- Timestamp: prefer EventTimeStampISO; else EventTimeStampEpoch (auto ms vs sec).
-- Airflow/Jinja: set params.client_schema (e.g. ftbank).

WITH
raw_messages AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        ifNull(EventValue1, '') AS raw_payload,
        coalesce(
            parseDateTimeBestEffortOrNull(EventTimeStampISO),
            if(
                toUInt64OrZero(toString(EventTimeStampEpoch)) > toUInt64(1000000000000),
                toDateTime(intDiv(toUInt64OrZero(toString(EventTimeStampEpoch)), 1000)),
                toDateTime(toUInt64OrZero(toString(EventTimeStampEpoch)))
            )
        ) AS event_ts
    FROM {{ params.client_schema }}.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
),
json_text AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        multiIf(
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'text'),
                JSONExtractString(raw_payload, 'text'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'message'),
                JSONExtractString(raw_payload, 'message'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'content'),
                JSONExtractString(raw_payload, 'content'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'body'),
                JSONExtractString(raw_payload, 'body'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'value'),
                JSONExtractString(raw_payload, 'value'),
            raw_payload
        ) AS payload_text
    FROM raw_messages
),
decoded AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        -- Decode &amp; first so &amp;lt; becomes &lt; then <.
        -- Then decode remaining entities BEFORE HTML strip so &lt;p&gt;…&lt;/p&gt;
        -- becomes <p>…</p> and is removed (not left as literal tags).
        replaceAll(
            replaceAll(
                replaceAll(
                    replaceAll(
                        replaceAll(
                            replaceAll(
                                replaceAll(payload_text, '&amp;', '&'),
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
        ) AS decoded_text
    FROM json_text
),
stripped AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        trimBoth(
            replaceRegexpAll(
                replaceRegexpAll(
                    replaceRegexpAll(
                        replaceRegexpAll(
                            replaceRegexpAll(
                                replaceRegexpAll(
                                    replaceRegexpAll(
                                        decoded_text,
                                        -- complete HTML tags (two passes for nesting leftovers)
                                        '(?i)<[^>]*>',
                                        ''
                                    ),
                                    '(?i)<[^>]*>',
                                    ''
                                ),
                                -- leftover incomplete tag names after pass 1/2, e.g. "<ter"
                                '(?i)</?[A-Za-z][A-Za-z0-9]*',
                                ''
                            ),
                            -- orphan HTML attributes left after truncated open-tags
                            '(?i)\\s*(?:class|version|style|id|href|src|type|role|aria-[A-Za-z0-9-]+)\\s*=\\s*("[^"]*"|\'[^\']*\'|[^\\s<>]+)',
                            ''
                        ),
                        -- JSON object / array blobs
                        '\\{[^\\n]*\\}|\\[[^\\n]*\\]',
                        ' '
                    ),
                    -- JSON "key": noise (quoted keys only, avoid eating plain "Note: …")
                    '(?i)"[A-Za-z_][A-Za-z0-9_]*"\\s*:\\s*',
                    ' '
                ),
                -- leftover markup / JSON punctuation
                '[\\{\\}\\[\\]<>"]+',
                ' '
            )
        ) AS clean_text_raw
    FROM decoded
),
messages AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        trimBoth(replaceRegexpAll(clean_text_raw, '\\s+', ' ')) AS clean_text
    FROM stripped
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
      AND clean_text NOT IN ('HAL-E', 'Employee Information:', 'Employee')
      AND NOT startsWith(clean_text, '/f ')
      AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
      AND positionCaseInsensitive(clean_text, 'Intent: HAL_E') = 0
      AND NOT match(clean_text, '(?i)^(div|span|p|br|strong|hxelement|version)(\\s|$)')
),
bot_info AS (
    SELECT
        ConversationId AS interaction_id,
        arrayStringConcat(
            arrayMap(
                x -> concat(
                    '[',
                    formatDateTime(x.1, '%H:%M:%S'),
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
raw_messages AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        ifNull(EventValue1, '') AS raw_payload,
        coalesce(
            parseDateTimeBestEffortOrNull(EventTimeStampISO),
            if(
                toUInt64OrZero(toString(EventTimeStampEpoch)) > toUInt64(1000000000000),
                toDateTime(intDiv(toUInt64OrZero(toString(EventTimeStampEpoch)), 1000)),
                toDateTime(toUInt64OrZero(toString(EventTimeStampEpoch)))
            )
        ) AS event_ts
    FROM __CLIENT_SCHEMA__.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
      AND ConversationId IN (
          '0fe9edda-1c04-4097-9abc-d9741c5f1b10',
          'c7e85ffa-435b-48da-ac74-f86c6882dd85',
          'fa3f2424-7ba4-4cc5-8089-0d92efd00b27'
      )
),
json_text AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        multiIf(
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'text'),
                JSONExtractString(raw_payload, 'text'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'message'),
                JSONExtractString(raw_payload, 'message'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'content'),
                JSONExtractString(raw_payload, 'content'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'body'),
                JSONExtractString(raw_payload, 'body'),
            isValidJSON(raw_payload) AND JSONHas(raw_payload, 'value'),
                JSONExtractString(raw_payload, 'value'),
            raw_payload
        ) AS payload_text
    FROM raw_messages
),
decoded AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        replaceAll(
            replaceAll(
                replaceAll(
                    replaceAll(
                        replaceAll(
                            replaceAll(payload_text, '&nbsp;', ' '),
                            '&#39;', '\''
                        ),
                        '&apos;', '\''
                    ),
                    '&quot;', '"'
                ),
                '&lt;', '<'
            ),
            '&gt;', '>'
        ) AS angled_text
    FROM json_text
),
amp_fixed AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        replaceAll(angled_text, '&amp;', '&') AS decoded_text
    FROM decoded
),
stripped AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        trimBoth(
            replaceRegexpAll(
                replaceRegexpAll(
                    replaceRegexpAll(
                        replaceRegexpAll(
                            replaceRegexpAll(
                                replaceRegexpAll(decoded_text, '(?i)<[^>]*>', ''),
                                '(?i)<[^>]*>',
                                ''
                            ),
                            '(?i)</?[A-Za-z][A-Za-z0-9]*',
                            ''
                        ),
                        '(?i)\\s*(?:class|version|style|id|href|src|type|role|aria-[A-Za-z0-9-]+)\\s*=\\s*("[^"]*"|\'[^\']*\'|[^\\s<>]+)',
                        ''
                    ),
                    '\\{[^\\n]*\\}|\\[[^\\n]*\\]',
                    ' '
                ),
                '(?i)"[A-Za-z_][A-Za-z0-9_]*"\\s*:\\s*',
                ' '
            ),
            '[\\{\\}\\[\\]<>"]+',
            ' '
        )
        ) AS clean_text_raw
    FROM amp_fixed
),
messages AS (
    SELECT
        ConversationId,
        EventName,
        EventTimeStampEpoch,
        event_ts,
        trimBoth(replaceRegexpAll(clean_text_raw, '\\s+', ' ')) AS clean_text,
        if(EventName = 'MESSAGE_RECEIVED', 'User', 'Bot') AS speaker
    FROM stripped
    WHERE length(trimBoth(replaceRegexpAll(clean_text_raw, '\\s+', ' '))) > 0
      AND trimBoth(replaceRegexpAll(clean_text_raw, '\\s+', ' ')) NOT IN ('HAL-E', 'Employee Information:')
      AND NOT startsWith(trimBoth(replaceRegexpAll(clean_text_raw, '\\s+', ' ')), '/f ')
)
SELECT
    ConversationId AS interaction_id,
    arrayStringConcat(
        arrayMap(
            x -> concat(
                '[',
                formatDateTime(x.1, '%H:%M:%S'),
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
FROM messages
GROUP BY ConversationId
ORDER BY ConversationId
;
*/
