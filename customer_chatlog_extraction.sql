-- ClickHouse: visitor + Brand transcript as a single text blob (optimized)
-- Source: {{ params.client_schema }}.eg_agentic_runtime_distributed
-- Grain: one row per ConversationId
--
-- Role mapping (EventValue2 = 'customer'):
--   visitor = MESSAGE_RECEIVED
--   Brand   = MESSAGE_SENT
--
-- Optimizations vs multi-CTE version:
--   1) No EventTimeStampISO parsing (timestamps are not rendered; epoch sorts only)
--   2) JSON text via coalesce(nullIf(JSONExtractString(...))) — skips isValidJSON/JSONHas
--   3) Entity decode + markup strip in one expression (fewer pipeline stages)
--   4) Two CTEs only: cleaned lines → aggregate blob
--   5) Prefer a partition/date predicate in production (biggest win on Distributed tables)
--
-- Blob format (newline-separated, time-ordered, no timestamp shown):
--   visitor: ...
--   Brand: ...

WITH
cleaned AS (
    SELECT
        ConversationId,
        EventTimeStampEpoch,
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
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
      -- AND toDate(fromUnixTimestamp64Milli(toInt64(EventTimeStampEpoch))) = toDate('2026-08-17')  -- add in prod
      AND ifNull(EventValue1, '') != ''
),
usable AS (
    SELECT
        ConversationId,
        EventTimeStampEpoch,
        speaker,
        clean_text
    FROM cleaned
    WHERE length(clean_text) > 0
      AND clean_text NOT IN ('HAL-E', 'Employee Information:', 'Employee')
      AND NOT startsWith(clean_text, '/f ')
      AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
      AND positionCaseInsensitive(clean_text, 'Intent: HAL_E') = 0
      AND NOT match(clean_text, '(?i)^(div|span|p|br|strong|hxelement|version)(\\s|$)')
)
SELECT
    ConversationId AS interaction_id,
    arrayStringConcat(
        arrayMap(
            x -> concat(x.2, ': ', x.3),
            arraySort(
                x -> x.1,
                groupArray((EventTimeStampEpoch, speaker, clean_text))
            )
        ),
        '\n'
    ) AS combined_chat_log
FROM usable
GROUP BY ConversationId
ORDER BY ConversationId
;


-- -----------------------------------------------------------------------------
-- Sample ConversationIds (ad-hoc). Replace __CLIENT_SCHEMA__.
-- -----------------------------------------------------------------------------
/*
WITH
cleaned AS (
    SELECT
        ConversationId,
        EventTimeStampEpoch,
        if(EventName = 'MESSAGE_RECEIVED', 'visitor', 'Brand') AS speaker,
        trimBoth(
            replaceRegexpAll(
                replaceRegexpAll(
                    replaceAll(
                        replaceAll(
                            replaceAll(
                                replaceAll(
                                    replaceAll(
                                        replaceAll(
                                            replaceAll(
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
                    '(?i)<[^>]*>|</?[A-Za-z][A-Za-z0-9]*|\\s*(?:class|version|style|id|href|src|type|role|aria-[A-Za-z0-9-]+)\\s*=\\s*(\"[^\"]*\"|\'[^\']*\'|[^\\s<>]+)|\\{[^\\n]*\\}|\\[[^\\n]*\\]|\"[A-Za-z_][A-Za-z0-9_]*\"\\s*:\\s*|[\\{\\}\\[\\]<>\"]+',
                    ' '
                ),
                '\\s+',
                ' '
            )
        ) AS clean_text
    FROM __CLIENT_SCHEMA__.eg_agentic_runtime_distributed
    WHERE EventName IN ('MESSAGE_RECEIVED', 'MESSAGE_SENT')
      AND EventValue2 = 'customer'
      AND ifNull(EventValue1, '') != ''
      AND ConversationId IN (
          '0fe9edda-1c04-4097-9abc-d9741c5f1b10',
          'c7e85ffa-435b-48da-ac74-f86c6882dd85',
          'fa3f2424-7ba4-4cc5-8089-0d92efd00b27'
      )
),
usable AS (
    SELECT ConversationId, EventTimeStampEpoch, speaker, clean_text
    FROM cleaned
    WHERE length(clean_text) > 0
      AND clean_text NOT IN ('HAL-E', 'Employee Information:', 'Employee')
      AND NOT startsWith(clean_text, '/f ')
      AND positionCaseInsensitive(clean_text, 'card submitted Intent:') = 0
      AND positionCaseInsensitive(clean_text, 'Intent: HAL_E') = 0
      AND NOT match(clean_text, '(?i)^(div|span|p|br|strong|hxelement|version)(\\s|$)')
)
SELECT
    ConversationId AS interaction_id,
    arrayStringConcat(
        arrayMap(
            x -> concat(x.2, ': ', x.3),
            arraySort(x -> x.1, groupArray((EventTimeStampEpoch, speaker, clean_text)))
        ),
        '\n'
    ) AS combined_chat_log
FROM usable
GROUP BY ConversationId
ORDER BY ConversationId
;
*/
