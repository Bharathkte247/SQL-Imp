# SQL-Imp

ClickHouse SQL for agent utilization reporting.

## `agent_utilization.sql`

Builds 15-minute agent utilization metrics from `eg_assist_cw_distributed`.

### Login / break rules

| Metric | Rule |
| --- | --- |
| `loginTime` | Seconds between **Login** and **Logout** for the agent session |
| `breakTime` | `Unavailable` / `offline` seconds that fall **between Login and Logout** |

- Mid-session `offline` counts toward both `loginTime` and `breakTime`.
- `offline` after `Logout` (before the next Login) is excluded from both.
- Only explicit `Logout` closes the login window (`offline` is not treated as logout).

### Optimizations applied

| Change | Why |
| --- | --- |
| `LIMIT 1 BY event_unique_id` | Cheaper dedup than `row_number()` + filter |
| `agent_session_windows` (1 row/session) | Replaces conversation × every-status-event `CROSS JOIN` |
| Early `cutoff_date` prune | Skips second expansion for pre-cutoff segments/interactions |
| Folded logout clipping into segment CTE | Fewer intermediate passes |
| Removed unused `agent_session_groups` | Dead work |
| Shared `status_with_concurrency` | Single join shape reused by ByQueueRole + OverAll |
| `uniqExact` / `uniqExactIf` on seconds | Exact counts; cardinality per 15‑min bucket ≤ 900 |

### Remaining cost driver

Per-second `ARRAY JOIN range(...)` is still required for concurrency-aware metrics (`engageTime`, `handleTime`, `maxConcurrency`, availability∩chat flags). Further gains need either:

- interval-overlap math (no second explode), or
- a narrower lookback / incremental load into a daily fact table

### Tests

```bash
python3 tests/test_login_break_time.py
```
