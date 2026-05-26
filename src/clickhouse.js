const { createClient } = require("@clickhouse/client");

const clickhouseClient = createClient({
  url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DATABASE || "default",
});

async function checkConnection() {
  try {
    await clickhouseClient.ping();
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error.message || "Unknown ClickHouse connection error",
    };
  }
}

module.exports = {
  clickhouseClient,
  checkConnection,
};
