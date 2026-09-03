#!/usr/bin/env bash
# Loads the fixtures, materialises the output of both query versions, and runs
# the assertion suite in tests/expectations.sql.
#
#   usage: tests/report.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CH="${CLICKHOUSE_BIN:-/tmp/clickhouse}"
DATA_DIR="${CH_DATA_DIR:-/tmp/chdata}"
SCHEMA="${CLIENT_SCHEMA:-mock}"
CUTOFF="${CUTOFF_DATE:-2026-08-01}"

render() {
    sed -e "s/{{ params.client_schema }}/$SCHEMA/g" -e "s/{{ params.cutoff_date }}/$CUTOFF/g" "$1"
}

materialise() {  # materialise <query-file> <target-table>
    {
        echo "DROP TABLE IF EXISTS $2;"
        echo "CREATE TABLE $2 ENGINE = MergeTree ORDER BY tuple() AS"
        render "$1"
        echo ";"
    } > "/tmp/$(basename "$2").sql"
    "$CH" local --path "$DATA_DIR" --multiquery < "/tmp/$(basename "$2").sql"
}

echo "== loading fixtures =="
"$CH" local --path "$DATA_DIR" --multiquery < "$REPO/tests/fixtures.sql"

echo "== the query as supplied =="
if render "$REPO/queries/assist_chatsession__original.sql" > /tmp/as_supplied.sql \
   && "$CH" local --path "$DATA_DIR" --queries-file /tmp/as_supplied.sql --format Null 2>/tmp/as_supplied.err; then
    echo "   compiled and ran"
else
    echo "   FAILED to run:"
    sed 's/^/   /' /tmp/as_supplied.err
fi

echo
echo "== materialising both versions =="
materialise "$REPO/queries/assist_chatsession__original_typefix_only.sql" mock.orig
materialise "$REPO/queries/assist_chatsession__fixed.sql" mock.fixed
echo "   mock.orig and mock.fixed ready"

echo
echo "== anti-pattern reproductions =="
"$CH" local --queries-file "$REPO/tests/anti_patterns.sql"

echo
echo "== assertions =="
"$CH" local --path "$DATA_DIR" --queries-file "$REPO/tests/expectations.sql" \
      --format PrettyCompactMonoBlock

echo
echo "== illustrative rows =="
echo "-- F2: two unrelated conversations merged into one output row --"
"$CH" local --path "$DATA_DIR" --query "
SELECT interaction_id, account_id, chat_conversation_id,
       first_connected_agent_name, total_queue_wait_time
FROM mock.orig WHERE interaction_id = ''" --format Vertical

echo "-- F3: interaction I5 duplicated, transcript split across the rows --"
"$CH" local --path "$DATA_DIR" --query "
SELECT interaction_id, chat_log FROM mock.orig WHERE interaction_id = 'I5'" --format Vertical

echo "-- the same interaction in the corrected build --"
"$CH" local --path "$DATA_DIR" --query "
SELECT interaction_id, chat_log FROM mock.fixed WHERE interaction_id = 'I5'" --format Vertical

echo
echo "== summary =="
"$CH" local --path "$DATA_DIR" --query "
WITH
  -- Every interaction the fixture describes, taking the id from the payload
  -- when the InteractionId column is blank.
  (SELECT uniqExact(coalesce(nullIf(InteractionId, ''),
                             nullIf(JSONExtractString(JSONExtractString(data, 'string'),
                                                      'TaskAttributes', 'interactionId'), '')))
   FROM mock.eg_assist_cw_distributed)     AS interactions_in_fixture,
  (SELECT count() FROM mock.orig)          AS original_rows,
  (SELECT count() FROM mock.fixed)         AS fixed_rows
SELECT interactions_in_fixture, original_rows, fixed_rows" \
      --format PrettyCompactMonoBlock
