# SQL-Imp

ClickHouse / SQL implementations.

## Day-level campaign call view

- `clickhouse/day_level_campaign_calls_view.sql` — `CREATE VIEW` for day-level metrics
- `clickhouse/day_level_campaign_calls_select.sql` — same logic as a standalone `SELECT`

### Dimensions

| Dimension | Source |
|-----------|--------|
| `call_date` | Day from `call_interaction_starttime` |
| `campaign` | `Physical_CampaignStart` → PH Campaign; `Flu_CampaignStart` → FLU Campaign (latest by `node_sequence_number`) |
| `language` | `Exit_EnglishSelected` → English; `Exit_SpanishSelected` → Spanish (latest wins if both present) |
| `dnis` | `dnis` |
| `caller_phonenumber` | `caller_phonenumber` |
| `project_name` | `project_name` |
| `call_type` | `call_type` |

### Measures

| Measure | Definition |
|---------|------------|
| `total_calls` | `uniqExact(call_interaction_id)` |
| `opted_out_calls` | Unique calls that hit any opt-out intent node listed below |

Opt-out intent nodes:

- `PH_IBOptOutNoDisconnect`
- `PH_InOptOutDisconnect`
- `PH_OptOutNoDisconnect`
- `PH_OBOptOutNoDisconnect`
- `PH_OptOutDisconnect`
- `PH_InOptOutNoDisconnect`

Replace `default.node_level_interactions` with your source table name before running.
