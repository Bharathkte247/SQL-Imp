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
const modeNotice = document.querySelector("#modeNotice");

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
    if (payload.llm_configured) {
      modeNotice.textContent =
        "LLM evaluation is configured. Results use the full rubric prompt and model judgment.";
      modeNotice.classList.add("ready");
      engineBadge.textContent = "LLM ready";
    } else {
      modeNotice.textContent =
        "Local rules mode is active because no QA_LLM_API_KEY or OPENAI_API_KEY is configured. The app now checks common QA defects, but use LLM mode for nuanced production scoring.";
      modeNotice.classList.remove("ready");
      engineBadge.textContent = "Local rules mode";
    }
  } catch (error) {
    promptViewer.textContent = `Unable to load prompt: ${error.message}`;
    modeNotice.textContent = "Unable to determine evaluation mode.";
  }
}

function renderResult(result) {
  resultPanel.classList.remove("hidden");
  resultTitle.textContent = `${result.interaction_id} - ${result.overall_result}${
    result.auto_fail ? " (Auto Fail)" : ""
  }`;
  scoreValue.textContent = `${result.score}%`;
  engineBadge.textContent =
    result.engine === "llm" ? "LLM evaluation" : "Local rules evaluation";
  engineBadge.title =
    result.engine === "llm"
      ? "Configured LLM provider returned this evaluation."
      : "Rules-based local evaluation. Set QA_LLM_API_KEY or OPENAI_API_KEY for full model evaluation.";

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
