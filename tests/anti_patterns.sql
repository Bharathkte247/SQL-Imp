-- ============================================================================
-- Minimal reproductions of the structural anti-patterns behind most of the
-- findings in REVIEW.md. Each block is self-contained; none of them depend on
-- the full query.
-- ============================================================================

SELECT '--- F1: signed/unsigned mix inside coalesce() (breaks min/minIf) ---' AS probe FORMAT TSVRaw;
SELECT toTypeName(coalesce(toInt64OrNull('x'), toUInt64(1))) AS common_type_is_a_variant FORMAT PrettyCompactMonoBlock;

SELECT '--- F16: JSONExtractString returns empty string, never NULL ---' AS probe FORMAT TSVRaw;
SELECT
    JSONExtractString('{"a":1}', 'missing')                        AS extracted,
    JSONExtractString('{"a":1}', 'missing') IS NULL                AS is_null,
    coalesce(JSONExtractString('{"a":1}', 'missing'), 'FALLBACK')  AS coalesce_never_falls_through,
    ifNull('', 'visitor_leave')                                    AS ifnull_never_defaults,
    coalesce(nullIf(JSONExtractString('{"a":1}', 'missing'), ''), 'FALLBACK') AS with_nullif
FORMAT PrettyCompactMonoBlock;

SELECT '--- F17: a missed LEFT JOIN yields defaults, not NULL ---' AS probe FORMAT TSVRaw;
SELECT
    r.v                          AS right_side_value,
    r.v IS NULL                  AS right_side_is_null,
    coalesce(r.v, 'FALLBACK')    AS coalesce_across_join
FROM (SELECT 'miss' AS k) l
LEFT JOIN (SELECT 'hit' AS k, 'x' AS v) r ON l.k = r.k
FORMAT PrettyCompactMonoBlock;

SELECT '--- F5: row_number() is computed over the unfiltered partition ---' AS probe FORMAT TSVRaw;
SELECT
    event_name,
    row_number() OVER (PARTITION BY iid ORDER BY ts) AS rn,
    -- what the original used to decide "this is the conversation end event"
    event_name IN ('CONVERSATION_ENDED', 'CONVERSATION_TERMINATED', 'RESERVATION_COMPLETED')
      AND row_number() OVER (PARTITION BY iid ORDER BY ts) = 1 AS is_conversation_end_event
FROM (
    SELECT 'I1' AS iid, arrayJoin([
        ('CONVERSATION_CREATED', 1), ('AGENT_ASSIGNED', 2),
        ('CONVERSATION_TERMINATED', 3), ('CONVERSATION_ENDED', 4)]) AS t,
    t.1 AS event_name, t.2 AS ts
)
ORDER BY ts
FORMAT PrettyCompactMonoBlock;

SELECT '--- F18: any() over every event of an interaction is order-dependent ---' AS probe FORMAT TSVRaw;
SELECT
    -- isPremiumVisitor is only carried by CONVERSATION_CREATED
    (SELECT any(v) FROM (SELECT arrayJoin([('CONVERSATION_CREATED','true'),('MESSAGE_SENT',''),('CONVERSATION_ENDED','')]) AS t, t.2 AS v)) AS any_created_first,
    (SELECT any(v) FROM (SELECT arrayJoin([('MESSAGE_SENT',''),('CONVERSATION_ENDED',''),('CONVERSATION_CREATED','true')]) AS t, t.2 AS v)) AS any_created_last,
    (SELECT max(v) FROM (SELECT arrayJoin([('MESSAGE_SENT',''),('CONVERSATION_ENDED',''),('CONVERSATION_CREATED','true')]) AS t, t.2 AS v)) AS order_independent
FORMAT PrettyCompactMonoBlock;

SELECT '--- F15: lagInFrame over a NULL ordering key follows physical order ---' AS probe FORMAT TSVRaw;
SELECT interaction_id, requested, previous_interaction_id
FROM (
    SELECT interaction_id, requested,
           lagInFrame(interaction_id, 1) OVER (PARTITION BY conv ORDER BY start_time) AS previous_interaction_id
    FROM (
        SELECT 'CONV-10' AS conv,
               arrayJoin([('I10', '12:21', CAST(NULL AS Nullable(DateTime))), ('I9', '12:20', NULL)]) AS t,
               t.1 AS interaction_id, t.2 AS requested, t.3 AS start_time
    )
)
ORDER BY requested
FORMAT PrettyCompactMonoBlock;

SELECT '--- F19: the two payload access shapes cannot both be right ---' AS probe FORMAT TSVRaw;
SELECT
    JSONExtractString(data, 'TaskAttributes', 'interactionId')                        AS unwrapped_path,
    JSONExtractString(JSONExtractString(data, 'string'), 'TaskAttributes', 'interactionId') AS wrapped_path
FROM (SELECT '{"string":"{\\"TaskAttributes\\":{\\"interactionId\\":\\"I1\\"}}"}' AS data)
FORMAT PrettyCompactMonoBlock;

SELECT '--- F13: minIf() with no matching rows returns 0, not NULL ---' AS probe FORMAT TSVRaw;
SELECT minIf(x, x > 100) AS no_match, toTypeName(minIf(x, x > 100)) AS type
FROM (SELECT 1 AS x)
FORMAT PrettyCompactMonoBlock;

SELECT '--- F14: if() on a NULL comparison silently takes the else branch ---' AS probe FORMAT TSVRaw;
SELECT
    CAST(NULL AS Nullable(Int64)) < 30000                       AS comparison,
    if(CAST(NULL AS Nullable(Int64)) < 30000, 1, 0)             AS sla_flag_reported
FORMAT PrettyCompactMonoBlock;
