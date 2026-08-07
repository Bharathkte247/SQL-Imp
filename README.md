# SQL-Imp

ClickHouse / BigQuery SQL implementations.

## Day-level campaign call view

### ClickHouse
- `clickhouse/day_level_campaign_calls_view.sql` — `CREATE VIEW`
- `clickhouse/day_level_campaign_calls_select.sql` — standalone `SELECT`

### BigQuery
- `bigquery/day_level_campaign_calls_view.sql` — `CREATE VIEW`
- `bigquery/day_level_campaign_calls_select.sql` — standalone `SELECT`

### Dimensions

| Dimension | Source |
|-----------|--------|
| `call_date` | Day from `call_interaction_starttime` |
| `campaign` | `Physical_CampaignStart` → PH Campaign; `Flu_CampaignStart` → FLU Campaign (latest by `node_sequence_number`) |
| `language` | `Exit_EnglishSelected` → English; `Exit_SpanishSelected` → Spanish (latest wins if both present) |
| `dnis` | `dnis` |
| `caller_phonenumber` | `caller_phonenumber` |
| `project_name` | `project_name` |
| `application_id` | `application_id` |
| `call_type` | `call_type` |

### Measures

| Measure | Definition |
|---------|------------|
| `total_calls` | Unique `call_interaction_id` |
| `opted_out_calls` | Unique calls that hit any opt-out intent node listed below |

Opt-out intent nodes:

- `PH_IBOptOutNoDisconnect`
- `PH_InOptOutDisconnect`
- `PH_OptOutNoDisconnect`
- `PH_OBOptOutNoDisconnect`
- `PH_OptOutDisconnect`
- `PH_InOptOutNoDisconnect`

Replace the placeholder source table before running:
- ClickHouse: `default.node_level_interactions`
- BigQuery: `your_project.your_dataset.node_level_interactions`
