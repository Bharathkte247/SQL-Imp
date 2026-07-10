# PulseWFM — Workforce Management

Workforce management platform for **voice and digital** channels (chat, email, tickets). Connects to cloud or on-prem databases through a shared **service account**.

## What it covers

| # | Module | Capability |
|---|--------|------------|
| 1 | Demand forecasting | Historical volumes, seasonality, trends, special events |
| 2 | Capacity planning | Forecast → FTE with shrinkage (breaks, training, leave, absenteeism) |
| 3 | Scheduling | Shifts, breaks, lunches, off-phone blocks |
| 4 | Real-time management | Intraday vs forecast, reallocation / OT recommendations |
| 5 | Skills-based routing | Language, product, tier matching to queues |
| 6 | Time & attendance | Hours worked, exceptions (late, absent, early leave) |
| 7 | Adherence & conformance | Schedule deviation flags |
| 8 | Performance analytics | SL, occupancy, utilization, AHT, shrinkage, forecast MAPE |
| 9 | Leave management | PTO / sick leave vs staffing impact |
| 10 | Budget & cost | Labor budget, OT, hiring recommendations |
| 11 | Long-term planning | Hiring / attrition and training calendar |
| 12 | Cross-functional sync | Training, IT, QA, ops coordination |

Plus a **Connections** workspace to activate demo or live DB profiles.

## Tech stack

- Node.js + Express API
- Static HTML / CSS / JS frontend (`public/`)
- Multi-DB connector (`src/db/connector.js`): demo, ClickHouse, Postgres, MySQL, SQL Server
- In-memory demo store when `DB_TYPE=demo`

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database connectivity (service account)

Set in `.env`:

```bash
DB_TYPE=postgres   # demo | clickhouse | postgres | mysql | mssql
DB_HOST=...
DB_PORT=...
DB_NAME=wfm
DB_USER=wfm_service
DB_PASSWORD=...
DB_SSL=false
```

Driver-specific overrides are documented in `.env.example`. Live SQL via `POST /api/query` is **read-only** (SELECT / SHOW / DESCRIBE / EXPLAIN / WITH).

## Main API routes

- `GET /api/health`
- `GET /api/wfm/dashboard`
- `GET /api/wfm/forecast|capacity|schedules|realtime|skills|attendance|adherence|performance|leave|budget|longterm|coordination|connections`
- `PATCH /api/wfm/leave/:id` — `{ "status": "approved" | "denied" | "pending" }`
- `PATCH /api/wfm/adherence/:id` — `{ "status": "acknowledged" }`
- `POST /api/wfm/connections/activate` — `{ "type": "demo" | "clickhouse" | ... }`
- `POST /api/query` — `{ "query": "SELECT ..." }`

## Tests

```bash
npm test
```
