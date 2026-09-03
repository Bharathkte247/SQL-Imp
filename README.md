# SQL-Imp
All required SQLs

## assist_chatsession

| Path | Contents |
| --- | --- |
| `queries/assist_chatsession__original.sql` | the query as supplied, unmodified |
| `queries/assist_chatsession__original_typefix_only.sql` | the same query with the one cast that lets it compile, so its output can be inspected |
| `queries/assist_chatsession__fixed.sql` | corrected build, same 177-column output contract |
| `REVIEW.md` | the findings, each with a reproduction |
| `tests/` | mock source tables, fixture event stream, and the assertion suite |

Reproduce the review with a local ClickHouse:

```bash
curl -sS https://clickhouse.com/ | sh          # drops a `clickhouse` binary
CLICKHOUSE_BIN=./clickhouse tests/report.sh
```

`tests/report.sh` loads the fixtures, runs both query versions, and prints the
anti-pattern reproductions plus a pass/fail table. `tests/run.sh <query-file>`
runs a single query file against the fixtures, substituting the Jinja params.
