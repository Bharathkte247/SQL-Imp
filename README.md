# SQL-Imp

ClickHouse SQL for agent utilization reporting.

## `agent_utilization.sql`

Complete 15-minute agent utilization metrics from `firstam.eg_assist_cw_distributed`.

Current test filters in SQL:
- Date: `2026-08-17`
- Agent: `asthompson@firstam.com`

### firstam status vocabulary (from sample export)

| EventValue5 | Meaning in this query |
| --- | --- |
| `login` | Session start |
| `available` | Active / ready (also session start when previous is `offline`) |
| `busy` | Busy time |
| `offline` | Break time when current status (not logout) |

There is often **no `Logout` event** in the sample. Open sessions are capped at `now()`.

### Login / break rules

| Metric | Rule |
| --- | --- |
| `loginTime` | Seconds between session start and Logout |
| `breakTime` | `unavailable` / `offline` seconds inside that window |

Session starts when:
1. Status is `login` / `logged in` / …, or
2. Status is `available` / `online` / `active` and previous status is `offline` / `unavailable`

### Empty-result checklist

Run `agent_utilization_diagnostics.sql`. If `session_start_rows = 0`, update matchers from the distinct status list.

### Tests

```bash
python3 tests/test_login_break_time.py
```

Includes a fixture replay of the firstam sample CSV (`tests/fixtures/firstam_sample_events.csv`).
