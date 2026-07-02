const form = document.querySelector("#evaluationForm");
const bulkForm = document.querySelector("#bulkForm");
const interactionIdInput = document.querySelector("#interactionId");
const transcriptInput = document.querySelector("#transcript");
const bulkCsvFileInput = document.querySelector("#bulkCsvFile");
const llmBaseUrlInput = document.querySelector("#llmBaseUrl");
const llmModelInput = document.querySelector("#llmModel");
const llmApiKeyInput = document.querySelector("#llmApiKey");
const llmTemperatureInput = document.querySelector("#llmTemperature");
const testLlmConnectionButton = document.querySelector("#testLlmConnectionButton");
const llmConnectionResult = document.querySelector("#llmConnectionResult");
const evaluateButton = document.querySelector("#evaluateButton");
const bulkEvaluateButton = document.querySelector("#bulkEvaluateButton");
const loadExampleButton = document.querySelector("#loadExampleButton");
const downloadSampleCsvButton = document.querySelector("#downloadSampleCsvButton");
const errorPanel = document.querySelector("#errorPanel");
const bulkStatus = document.querySelector("#bulkStatus");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const scoreValue = document.querySelector("#scoreValue");
const engineBadge = document.querySelector("#engineBadge");
const strengthsList = document.querySelector("#strengthsList");
const opportunitiesList = document.querySelector("#opportunitiesList");
const nextStepsList = document.querySelector("#nextStepsList");
const ratingsTableBody = document.querySelector("#ratingsTableBody");
const copyJsonButton = document.querySelector("#copyJsonButton");
const downloadJsonButton = document.querySelector("#downloadJsonButton");
const promptViewer = document.querySelector("#promptViewer");
const modeNotice = document.querySelector("#modeNotice");
const appVersion = document.querySelector("#appVersion");

let latestResult = null;
let currentAppVersion = "unknown";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  setLoading(true);

  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interaction_id: interactionIdInput.value,
        transcript: transcriptInput.value,
        llm_config: getLlmConfig(),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Evaluation failed");
    }
    latestResult = payload;
    renderResult(payload);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
});

bulkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  hideBulkStatus();

  const file = bulkCsvFileInput.files?.[0];
  if (!file) {
    showBulkStatus("Please choose a CSV file first.", false);
    return;
  }

  setBulkLoading(true);
  try {
    const formData = new FormData();
    formData.append("csv_file", file, file.name);
    const llmConfig = getLlmConfig();
    if (llmConfig) {
      formData.append("llm_config", JSON.stringify(llmConfig));
    }

    const response = await fetch("/api/evaluate-bulk", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Bulk evaluation failed");
    }

    const outputCsv = await response.text();
    const outputName = outputFileName(file.name);
    downloadTextFile(outputCsv, outputName, "text/csv");
    showBulkStatus(
      `Bulk evaluation complete. Downloaded ${outputName}. App version: ${currentAppVersion}.`,
      true,
    );
  } catch (error) {
    showBulkStatus(error.message, false);
  } finally {
    setBulkLoading(false);
  }
});

loadExampleButton.addEventListener("click", () => {
  interactionIdInput.value = "INT-DEMO-001";
  transcriptInput.value = `[00:00] Agent: Thank you for calling BJ's Member Care, this is Taylor. How can I help?
[00:04] Agent: Before I access the account, can you verify your full name, ZIP code, and email address?
[00:10] Member: My name is Jordan Lee, ZIP code 02110, and email is jordan@example.com.
[00:18] Member: My order is late and nobody has called me back. I'm really frustrated.
[00:24] Agent: I am sorry for the delay, and I can help review the order today.
[00:31] Member: I need to know when it will arrive.
[00:36] Agent: I can check the order status to confirm when it will arrive. Please hold while I review the carrier scan.
[00:58] Agent: Thank you for holding. The carrier scan shows delivery by tomorrow evening.
[01:06] Member: Can someone follow up if it does not arrive?
[01:11] Agent: Yes, I documented that request and set the follow-up for three business days if it is not delivered.
[01:21] Agent: Is there anything else I can help with today?
[01:25] Member: No, thank you.
[01:27] Agent: Thank you for calling BJ's. Please stay on the line for a brief survey.`;
});

