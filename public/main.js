const healthBtn = document.getElementById("healthBtn");
const healthStatus = document.getElementById("healthStatus");
const runQueryBtn = document.getElementById("runQueryBtn");
const queryInput = document.getElementById("query");
const resultMeta = document.getElementById("resultMeta");
const resultTableWrapper = document.getElementById("resultTableWrapper");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function renderTable(rows) {
  if (!rows.length) {
    resultTableWrapper.innerHTML = "<p>No rows returned.</p>";
    return;
  }

  const headers = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set())
  );

  const thead = `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`;
  const tbody = rows
    .map((row) => {
      const cells = headers
        .map((header) => `<td>${escapeHtml(toCellValue(row[header]))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  resultTableWrapper.innerHTML = `<table>${thead}<tbody>${tbody}</tbody></table>`;
}

async function checkHealth() {
  healthStatus.textContent = "Checking connection...";
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.details || "Connection failed.");
    }
    healthStatus.textContent = "Connected to ClickHouse.";
  } catch (error) {
    healthStatus.textContent = `Connection failed: ${error.message}`;
  }
}

async function runQuery() {
  const query = queryInput.value;
  resultMeta.textContent = "Running query...";
  resultTableWrapper.innerHTML = "";

  try {
    const response = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || "Query failed.");
    }

    resultMeta.textContent = `Rows returned: ${data.rowCount}. Executed query: ${data.executedQuery}`;
    renderTable(data.rows);
  } catch (error) {
    resultMeta.textContent = `Error: ${error.message}`;
    resultTableWrapper.innerHTML = "";
  }
}

healthBtn.addEventListener("click", checkHealth);
runQueryBtn.addEventListener("click", runQuery);
