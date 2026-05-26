const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const { clickhouseClient, checkConnection, getErrorMessage } = require("./clickhouse");

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

app.listen(PORT, () => {
  console.log(`Web app is running at http://localhost:${PORT}`);
});
