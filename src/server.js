const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const { clickhouseClient, checkConnection, getErrorMessage } = require("./clickhouse");
const {
  interactions,
  formsByQueue,
  ingestionSources,
  ingestionBatches,
  audits,
  workflowSteps,
  getDashboardSummary,
  getReports,
} = require("./qraStore");

const app = express();
const PORT = Number(process.env.APP_PORT || 3000);
const MAX_ROWS = Number(process.env.MAX_QUERY_ROWS || 200);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function isReadOnlyQuery(sql) {
  const cleaned = sql.trim().replace(/;+\s*$/, "");
  return /^(select|show|describe|desc|explain)\b/i.test(cleaned);
}

function withLimit(sql) {
  const cleaned = sql.trim().replace(/;+\s*$/, "");
  if (/\blimit\s+\d+(\s*,\s*\d+)?\s*$/i.test(cleaned)) {
    return cleaned;
  }
  return `${cleaned} LIMIT ${MAX_ROWS}`;
}

function calculateFinalScore(formDefinition, attributeScores) {
  let weightedScore = 0;
  let totalWeight = 0;
  let hasFatalFailure = false;

  formDefinition.sections.forEach((section) => {
    section.attributes.forEach((attribute) => {
      const score = Number(attributeScores[attribute.key] ?? 0);
      weightedScore += score * attribute.weightage;
      totalWeight += 10 * attribute.weightage;
      if (attribute.fatal && score < 6) {
        hasFatalFailure = true;
      }
    });
  });

  const scorePercent = totalWeight ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const thresholdPassed = scorePercent >= formDefinition.overallThreshold;

  return {
    scorePercent,
    result: hasFatalFailure || !thresholdPassed ? "Fail" : "Pass",
    hasFatalFailure,
  };
}

app.get("/api/health", async (req, res) => {
  const status = await checkConnection();
  if (!status.connected) {
    return res.status(503).json(status);
  }
  return res.json(status);
});

app.post("/api/query", async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Request body must include a SQL query string." });
  }

  if (!isReadOnlyQuery(query)) {
    return res
      .status(400)
      .json({ error: "Only read-only queries are allowed (SELECT, SHOW, DESCRIBE, EXPLAIN)." });
  }

  try {
    const finalQuery = withLimit(query);
    const resultSet = await clickhouseClient.query({
      query: finalQuery,
      format: "JSONEachRow",
    });
    const rows = await resultSet.json();
    return res.json({ rows, rowCount: rows.length, executedQuery: finalQuery });
  } catch (error) {
    return res.status(500).json({
      error: "ClickHouse query failed.",
      details: getErrorMessage(error),
    });
  }
});

app.get("/api/qra/dashboard", (req, res) => {
  return res.json(getDashboardSummary());
});

app.get("/api/qra/ingestion/sources", (req, res) => {
  return res.json({ sources: ingestionSources, batches: ingestionBatches });
});

app.post("/api/qra/ingestion/sources", (req, res) => {
  const { name, type, location, schedule } = req.body || {};
  if (!name || !type || !location) {
    return res.status(400).json({ error: "name, type and location are required." });
  }

  const newSource = {
    id: `SRC-${ingestionSources.length + 1}`,
    name,
    type,
    location,
    schedule: schedule || "Daily",
    status: "Active",
  };

  ingestionSources.push(newSource);
  return res.status(201).json({ source: newSource });
});

app.post("/api/qra/ingestion/uploads", (req, res) => {
  const { fileNames, source } = req.body || {};
  if (!Array.isArray(fileNames) || fileNames.length === 0) {
    return res.status(400).json({ error: "fileNames must be a non-empty array." });
  }

  const batch = {
    id: `BATCH-${ingestionBatches.length + 1}`,
    source: source || "Manual Upload",
    fileCount: fileNames.length,
    files: fileNames,
    status: "Success",
    createdAt: new Date().toISOString(),
  };

  ingestionBatches.unshift(batch);
  return res.status(201).json({ batch });
});

app.get("/api/qra/interactions", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const queue = String(req.query.queue || "").trim();
  const status = String(req.query.status || "").trim();
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 50);

  let filtered = interactions.slice();

  if (search) {
    filtered = filtered.filter((item) => {
      const haystack = `${item.id} ${item.agent} ${item.customer} ${item.queue} ${item.channel}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  if (queue) {
    filtered = filtered.filter((item) => item.queue === queue);
  }

  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return res.json({
    rows: paged,
    total,
    page,
    pageSize,
    availableQueues: Object.keys(formsByQueue),
  });
});

app.get("/api/qra/interactions/:interactionId", (req, res) => {
  const interaction = interactions.find((item) => item.id === req.params.interactionId);
  if (!interaction) {
    return res.status(404).json({ error: "Interaction not found." });
  }

  const form = formsByQueue[interaction.queue] || null;
  return res.json({ interaction, form });
});

app.get("/api/qra/forms/:queue", (req, res) => {
  const queueName = decodeURIComponent(req.params.queue);
  const form = formsByQueue[queueName];

  if (!form) {
    return res.status(404).json({ error: "Form not found for queue." });
  }

  return res.json({ form });
});

app.get("/api/qra/workflow", (req, res) => {
  return res.json({ steps: workflowSteps });
});

app.post("/api/qra/audits", (req, res) => {
  const { interactionId, reviewer, comments, durationMinutes, scores } = req.body || {};
  if (!interactionId || !reviewer || !scores || typeof scores !== "object") {
    return res.status(400).json({ error: "interactionId, reviewer and scores are required." });
  }

  const interaction = interactions.find((item) => item.id === interactionId);
  if (!interaction) {
    return res.status(404).json({ error: "Interaction not found." });
  }

  const form = formsByQueue[interaction.queue];
  if (!form) {
    return res.status(400).json({ error: "Queue form is not configured." });
  }

  const { scorePercent, result, hasFatalFailure } = calculateFinalScore(form, scores);

  const auditRecord = {
    id: `AUD-${audits.length + 1}`,
    interactionId,
    reviewer,
    comments: comments || "",
    durationMinutes: Number(durationMinutes || 0),
    scores,
    finalScore: scorePercent,
    result,
    hasFatalFailure,
    submittedAt: new Date().toISOString(),
  };

  audits.unshift(auditRecord);
  interaction.status = "Completed";

  return res.status(201).json({ audit: auditRecord });
});

app.get("/api/qra/reports", (req, res) => {
  return res.json(getReports());
});

app.listen(PORT, () => {
  console.log(`Web app is running at http://localhost:${PORT}`);
});
