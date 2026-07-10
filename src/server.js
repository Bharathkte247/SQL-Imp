const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const { connector, getErrorMessage, isReadOnlyQuery } = require("./db/connector");
const store = require("./wfmStore");

const app = express();
const PORT = Number(process.env.APP_PORT || 3000);
const MAX_ROWS = Number(process.env.MAX_QUERY_ROWS || 500);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function ok(res, data) {
  return res.json({ ok: true, data, asOf: new Date().toISOString() });
}

function fail(res, status, error, details) {
  return res.status(status).json({ ok: false, error, details });
}

app.get("/api/health", async (req, res) => {
  const status = await connector.checkConnection();
  if (!status.connected && status.type !== "demo") {
    return res.status(503).json(status);
  }
  return res.json(status);
});

app.get("/api/wfm/dashboard", (req, res) => ok(res, store.getDashboard()));

app.get("/api/wfm/forecast", (req, res) => {
  ok(res, {
    historical: store.getHistoricalVolumes(),
    forecast: store.getForecast(),
  });
});

app.get("/api/wfm/capacity", (req, res) => ok(res, store.getCapacityPlan()));

app.get("/api/wfm/schedules", (req, res) => ok(res, { schedules: store.getSchedules(), agents: store.agents }));

app.get("/api/wfm/realtime", (req, res) => ok(res, store.getRealtime()));

app.get("/api/wfm/skills", (req, res) => ok(res, store.getSkillsRouting()));

app.get("/api/wfm/attendance", (req, res) => ok(res, { records: store.getTimeAttendance() }));

app.get("/api/wfm/adherence", (req, res) => ok(res, store.getAdherence()));

app.patch("/api/wfm/adherence/:id", (req, res) => {
  const status = req.body?.status;
  if (!status) return fail(res, 400, "status is required");
  const updated = store.setAdherenceStatus(req.params.id, status);
  if (!updated) return fail(res, 404, "Adherence flag not found");
  return ok(res, updated);
});

app.get("/api/wfm/performance", (req, res) => ok(res, store.getPerformance()));

app.get("/api/wfm/leave", (req, res) => ok(res, { requests: store.leaveRequests }));

app.patch("/api/wfm/leave/:id", (req, res) => {
  const status = req.body?.status;
  if (!["approved", "denied", "pending"].includes(status)) {
    return fail(res, 400, "status must be approved, denied, or pending");
  }
  const updated = store.updateLeaveStatus(req.params.id, status);
  if (!updated) return fail(res, 404, "Leave request not found");
  return ok(res, updated);
});

app.get("/api/wfm/budget", (req, res) => ok(res, store.getBudget()));

app.get("/api/wfm/longterm", (req, res) => ok(res, store.getLongTermPlan()));

app.get("/api/wfm/coordination", (req, res) => ok(res, { items: store.getCoordination() }));

app.get("/api/wfm/connections", async (req, res) => {
  const live = await connector.checkConnection();
  ok(res, {
    active: live,
    profiles: store.connections,
    supportedTypes: ["demo", "clickhouse", "postgres", "mysql", "mssql"],
    authModel: "service-account",
  });
});

app.post("/api/wfm/connections/activate", async (req, res) => {
  const type = String(req.body?.type || "").toLowerCase();
  if (!["demo", "clickhouse", "postgres", "mysql", "mssql"].includes(type)) {
    return fail(res, 400, "Unsupported connection type");
  }
  try {
    const status = await connector.switchProfile(type);
    return ok(res, status);
  } catch (error) {
    return fail(res, 500, "Failed to activate connection", getErrorMessage(error));
  }
});

app.post("/api/query", async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== "string") {
    return fail(res, 400, "Request body must include a SQL query string.");
  }
  if (!isReadOnlyQuery(query)) {
    return fail(res, 400, "Only read-only queries are allowed.");
  }
  try {
    const result = await connector.query(query, MAX_ROWS);
    return ok(res, result);
  } catch (error) {
    return fail(res, 500, "Query failed", getErrorMessage(error));
  }
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return fail(res, 404, "API route not found");
  }
  return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

async function start() {
  const status = await connector.checkConnection();
  app.listen(PORT, () => {
    console.log(`PulseWFM listening on http://localhost:${PORT}`);
    console.log(
      `Database profile: ${status.type} (${status.connected ? "connected" : "not connected"})`
    );
  });
}

start().catch((error) => {
  console.error("Failed to start PulseWFM:", getErrorMessage(error));
  process.exit(1);
});
