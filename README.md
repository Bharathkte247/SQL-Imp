# ClickHouse Local Web App

A minimal web application that connects to a local ClickHouse database, lets you run read-only SQL queries, and shows results in the browser.

## Tech stack

- Node.js + Express backend
- Official ClickHouse JS client (`@clickhouse/client`)
- Plain HTML/CSS/JS frontend
- Docker Compose for local ClickHouse

## Project structure

```text
.
├── public/                 # Browser UI
├── src/                    # Express API + ClickHouse client
├── docker/clickhouse/init/ # Seed SQL run when ClickHouse starts
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- Node.js 20+ (or any modern LTS)
- npm
- Docker + Docker Compose

## 1) Start local ClickHouse

```bash
docker compose up -d
```

This exposes:

- HTTP API: `http://localhost:8123`
- Native protocol: `localhost:9000`

The startup seed script creates a sample table: `default.events`.

## 2) Configure the app

```bash
cp .env.example .env
```

Default values work with the provided Docker Compose setup.

## 3) Install dependencies

```bash
npm install
```

## 4) Run the web app

```bash
npm run dev
```

Open:

`http://localhost:3000`

## API endpoints

- `GET /api/health`  
  Checks whether the app can reach ClickHouse.

- `POST /api/query`  
  Runs a read-only SQL query (`SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN`).

Example request body:

```json
{
  "query": "SELECT * FROM events ORDER BY event_time DESC LIMIT 10"
}
```

## Example queries to try in the UI

```sql
SELECT version();
```

```sql
SELECT * FROM events ORDER BY event_time DESC;
```

```sql
SHOW TABLES;
```
