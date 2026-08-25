# SQL-Imp
All required SQLs

## SQL files

- `agent_status_events.sql` — ClickHouse SELECT of `AGENT_STATUS` events from `client1.eg_assist_cw_distributed` for the last 60 days. Maps agent/account/team fields (`EventValue12` = previous status). Keeps in-session `Offline` (after login, before logout); drops `Offline` after logout.
