# SQL-Imp

ClickHouse SQL for agent utilization reporting.

## `agent_utilization.sql`

Complete 15-minute agent utilization metrics from `firstam.eg_assist_cw_distributed`
(test filter: `2026-08-17`). Ready to run as-is for testing.

For Airflow, replace `firstam` with the client schema and `2026-08-17` with the cutoff date.
Do not leave Jinja-style braces in the SQL file (query runners treat them as required parameters).

### Login / break rules

| Metric | Rule |
| --- | --- |
| `loginTime` | Seconds between **Login** and **Logout** for the agent session |
| `breakTime` | `Unavailable` / `offline` seconds that fall **between Login and Logout** |

- Mid-session `offline` counts toward both `loginTime` and `breakTime`.
- `offline` after `Logout` (before the next Login) is excluded from both.
- Only explicit `Logout` closes the login window (`offline` is not treated as logout).

### Field mapping (`AGENT_STATUS`)

| Alias | Source |
| --- | --- |
| `agent_id` | `EventValue6` |
| `account_id` | `EventValue1` |
| `agent_name` | `EventValue7` |
| `agent_email` | `EventValue4` |
| `agent_current_status` | `EventValue5` |
| `agent_previous_status` | `EventValue12` |
| `team_name` | `EventValue9` |
| `team_id` | `EventValue8` |

### Tests

```bash
python3 tests/test_login_break_time.py
```
