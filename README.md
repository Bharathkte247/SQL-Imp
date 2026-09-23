# AutoQRA × Conversation Insights Wireframe

## Screens

| Nav | Description |
| --- | --- |
| **Feature Map** | All 31 AutoQRA capabilities |
| **Interactions** | Status filter: Not Audited · LLM Audited · QA Reviewed · Pending Dispute · Complete → detail modes |
| **Import and export** | Techclient ingest + AutoQRA CSV export |
| **Jobs** | Jobs & results first, then New job (AutoQRA scoring runs) |
| **Coaching\*** | Not available now · **Overall** = period themes for all agents · **Team** = team/queue · **Agent** = per-agent plans (former Overall list) |
| **Reporting & Insights\*** | Not available now (preview) |
| **Settings\*** | Not available now · Admin / Calibration / **Advanced Settings** (empty) tabs |

## Interaction status modes

| Status | Detail behavior |
| --- | --- |
| **Not Audited** | Empty monitoring form for manual QA · no Advanced Insights pane |
| **LLM Audited** | AI-scored form, not submitted · human override · **Advanced Insights\*** pane |
| **QA Reviewed** | Manual or Hybrid · human override greyed out |
| **Pending Dispute** | Manual or Hybrid · human override enabled |
| **Complete** | Agent feedback acknowledged · audit locked |

## Run

```bash
git checkout cursor/autoqra-feature-wireframe-a131
cd autoqra-wireframe
python3 -m http.server 8765
```
