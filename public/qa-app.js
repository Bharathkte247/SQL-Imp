const state = {
  selectedInteractionId: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function setupTabs() {
  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      const panel = document.getElementById(button.dataset.target);
      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

function renderSources(sources) {
  const sourcesBody = document.getElementById("sourcesBody");
  sourcesBody.innerHTML = sources
    .map(
      (source) => `
        <tr>
          <td>${escapeHtml(source.id)}</td>
          <td>${escapeHtml(source.name)}</td>
          <td>${escapeHtml(source.type)}</td>
          <td>${escapeHtml(source.location)}</td>
          <td>${escapeHtml(source.schedule)}</td>
          <td>${escapeHtml(source.status)}</td>
        </tr>
      `
    )
    .join("");
}

async function loadSources() {
  const data = await apiFetch("/api/qra/ingestion/sources");
  renderSources(data.sources);
}

async function handleSourceSubmit(event) {
  event.preventDefault();
  const ingestionStatus = document.getElementById("ingestionStatus");

  const payload = {
    name: document.getElementById("sourceName").value.trim(),
    type: document.getElementById("sourceType").value,
    location: document.getElementById("sourceLocation").value.trim(),
    schedule: document.getElementById("sourceSchedule").value,
  };

  try {
    await apiFetch("/api/qra/ingestion/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    ingestionStatus.textContent = "Source added successfully.";
    event.target.reset();
    await loadSources();
  } catch (error) {
    ingestionStatus.textContent = `Failed to add source: ${error.message}`;
  }
}

async function handleUpload() {
  const fileInput = document.getElementById("manualFiles");
  const ingestionStatus = document.getElementById("ingestionStatus");
  const fileNames = Array.from(fileInput.files || []).map((file) => file.name);

  if (!fileNames.length) {
    ingestionStatus.textContent = "Select at least one file before upload.";
    return;
  }

  try {
    await apiFetch("/api/qra/ingestion/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileNames, source: "Manual Upload" }),
    });
    ingestionStatus.textContent = `Uploaded batch with ${fileNames.length} file(s).`;
    fileInput.value = "";
    await loadSources();
  } catch (error) {
    ingestionStatus.textContent = `Upload failed: ${error.message}`;
  }
}

function renderQueueFilter(availableQueues) {
  const queueFilter = document.getElementById("queueFilter");
  const current = queueFilter.value;
  const options = ['<option value="">All Queues</option>']
    .concat(availableQueues.map((queue) => `<option value="${escapeHtml(queue)}">${escapeHtml(queue)}</option>`))
    .join("");
  queueFilter.innerHTML = options;
  queueFilter.value = current;
}

function renderInteractions(rows) {
  const body = document.getElementById("interactionsBody");
  body.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.queue)}</td>
          <td>${escapeHtml(row.channel)}</td>
          <td>${escapeHtml(row.agent)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.autoQraStatus)}</td>
          <td>${row.hasAudio ? "Audio" : ""}${row.hasAudio && row.hasVideo ? " + " : ""}${row.hasVideo ? "Video" : ""}</td>
          <td><button class="secondary-btn open-btn" data-id="${escapeHtml(row.id)}">Open</button></td>
        </tr>
      `
    )
    .join("");

  Array.from(document.querySelectorAll(".open-btn")).forEach((button) => {
    button.addEventListener("click", async () => {
      const targetId = button.dataset.id;
      await openInteraction(targetId);
      document.querySelector('[data-target="transcriptPanel"]').click();
    });
  });
}

async function loadInteractions() {
  const search = document.getElementById("searchInput").value.trim();
  const queue = document.getElementById("queueFilter").value;
  const status = document.getElementById("statusFilter").value;
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (queue) params.set("queue", queue);
  if (status) params.set("status", status);

  const data = await apiFetch(`/api/qra/interactions?${params.toString()}`);
  renderQueueFilter(data.availableQueues || []);
  renderInteractions(data.rows || []);

  if (!state.selectedInteractionId && data.rows && data.rows.length) {
    await openInteraction(data.rows[0].id);
  }
}

function renderTranscript(interaction) {
  const heading = document.getElementById("selectedInteractionHeading");
  const meta = document.getElementById("interactionMeta");
  const highlightsBox = document.getElementById("highlightsBox");
  const transcriptList = document.getElementById("transcriptList");

  heading.textContent = `${interaction.id} - ${interaction.queue} (${interaction.channel})`;
  meta.textContent = `Agent: ${interaction.agent} | Customer: ${interaction.customer} | Status: ${interaction.status} | Auto QRA: ${interaction.autoQraStatus}`;

  highlightsBox.innerHTML = `
    <h4>AI Highlights</h4>
    <ul>${interaction.aiHighlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `;

  transcriptList.innerHTML = interaction.transcript
    .map(
      (line) => `
        <li>
          <span class="time-tag">${escapeHtml(line.time)}</span>
          <strong>${escapeHtml(line.speaker)}:</strong> ${escapeHtml(line.text)}
        </li>
      `
    )
    .join("");
}

function renderAuditForm(form, suggestion = {}) {
  const container = document.getElementById("auditAttributes");
  if (!form) {
    container.innerHTML = "<p>No audit form is configured for this queue.</p>";
    return;
  }

  container.innerHTML = form.sections
    .map((section) => {
      const attributesHtml = section.attributes
        .map((attribute) => {
          const defaultScore = suggestion[attribute.key] ?? 7;
          return `
            <label>
              ${escapeHtml(attribute.label)} (weight ${attribute.weightage}${attribute.fatal ? ", fatal" : ""})
              <input
                class="input-control"
                type="number"
                min="0"
                max="10"
                step="1"
                name="${escapeHtml(attribute.key)}"
                value="${escapeHtml(defaultScore)}"
                required
              />
            </label>
          `;
        })
        .join("");

      return `
        <fieldset class="form-section">
          <legend>${escapeHtml(section.name)}</legend>
          ${attributesHtml}
        </fieldset>
      `;
    })
    .join("");
}

async function openInteraction(interactionId) {
  const data = await apiFetch(`/api/qra/interactions/${encodeURIComponent(interactionId)}`);
  state.selectedInteractionId = interactionId;
  renderTranscript(data.interaction);
  renderAuditForm(data.form, data.interaction.autoQraSuggestion.attributeScores);
}

async function submitAudit(event) {
  event.preventDefault();
  const auditStatus = document.getElementById("auditStatus");

  if (!state.selectedInteractionId) {
    auditStatus.textContent = "Select an interaction before submitting audit.";
    return;
  }

  const scoreInputs = Array.from(document.querySelectorAll("#auditAttributes input[name]"));
  const scores = {};
  scoreInputs.forEach((input) => {
    scores[input.name] = Number(input.value);
  });

  const payload = {
    interactionId: state.selectedInteractionId,
    reviewer: document.getElementById("reviewerInput").value.trim(),
    durationMinutes: Number(document.getElementById("durationInput").value || 0),
    comments: document.getElementById("commentsInput").value.trim(),
    scores,
  };

  try {
    const data = await apiFetch("/api/qra/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    auditStatus.textContent = `Audit submitted: ${data.audit.result} (${data.audit.finalScore}%).`;
    await loadInteractions();
    await loadReports();
  } catch (error) {
    auditStatus.textContent = `Audit submission failed: ${error.message}`;
  }
}

async function loadWorkflow() {
  const workflowList = document.getElementById("workflowList");
  const data = await apiFetch("/api/qra/workflow");
  workflowList.innerHTML = data.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
}

async function loadReports() {
  const reportKpis = document.getElementById("reportKpis");
  const queuePerformanceBody = document.getElementById("queuePerformanceBody");
  const data = await apiFetch("/api/qra/reports");

  const kpis = [
    { label: "Audit Completion Rate", value: data.qaSummary.auditCompletionRate },
    { label: "Pass Ratio", value: data.qaSummary.passRatio },
    { label: "Average Score", value: data.qaSummary.averageScore },
    { label: "Audits Completed", value: data.productivity.auditsCompleted },
    { label: "Average Audit Minutes", value: data.productivity.averageAuditMinutes },
    { label: "Calibration Variance", value: data.calibration.variance },
  ];

  reportKpis.innerHTML = kpis
    .map(
      (item) => `
        <article class="kpi-card">
          <p class="kpi-label">${escapeHtml(item.label)}</p>
          <p class="kpi-value">${escapeHtml(item.value)}</p>
        </article>
      `
    )
    .join("");

  queuePerformanceBody.innerHTML = data.qaSummary.queuePerformance
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.queue)}</td>
          <td>${escapeHtml(row.averageScore)}%</td>
        </tr>
      `
    )
    .join("");
}

async function initializePage() {
  setupTabs();

  document.getElementById("sourceForm").addEventListener("submit", handleSourceSubmit);
  document.getElementById("uploadBtn").addEventListener("click", handleUpload);
  document.getElementById("auditForm").addEventListener("submit", submitAudit);
  document.getElementById("filterForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadInteractions();
  });

  await loadSources();
  await loadInteractions();
  await loadWorkflow();
  await loadReports();
}

initializePage().catch((error) => {
  const auditStatus = document.getElementById("auditStatus");
  auditStatus.textContent = `Initialization failed: ${error.message}`;
});