downloadSampleCsvButton.addEventListener("click", () => {
  const sampleCsv = [
    ["Interaction ID", "Transcript"],
    [
      "INT-BULK-001",
      "[00:00] Agent: Thank you for calling BJ's Member Care.\\n[00:05] Member: My order is late and I am frustrated.\\n[00:10] Agent: What is your order number?",
    ],
    [
      "INT-BULK-002",
      "Sammy(10:09:43):Thank you for contacting BJ's Wholesale Club. My name is Sammy. Could you please confirm your first and last name and membership number?\\nVisitor(10:10:14):Christopher Guerra XXXX-XXXX-630",
    ],
  ]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  downloadTextFile(sampleCsv, "qa_bulk_input_sample.csv", "text/csv");
});

copyJsonButton.addEventListener("click", async () => {
  if (!latestResult) return;
  await navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
  copyJsonButton.textContent = "Copied";
  setTimeout(() => {
    copyJsonButton.textContent = "Copy JSON";
  }, 1500);
});

downloadJsonButton.addEventListener("click", () => {
  if (!latestResult) return;
  const blob = new Blob([JSON.stringify(latestResult, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${latestResult.interaction_id || "qa-evaluation"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});

testLlmConnectionButton.addEventListener("click", async () => {
  hideConnectionResult();
  testLlmConnectionButton.disabled = true;
  testLlmConnectionButton.textContent = "Testing...";

  try {
    const response = await fetch("/api/llm/connectivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        llm_config: getLlmConnectivityConfig(),
      }),
    });
    const payload = await response.json();
    renderConnectionResult(payload, response.ok);
  } catch (error) {
    renderConnectionResult({ error: error.message }, false);
  } finally {
    testLlmConnectionButton.disabled = false;
    testLlmConnectionButton.textContent = "Test LLM connection";
  }
});

loadVersion();
loadRubric();

async function loadVersion() {
  try {
    const response = await fetch("/api/version", { cache: "no-store" });
    const payload = await response.json();
    currentAppVersion = payload.version || "unknown";
    appVersion.textContent = `Version: ${currentAppVersion}`;
  } catch (error) {
    appVersion.textContent = "Version: unavailable";
  }
}

async function loadRubric() {
  try {
    const response = await fetch("/api/rubric");
    const payload = await response.json();
    promptViewer.textContent = payload.prompt_template || "Prompt unavailable";
    if (payload.llm_configured) {
      modeNotice.textContent =
        "LLM evaluation is configured. Results use the full rubric prompt and model judgment.";
      modeNotice.classList.add("ready");
      engineBadge.textContent = "LLM ready";
    } else {
      modeNotice.textContent =
        "Paste an API key in LLM Configuration to use model scoring. If left blank, the app uses local rules mode.";
      modeNotice.classList.remove("ready");
      engineBadge.textContent = "Local rules mode";
    }
  } catch (error) {
    promptViewer.textContent = `Unable to load prompt: ${error.message}`;
    modeNotice.textContent = "Unable to determine evaluation mode.";
  }
}

function getLlmConfig() {
  const apiKey = llmApiKeyInput.value.trim();
  if (!apiKey) {
    return null;
  }

  return {
    api_key: apiKey,
    base_url: llmBaseUrlInput.value.trim(),
    model: llmModelInput.value.trim(),
    temperature: llmTemperatureInput.value,
    max_retries: 3,
    retry_delay: 1,
    timeout_seconds: 60,
  };
}

function getLlmConnectivityConfig() {
  return {
    base_url: llmBaseUrlInput.value.trim(),
    connect_timeout_seconds: 10,
  };
}

function renderConnectionResult(payload, isOk) {
  const endpoint = payload.endpoint ? ` Endpoint: ${payload.endpoint}.` : "";
  const host = payload.host && payload.port ? ` Host: ${payload.host}:${payload.port}.` : "";
  const message = payload.message || payload.error || "Connection test failed.";
  const error = payload.error ? ` Error: ${payload.error}.` : "";
  llmConnectionResult.textContent = `${message}${endpoint}${host}${error}`;
  llmConnectionResult.className = `connection-result ${isOk ? "success" : "failure"}`;
}

function hideConnectionResult() {
  llmConnectionResult.className = "connection-result hidden";
  llmConnectionResult.textContent = "";
}

function showBulkStatus(message, isOk) {
  bulkStatus.textContent = message;
  bulkStatus.className = `connection-result ${isOk ? "success" : "failure"}`;
}

function hideBulkStatus() {
  bulkStatus.className = "connection-result hidden";
  bulkStatus.textContent = "";
}

function setBulkLoading(isLoading) {
  bulkEvaluateButton.disabled = isLoading;
  bulkEvaluateButton.textContent = isLoading ? "Evaluating CSV..." : "Evaluate bulk CSV";
}

function downloadTextFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function outputFileName(inputName) {
  const baseName = inputName.replace(/\.csv$/i, "") || "qa_bulk";
  return `${baseName}_evaluated.csv`;
}

function csvEscape(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function renderResult(result) {
  resultPanel.classList.remove("hidden");
  resultTitle.textContent = `${result.interaction_id} - ${result.overall_result}${
    result.auto_fail ? " (Auto Fail)" : ""
  }`;
  scoreValue.textContent = `${result.score}%`;
  const engineLabel = engineDisplay(result.engine);
  engineBadge.textContent = engineLabel.text;
  engineBadge.title = engineLabel.title;

  renderList(strengthsList, result.summary?.strengths);
  renderList(opportunitiesList, result.summary?.opportunities);
  renderList(nextStepsList, result.summary?.next_steps);
  renderTable(result.attributes || []);
}

function engineDisplay(engine) {
  if (engine === "llm_with_local_rules") {
    return {
      text: "LLM + local rules",
      title: "LLM evaluation with calibrated local-rule defects enforced as guardrails.",
    };
  }
  if (engine === "llm") {
    return {
      text: "LLM evaluation",
      title: "Configured LLM provider returned this evaluation.",
    };
  }
  return {
    text: "Local rules evaluation",
    title: "Rules-based local evaluation. Set QA_LLM_API_KEY or OPENAI_API_KEY for full model evaluation.",
  };
}

function renderList(target, items) {
  target.innerHTML = "";
  const values = Array.isArray(items) && items.length ? items : ["No items provided."];
  for (const item of values) {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  }
}

function renderTable(attributes) {
  ratingsTableBody.innerHTML = "";
  for (const item of attributes) {
    const row = document.createElement("tr");
    if (item.rating === "Yes") {
      row.classList.add("defect");
    }

    row.append(
      td(item.attribute),
      td(item.sub_attribute),
      ratingCell(item.rating),
      td(item.timestamp || "-"),
      rationaleCell(item),
    );
    ratingsTableBody.appendChild(row);
  }
}

function td(text) {
  const cell = document.createElement("td");
  cell.textContent = text || "";
  return cell;
}

function ratingCell(rating) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `rating ${String(rating).toLowerCase()}`;
  badge.textContent = rating;
  cell.appendChild(badge);
  return cell;
}

function rationaleCell(item) {
  const cell = document.createElement("td");
  const rationale = document.createElement("div");
  rationale.textContent = item.rationale || "Defect not observed.";
  cell.appendChild(rationale);

  if (item.coaching) {
    const coaching = document.createElement("div");
    coaching.textContent = `Coaching: ${item.coaching}`;
    coaching.className = "quote";
    cell.appendChild(coaching);
  }
  if (item.agent_quote) {
    const quote = document.createElement("span");
    quote.className = "quote";
    quote.textContent = `Agent quote: ${item.agent_quote}`;
    cell.appendChild(quote);
  }
  return cell;
}

function setLoading(isLoading) {
  evaluateButton.disabled = isLoading;
  evaluateButton.textContent = isLoading ? "Evaluating..." : "Evaluate transcript";
}

function showError(message) {
  errorPanel.textContent = message;
  errorPanel.classList.remove("hidden");
}

function hideError() {
  errorPanel.classList.add("hidden");
  errorPanel.textContent = "";
}
