const form = document.querySelector("#evaluationForm");
const interactionIdInput = document.querySelector("#interactionId");
const transcriptInput = document.querySelector("#transcript");
const evaluateButton = document.querySelector("#evaluateButton");
const loadExampleButton = document.querySelector("#loadExampleButton");
const errorPanel = document.querySelector("#errorPanel");
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

let latestResult = null;

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

loadExampleButton.addEventListener("click", () => {
  interactionIdInput.value = "INT-DEMO-001";
  transcriptInput.value = `[00:00] Agent: Thank you for calling BJ's Member Care, this is Taylor. How can I help?
[00:05] Member: My order is late and nobody has called me back. I'm really frustrated.
[00:11] Agent: I am sorry for the delay, and I can help review the order today.
[00:18] Member: I need to know when it will arrive.
[00:22] Agent: Please hold while I check the order status.
[00:48] Agent: Thank you for holding. The carrier scan shows delivery by tomorrow evening.
[00:56] Member: Can someone follow up if it does not arrive?
[01:01] Agent: Yes, I documented that request and set the follow-up for three business days if it is not delivered.
[01:11] Agent: Is there anything else I can help with today?
[01:15] Member: No, thank you.
[01:17] Agent: Thank you for calling BJ's. Please stay on the line for a brief survey.`;
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

loadRubric();

async function loadRubric() {
  try {
    const response = await fetch("/api/rubric");
    const payload = await response.json();
    promptViewer.textContent = payload.prompt_template || "Prompt unavailable";
  } catch (error) {
    promptViewer.textContent = `Unable to load prompt: ${error.message}`;
  }
}

function renderResult(result) {
  resultPanel.classList.remove("hidden");
  resultTitle.textContent = `${result.interaction_id} - ${result.overall_result}${
    result.auto_fail ? " (Auto Fail)" : ""
  }`;
  scoreValue.textContent = `${result.score}%`;
  engineBadge.textContent =
    result.engine === "llm" ? "LLM evaluation" : "Local heuristic fallback";
  engineBadge.title =
    result.engine === "llm"
      ? "Configured LLM provider returned this evaluation."
      : "Set QA_LLM_API_KEY or OPENAI_API_KEY for full rubric evaluation.";

  renderList(strengthsList, result.summary?.strengths);
  renderList(opportunitiesList, result.summary?.opportunities);
  renderList(nextStepsList, result.summary?.next_steps);
  renderTable(result.attributes || []);
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
    if (item.rating === "No") {
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
  rationale.textContent = item.rationale || "No defect observed.";
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
