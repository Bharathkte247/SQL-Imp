/**
 * Multi-database connector for cloud and on-prem sources.
 * Authenticates with a shared service account configured via env vars.
 */

const { createClient } = require("@clickhouse/client");

function env(name, fallback = "") {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function boolEnv(name, fallback = false) {
  const value = env(name, String(fallback)).toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function getActiveType() {
  return (env("DB_TYPE", "demo") || "demo").toLowerCase();
}

function buildConfig(type = getActiveType()) {
  switch (type) {
    case "clickhouse":
      return {
        type,
        url: env("CLICKHOUSE_URL", `http://${env("DB_HOST", "localhost")}:${env("DB_PORT", "8123")}`),
        username: env("CLICKHOUSE_USER", env("DB_USER", "wfm_service")),
        password: env("CLICKHOUSE_PASSWORD", env("DB_PASSWORD", "")),
        database: env("CLICKHOUSE_DATABASE", env("DB_NAME", "wfm")),
      };
    case "postgres":
    case "postgresql":
      return {
        type: "postgres",
        host: env("PGHOST", env("DB_HOST", "localhost")),
        port: Number(env("PGPORT", env("DB_PORT", "5432"))),
        database: env("PGDATABASE", env("DB_NAME", "wfm")),
        user: env("PGUSER", env("DB_USER", "wfm_service")),
        password: env("PGPASSWORD", env("DB_PASSWORD", "")),
        ssl: boolEnv("DB_SSL", false) ? { rejectUnauthorized: false } : false,
      };
    case "mysql":
      return {
        type,
        host: env("MYSQL_HOST", env("DB_HOST", "localhost")),
        port: Number(env("MYSQL_PORT", env("DB_PORT", "3306"))),
        database: env("MYSQL_DATABASE", env("DB_NAME", "wfm")),
        user: env("MYSQL_USER", env("DB_USER", "wfm_service")),
        password: env("MYSQL_PASSWORD", env("DB_PASSWORD", "")),
        ssl: boolEnv("DB_SSL", false) ? {} : undefined,
      };
    case "mssql":
    case "sqlserver":
      return {
        type: "mssql",
        server: env("MSSQL_HOST", env("DB_HOST", "localhost")),
        port: Number(env("MSSQL_PORT", env("DB_PORT", "1433"))),
        database: env("MSSQL_DATABASE", env("DB_NAME", "wfm")),
        user: env("MSSQL_USER", env("DB_USER", "wfm_service")),
        password: env("MSSQL_PASSWORD", env("DB_PASSWORD", "")),
        options: {
          encrypt: boolEnv("MSSQL_ENCRYPT", true),
          trustServerCertificate: true,
        },
      };
    case "demo":
    default:
      return { type: "demo", mode: "in-memory" };
  }
}

function getErrorMessage(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || error.toString();
}

function isReadOnlyQuery(sql) {
  const cleaned = String(sql || "")
    .trim()
    .replace(/;+\s*$/, "");
  return /^(select|show|describe|desc|explain|with)\b/i.test(cleaned);
}

function withLimit(sql, maxRows) {
  const cleaned = String(sql || "")
    .trim()
    .replace(/;+\s*$/, "");
  if (/\blimit\s+\d+(\s*,\s*\d+)?\s*$/i.test(cleaned) || /\btop\s+\d+\b/i.test(cleaned)) {
    return cleaned;
  }
  return `${cleaned} LIMIT ${maxRows}`;
}

class DatabaseConnector {
  constructor() {
    this.config = buildConfig();
    this.client = null;
    this.pool = null;
  }

  getProfile() {
    const cfg = this.config;
    return {
      type: cfg.type,
      host: cfg.host || cfg.server || cfg.url || "in-memory",
      database: cfg.database || "demo",
      user: cfg.user || cfg.username || "demo",
      ssl: Boolean(cfg.ssl || cfg.options?.encrypt),
      mode: cfg.type === "demo" ? "demo" : "service-account",
    };
  }

  async connect() {
    const type = this.config.type;
    if (type === "demo") {
      return { connected: true, type, mode: "demo" };
    }

    if (type === "clickhouse") {
      this.client = createClient({
        url: this.config.url,
        username: this.config.username,
        password: this.config.password,
        database: this.config.database,
      });
      await this.client.ping();
      return { connected: true, type };
    }

    if (type === "postgres") {
      const { Pool } = require("pg");
      this.pool = new Pool(this.config);
      const client = await this.pool.connect();
      client.release();
      return { connected: true, type };
    }

    if (type === "mysql") {
      const mysql = require("mysql2/promise");
      this.pool = mysql.createPool(this.config);
      const conn = await this.pool.getConnection();
      conn.release();
      return { connected: true, type };
    }

    if (type === "mssql") {
      const sql = require("mssql");
      this.pool = await sql.connect(this.config);
      return { connected: true, type };
    }

    throw new Error(`Unsupported DB_TYPE: ${type}`);
  }

  async checkConnection() {
    try {
      if (this.config.type === "demo") {
        return {
          connected: true,
          type: "demo",
          mode: "demo",
          message: "Using in-memory demo data. Set DB_TYPE to connect a live database.",
          profile: this.getProfile(),
        };
      }

      if (!this.client && !this.pool) {
        await this.connect();
      }

      if (this.config.type === "clickhouse") {
        await this.client.ping();
      } else if (this.config.type === "postgres") {
        await this.pool.query("SELECT 1 AS ok");
      } else if (this.config.type === "mysql") {
        await this.pool.query("SELECT 1 AS ok");
      } else if (this.config.type === "mssql") {
        await this.pool.request().query("SELECT 1 AS ok");
      }

      return {
        connected: true,
        type: this.config.type,
        mode: "service-account",
        profile: this.getProfile(),
      };
    } catch (error) {
      return {
        connected: false,
        type: this.config.type,
        mode: "service-account",
        profile: this.getProfile(),
        error: getErrorMessage(error),
      };
    }
  }

  async query(sql, maxRows = 500) {
    if (this.config.type === "demo") {
      throw new Error("Live SQL queries require DB_TYPE other than demo.");
    }

    if (!isReadOnlyQuery(sql)) {
      throw new Error("Only read-only queries are allowed (SELECT, SHOW, DESCRIBE, EXPLAIN, WITH).");
    }

    if (!this.client && !this.pool) {
      await this.connect();
    }

    const finalQuery = withLimit(sql, maxRows);

    if (this.config.type === "clickhouse") {
      const resultSet = await this.client.query({
        query: finalQuery,
        format: "JSONEachRow",
      });
      const rows = await resultSet.json();
      return { rows, rowCount: rows.length, executedQuery: finalQuery };
    }

    if (this.config.type === "postgres") {
      const result = await this.pool.query(finalQuery);
      return { rows: result.rows, rowCount: result.rowCount, executedQuery: finalQuery };
    }

    if (this.config.type === "mysql") {
      const [rows] = await this.pool.query(finalQuery);
      return { rows, rowCount: rows.length, executedQuery: finalQuery };
    }

    if (this.config.type === "mssql") {
      const result = await this.pool.request().query(finalQuery);
      return {
        rows: result.recordset || [],
        rowCount: (result.recordset || []).length,
        executedQuery: finalQuery,
      };
    }

    throw new Error(`Unsupported DB_TYPE: ${this.config.type}`);
  }

  async switchProfile(type) {
    if (this.pool && typeof this.pool.end === "function") {
      try {
        await this.pool.end();
      } catch (_) {
        /* ignore */
      }
    }
    if (this.client && typeof this.client.close === "function") {
      try {
        await this.client.close();
      } catch (_) {
        /* ignore */
      }
    }
    this.client = null;
    this.pool = null;
    process.env.DB_TYPE = type;
    this.config = buildConfig(type);
    return this.checkConnection();
  }
}

const connector = new DatabaseConnector();

module.exports = {
  connector,
  buildConfig,
  getErrorMessage,
  isReadOnlyQuery,
  withLimit,
};
