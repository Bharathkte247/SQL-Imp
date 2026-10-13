# AutoQRA × Conversation Insights Wireframe

## Screens

| Nav | Description |
| --- | --- |
| **Transaction Review** | MVP in QA view · Agent view is a future-development preview · intent-aware Bot, Visitor, and human-agent transcript with Details, Audit, and History |
| **Import and export** | MVP CSV/cloud ingest, export, and scoring jobs · SFTP pull marked Future Development · Short form monitoring, Custom form, and custom rubrics marked Future Development |
| **Coaching** | Future Development · QA-only preview of overall, team, and agent coaching |
| **Agent Coaching** | Future Development · Agent-only overall and eight rubric-area percentage trends from a consistent monitored sample · read-only training status and supervisor help requests |
| **Team Insights** | Future Development · Post-MVP clickable preview · team scores plus training requests and completions |
| **Settings** | Future Development · Post-MVP clickable preview · includes Scheduled pull, SFTP Push, and Cloud connections |

## Role previews

- **QA view** shows the full Transaction Review filters and QA audit controls, plus Import and export, Coaching, and Team Insights. Jobs live under Import and export.
- **Agent view** is a future-development preview. It is scoped to R. Patel and shows Transaction Review and Agent Coaching.
- Agent Coaching tracks the overall score and eight rubric-area percentages across four weeks. Every week uses the same monitored count. Training module status is read-only. Each module can record a supervisor help request.
- Agent audits are read-only. Reviewed conversations can be accepted/acknowledged or disputed.
- QA-only administration modules stay hidden while Agent view is active. Team Insights lists the same R. Patel modules, including supervisor help requests.
- Interaction transcripts show bot intake and handoff separately from the named human agent's verification, empathy, action, disclosure, and resolution turns. Audit rationale cites the human-agent dialogue.

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
