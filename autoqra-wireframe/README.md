# AutoQRA × Conversation Insights Wireframe

Interactive wireframe integrating AutoQRA into Conversation Insights navigation.

## Screens

| Nav | Description |
| --- | --- |
| **Feature Map** | All 31 AutoQRA capabilities |
| **Interactions** | Starts as a **filterable list**; selecting a row opens transcript + Details / Audit / History (monitoring form scoring + GenAI summary) |
| **Data Import** | Techclient CSV / API ingest and AutoQRA export |
| **Sampling** | New sample filters + Jobs & results |
| **Coaching** | Coaching opportunities ranked by audit volume / defects |
| **Reporting & Insights** | Embedded Superset dashboard placeholder |
| **Calibration & AI Opt** | Calibration sessions + AI optimization actions |
| **Advanced Insights** | Sentiment, predictive, intent, behavioral scoring |
| **Admin** | Tenant config; **CRM & KB** opens a config pane with known systems |

## Run

```bash
git checkout cursor/autoqra-feature-wireframe-a131
cd autoqra-wireframe
python3 -m http.server 8765
```

Open http://localhost:8765
