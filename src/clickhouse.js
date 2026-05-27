const { createClient } = require("@clickhouse/client");

const clickhouseClient = createClient({
  url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DATABASE || "default",
});

function collectErrorDetails(error, details, depth = 0) {
  if (!error || depth > 4) {
    return;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    details.push(error.message.trim());
  }

  if (typeof error.code === "string" && error.code.trim()) {
    details.push(`code=${error.code.trim()}`);
  }

  if (Array.isArray(error.errors)) {
    error.errors.forEach((nestedError) => collectErrorDetails(nestedError, details, depth + 1));
  }

  if (error.cause) {
    collectErrorDetails(error.cause, details, depth + 1);
  }
}

function getErrorMessage(error) {
  const details = [];
  collectErrorDetails(error, details);

  const uniqueDetails = Array.from(new Set(details));
  if (!uniqueDetails.length) {
    return "Unknown ClickHouse error";
  }

  return uniqueDetails.join(" | ");
}

async function checkConnection() {
  try {
    const pingResult = await clickhouseClient.ping();

    if (pingResult && pingResult.success === false) {
      return {
        connected: false,
        error: getErrorMessage(pingResult.error),
      };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: getErrorMessage(error),
    };
  }
}

module.exports = {
  clickhouseClient,
  checkConnection,
  getErrorMessage,
};
