# AutoQRA × Conversation Insights Wireframe

## Screens

| Nav | Description |
| --- | --- |
| **Interactions** | Status filter: Not Audited · LLM Audited · QA Direct · QA Reviewed · Pending Dispute · Complete → detail modes |
| **Import and export** | CSV ingest · Scheduled transcript pull · SFTP pull/push · Cloud connections (AWS S3 · Azure Blob · GCS) · AutoQRA CSV export |
| **Jobs** | Jobs & results first, then New job. Optional end date. Form is LLM, Short form monitoring, or Custom. Rubric areas appear only for Custom. QA Direct rows are skipped. |
| **Coaching\*** | Not available now · **Overall** = period themes for all agents · **Team** = team/queue · **Agent** = one agent's assigned plans and conversations |
| **Reporting & Insights\*** | Not available now (preview) · section Top 10 / Bottom 10 |
| **Settings\*** | Not available now · Admin / Calibration / Advanced Settings / **About** |

## Interaction status modes

| Status | Detail behavior |
| --- | --- |
| **Not Audited** | Empty monitoring form · QA picks LLM, QRA, short call, or supervisor form and can submit **QA Direct** |
| **LLM Audited** | AI-scored form, not submitted · human override · **Advanced Insights\*** pane |
| **QA Direct** | Human scored with no LLM review · excluded from later scoring jobs · ratings feed the LLM improvement loop |
| **QA Reviewed** | Review after an LLM audit · Manual or Hybrid · human override greyed out |
| **Pending Dispute** | Manual or Hybrid · human override enabled |
| **Complete** | Agent feedback acknowledged · audit locked |

## Run locally

> **Important:** This folder is on branch `cursor/autoqra-feature-wireframe-a131`.  
> It is **not** on `main`. Checkout that branch first or you will not see `autoqra-wireframe/`.

```bash
# from repo root
git fetch origin
git checkout cursor/autoqra-feature-wireframe-a131

cd autoqra-wireframe
python3 -m http.server 8765
```

Open: **http://127.0.0.1:8765/**

Helper script (same thing):

```bash
cd autoqra-wireframe
./start.sh
```

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| `autoqra-wireframe` folder missing | You are on `main`. Run `git checkout cursor/autoqra-feature-wireframe-a131` |
| Blank page / files 404 | Serve from **inside** `autoqra-wireframe` (not the repo root). Do not open `index.html` via `file://` if assets fail to load. |
| Port in use | `python3 -m http.server 8766` then open that port |
| Old UI after pull | Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac) |
