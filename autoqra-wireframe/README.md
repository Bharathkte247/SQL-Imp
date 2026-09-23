# AutoQRA × Conversation Insights Wireframe

## Screens

| Nav | Description |
| --- | --- |
| **Feature Map** | All 31 AutoQRA capabilities |
| **Interactions** | Filterable list → detail (audit + GenAI summary) |
| **Import and export** | Techclient ingest + AutoQRA CSV export |
| **Jobs** | Jobs & results first, then New job (AutoQRA scoring runs) |
| **Coaching** | Long filterable list + example audits / coaching plan |
| **Reporting & Insights** | Filters, top agents, LOB leaderboard |
| **Admin** | Tabs: **Admin** · **Calibration & AI Opt** · **Advanced Insights** (previous options kept) |

## Run

```bash
git checkout cursor/autoqra-feature-wireframe-a131
cd autoqra-wireframe
python3 -m http.server 8765
```
