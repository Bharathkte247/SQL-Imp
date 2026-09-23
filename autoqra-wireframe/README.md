# AutoQRA × Conversation Insights Wireframe

## Screens

| Nav | Description |
| --- | --- |
| **Interactions** | Status filter: Not Audited · LLM Audited · QA Reviewed · Pending Dispute · Complete → detail modes |
| **Import and export** | CSV ingest · SFTP pull/push · Cloud connections (AWS S3 · Azure Blob · GCS) · AutoQRA CSV export |
| **Jobs** | Jobs & results first, then New job (AutoQRA scoring runs) |
| **Coaching\*** | Not available now · **Overall** = period themes for all agents · **Team** = team/queue · **Agent** = per-agent plans |
| **Reporting & Insights\*** | Not available now (preview) |
| **Settings\*** | Not available now · Admin / Calibration / Advanced Settings / **About** (feature list; former Feature Map) |

## Interaction status modes

| Status | Detail behavior |
| --- | --- |
| **Not Audited** | Empty monitoring form for manual QA · no Advanced Insights pane |
| **LLM Audited** | AI-scored form, not submitted · human override · **Advanced Insights\*** pane |
| **QA Reviewed** | Manual or Hybrid · human override greyed out |
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
