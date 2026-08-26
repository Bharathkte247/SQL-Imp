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

### Tests

```bash
python tests/test_login_break_time.py
```
