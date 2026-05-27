# QRA Web Application (Quality Audit Module)

This project is a web application inspired by your **Conversation Insights - Quality Audit Module** documentation.

It implements a working MVP of the roadmap areas:

- Data ingestion configuration and manual uploads
- Interaction listing with search/filter
- Transcript viewer with AI highlights
- Dynamic audit form engine with queue-based forms
- End-to-end audit workflow view
- Reporting and analytics summary

## Tech stack

- Node.js + Express
- Plain HTML/CSS/JavaScript frontend
- In-memory data store (MVP simulation)
- Optional ClickHouse helper endpoints retained from earlier work:
  - `GET /api/health`
  - `POST /api/query`

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open in browser:

- Dashboard: `http://localhost:3000`
- Quality Audit Workspace: `http://localhost:3000/quality-audit.html`

## Main screens

### Dashboard (`/`)

- Operational snapshot KPIs
- Quality Audit module tile (compact tile layout)
- Product roadmap phases

### Quality Audit Workspace (`/quality-audit.html`)

Tabs:

1. **Ingestion**
   - Configure ingestion sources (API, DB, cloud, SFTP)
   - Manual file upload simulation
   - View configured sources
2. **Interactions**
   - Filter/search interactions
   - Open interaction for review
3. **Transcript + Audit**
   - Transcript viewer with timestamps and speakers
   - AI highlights
   - Dynamic queue-specific audit form
   - Submit audit with score calculation (weightage + fatal checks)
4. **Workflow**
   - End-to-end audit lifecycle steps
5. **Reports**
   - QA summary KPIs
   - Queue performance table

## API endpoints (QRA MVP)

- `GET /api/qra/dashboard`
- `GET /api/qra/ingestion/sources`
- `POST /api/qra/ingestion/sources`
- `POST /api/qra/ingestion/uploads`
- `GET /api/qra/interactions`
- `GET /api/qra/interactions/:interactionId`
- `GET /api/qra/forms/:queue`
- `GET /api/qra/workflow`
- `POST /api/qra/audits`
- `GET /api/qra/reports`

## Notes

- Current persistence is in-memory for fast prototyping.
- On restart, sources, uploads, and audit submissions reset.
- This structure is ready to connect to real DB/microservices later (Ingestion Service, Audit Service, AI Scoring Service, Reporting Service, RBAC Service).
