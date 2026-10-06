# AutoQRA × Conversation Insights Wireframe

## Screens

| Nav | Description |
| --- | --- |
| **Interactions** | MVP · QA and Agent role previews · two-column transcript with Details, Audit, and History |
| **Import and export** | MVP CSV/cloud ingest and export · SFTP pull/push clearly marked Future Development |
| **Jobs** | MVP LLM-form jobs · Short form monitoring, Custom form, and custom rubrics marked Future Development |
| **Coaching** | Future Development · Post-MVP clickable preview |
| **Reporting & Insights** | Future Development · Post-MVP clickable preview |
| **Settings** | Future Development · Post-MVP clickable preview · includes Scheduled pull |

## Role previews

- **QA view** shows the full Interactions filters and QA audit controls, plus Import and export and Jobs.
- **Agent view** is scoped to R. Patel and shows all of that agent's conversations, including Not Audited.
- Agent audits are read-only. Reviewed conversations can be accepted/acknowledged or disputed.
- QA-only administration modules are hidden while Agent view is active.

## Interaction status modes

| Status | Detail behavior |
| --- | --- |
| **Not Audited** | Empty monitoring form · QA picks LLM, QRA, short call, or supervisor form and can submit **QA Direct** |
| **LLM Audited** | AI-scored form, not submitted · human override |
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
