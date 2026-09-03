#!/usr/bin/env bash
# Loads tests/fixtures.sql into a local ClickHouse and runs a query file against
# it, substituting the Jinja parameters the pipeline would normally inject.
#
#   usage: tests/run.sh <query-file> [extra clickhouse args...]
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CH="${CLICKHOUSE_BIN:-/tmp/clickhouse}"
DATA_DIR="${CH_DATA_DIR:-/tmp/chdata}"
SCHEMA="${CLIENT_SCHEMA:-mock}"
CUTOFF="${CUTOFF_DATE:-2026-08-01}"

QUERY_FILE="${1:?usage: tests/run.sh <query-file>}"
shift || true

mkdir -p "$DATA_DIR"

if [[ "${RELOAD_FIXTURES:-1}" == "1" ]]; then
    "$CH" local --path "$DATA_DIR" --multiquery < "$REPO/tests/fixtures.sql"
fi

sed -e "s/{{ params.client_schema }}/$SCHEMA/g" \
    -e "s/{{ params.cutoff_date }}/$CUTOFF/g" \
    "$QUERY_FILE" > /tmp/rendered.sql

"$CH" local --path "$DATA_DIR" --queries-file /tmp/rendered.sql "$@"
