# AutoQRA × Conversation Insights Wireframe

Interactive wireframe that integrates AutoQRA features into the **Conversation Insights** UI pattern from the product screenshots.

## Screens

| Nav item | What it covers |
| --- | --- |
| **Feature Map** | All 31 AutoQRA capabilities mapped to CI screens |
| **Interactions** | Filters (date, queue, LOB, agent, intent, source, status) + transcript + **Details / Audit / History** tabs with Patelco audit form |
| **Data Import** | Techclient ingest (CSV upload, job preview, recent jobs) + Export AutoQRA CSV |
| **Sampling** | New sample filters + Jobs & results for AutoQRA runs |
| **Admin** | Tenant config, API pull / SFTP / bucket ingestion, RBAC, monitoring forms |
| **Analytics** | Reporting, intent, coaching, predictive insights |

## Run

```bash
cd autoqra-wireframe
python3 -m http.server 8765
```

Open http://localhost:8765

Tenant breadcrumb uses `techclient / test / ude` to represent technology-client context.
