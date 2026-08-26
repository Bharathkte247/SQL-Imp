# SQL-Imp

ClickHouse SQL for agent utilization reporting.

## `agent_utilization.sql`

Complete 15-minute agent utilization metrics from `firstam.eg_assist_cw_distributed`.
Source lookback is last 60 days. No hardcoded report-date filter.

### Login / break rules

| Metric | Rule |
| --- | --- |
| `loginTime` | Seconds between **Login** and **Logout** for the agent session |
| `breakTime` | `Unavailable` / `offline` seconds that fall **between Login and Logout** |

- Mid-session `offline` counts toward both `loginTime` and `breakTime`.
- `offline` after `Logout` (before the next Login) is excluded from both.
- Only explicit `Logout` closes the login window (`offline` is not treated as logout).
- Open sessions (no Logout yet) end at `now()`.

### Empty-result checklist

If the main query returns 0 rows, run `agent_utilization_diagnostics.sql`:

1. Confirm `AGENT_STATUS` rows exist for the tenant.
2. Inspect distinct `EventValue5` labels.
3. Confirm `login_like_rows > 0` — otherwise sessions never start.

Login matchers (case-insensitive): `login`, `logged in`, `loggedin`, `logged_in`, `online`  
Logout matchers (case-insensitive): `logout`, `logged out`, `loggedout`, `logged_out`

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
