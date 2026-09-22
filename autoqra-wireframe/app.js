/* AutoQRA × Conversation Insights — extended wireframe */

const FEATURES = [
  { id: "audit-forms", name: "Audit forms", tier: "core", view: "interactions" },
  { id: "dispute-workflows", name: "Dispute workflows", tier: "core", view: "interactions" },
  { id: "manual-qa", name: "Manual QA workflows", tier: "core", view: "interactions" },
  { id: "transcript-viewer", name: "Transcript viewer", tier: "core", view: "interactions" },
  { id: "assist-mode", name: "Auto QRA assist mode", tier: "core", view: "interactions" },
  { id: "ai-rationale", name: "AI rationale generation", tier: "core", view: "interactions" },
  { id: "reporting-basics", name: "Reporting basics", tier: "core", view: "reporting" },
  { id: "multi-lob", name: "Multi-LOB support", tier: "core", view: "sampling" },
  { id: "audit-trail", name: "Audit Trail and Log", tier: "core", view: "interactions" },
  { id: "human-override", name: "Human override workflow", tier: "core", view: "interactions" },
  { id: "crm-docs", name: "Access to CRM and Documentation", tier: "advanced", view: "admin" },
  { id: "calibration", name: "Calibration sessions", tier: "advanced", view: "calibration" },
  { id: "compliance-alerts", name: "Compliance Detection and Alerts", tier: "advanced", view: "interactions" },
  { id: "tech-ingestion", name: "Technology Client — Data ingestion", tier: "advanced", view: "data-import" },
  { id: "autonomous-scoring", name: "Fully autonomous scoring", tier: "advanced", view: "sampling" },
  { id: "advanced-dashboards", name: "Advanced dashboards", tier: "advanced", view: "reporting" },
  { id: "cloud-integrations", name: "Cloud integrations", tier: "advanced", view: "data-import" },
  { id: "csv-ingestion", name: "CSV ingestion", tier: "advanced", view: "data-import" },
  { id: "queue-mapping", name: "Queue mapping", tier: "advanced", view: "admin" },
  { id: "sentiment", name: "Sentiment analysis", tier: "advanced", view: "advanced" },
  { id: "coaching", name: "Agent coaching recommendations", tier: "insight", view: "coaching" },
  { id: "rbac", name: "RBAC", tier: "insight", view: "admin" },
  { id: "self-serve", name: "Self-serve Capabilities (Based on RBAC)", tier: "insight", view: "admin" },
  { id: "multi-language", name: "Multi-language QA", tier: "insight", view: "interactions" },
  { id: "realtime", name: "Real-time auditing", tier: "insight", view: "interactions" },
  { id: "monitoring-form", name: "New / Modification of the Monitoring Form", tier: "insight", view: "admin" },
  { id: "anomaly", name: "AI anomaly detection", tier: "insight", view: "calibration" },
  { id: "genai-summaries", name: "GenAI summaries", tier: "insight", view: "interactions" },
  { id: "intent", name: "Intent analytics", tier: "insight", view: "advanced" },
  { id: "predictive", name: "Predictive QA insights", tier: "insight", view: "advanced" },
  { id: "behavioral", name: "Behavioral scoring", tier: "insight", view: "interactions" },
];

const INTERACTIONS = [
  {
    id: "0459517b-4e6d-4d1f-a8a8-8ca18a4601fe",
    short: "0459517b…601fe",
    agent: "qa",
    agentName: "QA Bot Handoff",
    duration: "3m 29s",
    queue: "247client1_Web_Chat",
    lob: "Test_Lob",
    channel: "ude",
    source: "api_pull",
    intent: "fraud-unauthorized-charges",
    sentiment: "neutral",
    escalated: true,
    status: "COMPLETED",
    score: "92",
    date: "2026-09-10",
  },
  {
    id: "1a82c0ee-91b2-4a11-9c44-77f0aa001122",
    short: "1a82c0ee…1122",
    agent: "m.chen",
    agentName: "M. Chen",
    duration: "5m 12s",
    queue: "247client1_Web_Chat",
    lob: "Retail",
    channel: "ude",
    source: "csv",
    intent: "address_update",
    sentiment: "positive",
    escalated: false,
    status: "COMPLETED",
    score: "88",
    date: "2026-09-09",
  },
  {
    id: "9f33d4aa-2201-4e55-bb19-55aa99112233",
    short: "9f33d4aa…2233",
    agent: "r.patel",
    agentName: "R. Patel",
    duration: "2m 05s",
    queue: "UHC_Rx_Refill_Chat",
    lob: "Commercial Pharmacy",
    channel: "ude",
    source: "api_pull",
    intent: "rx_refill_request",
    sentiment: "neutral",
    escalated: false,
    status: "IN_REVIEW",
    score: "—",
    date: "2026-09-10",
  },
  {
    id: "c7e21b90-aa12-4f01-88cc-001122334455",
    short: "c7e21b90…4455",
    agent: "a.nguyen",
    agentName: "A. Nguyen",
    duration: "6m 40s",
    queue: "247client1_Web_Chat",
    lob: "Retail",
    channel: "ude",
    source: "api_pull",
    intent: "payment_arrangement",
    sentiment: "negative",
    escalated: false,
    status: "COMPLETED",
    score: "71",
    date: "2026-09-08",
  },
  {
    id: "dd0f11e-3344-4aa0-9b12-aabbccddeeff",
    short: "dd0f11e…eeff",
    agent: "r.patel",
    agentName: "R. Patel",
    duration: "4m 18s",
    queue: "UHC_Refill_Status",
    lob: "Medicaid Pharmacy",
    channel: "ude",
    source: "csv",
    intent: "rx_refill_request",
    sentiment: "positive",
    escalated: false,
    status: "COMPLETED",
    score: "95",
    date: "2026-09-07",
  },
];

const AUDIT_QUESTIONS = [
  {
    q: "Q1 Fails to/misses apology due to error or inconvenience",
    ai: "AI: The agent acknowledged the member's concern and apologized for the inconvenience caused by the unauthorized charge.",
    choice: "No",
    points: "-10",
  },
  {
    q: "Q2 Uses excessive apologies",
    ai: "AI: Apologies were proportionate; no excessive apology pattern detected.",
    choice: "No",
    points: "-5",
  },
  {
    q: "Q3 Misses or uses inappropriate empathy or rapport",
    ai: "AI: Empathy statements were present and appropriate for the fraud concern.",
    choice: "No",
    points: "-10",
  },
  {
    q: "Q4 Fails to state desire to assist and follow through",
    ai: "AI: Agent stated desire to help and confirmed next steps for verification.",
    choice: "No",
    points: "-5",
  },
  {
    q: "Q5 Fails to use effective hostility diffusion skills",
    ai: "AI: Tone remained calm; no hostility escalation observed in transcript.",
    choice: "No",
    points: "-10",
  },
];

const COACHING = [
  {
    agent: "R. Patel",
    audits: 48,
    fails: 11,
    severity: "high",
    opportunity: "Disclosure completeness failing on 23% of audited chats. Focus coaching on promo / refill disclosure script.",
    theme: "Disclosures",
  },
  {
    agent: "M. Chen",
    audits: 36,
    fails: 6,
    severity: "med",
    opportunity: "Empathy / rapport misses on escalated fraud intents. Pair with soft-skills calibration pack.",
    theme: "Soft skills",
  },
  {
    agent: "A. Nguyen",
    audits: 29,
    fails: 9,
    severity: "high",
    opportunity: "Payment arrangement closure language incomplete on 9 of 29 audits. Recommend guided close checklist.",
    theme: "Resolution",
  },
  {
    agent: "Team Cards-B",
    audits: 120,
    fails: 14,
    severity: "med",
    opportunity: "Team-level hold-time empathy dips after minute 4. Share best-call examples from 247client1 Web Chat.",
    theme: "Team pattern",
  },
  {
    agent: "S. Okonkwo",
    audits: 22,
    fails: 2,
    severity: "low",
    opportunity: "Strong scores; nominate as calibration peer reviewer for Soft Skills section.",
    theme: "Peer coach",
  },
];

const CRMS = [
  { id: "salesforce", name: "Salesforce Service Cloud", type: "CRM", status: "Connected", endpoint: "https://example.my.salesforce.com" },
  { id: "dynamics", name: "Microsoft Dynamics 365", type: "CRM", status: "Available", endpoint: "—" },
  { id: "zendesk", name: "Zendesk", type: "CRM", status: "Available", endpoint: "—" },
  { id: "genesys", name: "Genesys Cloud CX", type: "CRM", status: "Available", endpoint: "—" },
  { id: "kb-confluence", name: "Confluence Knowledge Base", type: "KB", status: "Connected", endpoint: "space: CX-KB" },
  { id: "kb-sharepoint", name: "SharePoint / Docs", type: "KB", status: "Available", endpoint: "—" },
  { id: "kb-internal", name: "Internal Policy KB", type: "KB", status: "Connected", endpoint: "kb://247client1-policies" },
];

const workspace = document.getElementById("workspace");
const quotaBox = document.getElementById("quotaBox");
const sideNav = document.getElementById("sideNav");
const crmPane = document.getElementById("crmPane");
const crmPaneBody = document.getElementById("crmPaneBody");

let currentView = "interactions";
let selectedIx = null; // null = list view
let ixSideTab = "audit";
let dataTab = "ingest";
let samplingTab = "new";
let selectedIngestJob = "ing_340ceb2fe31747c8b771e871a15ec2356";
let selectedCrm = "salesforce";
let openMsKey = null; // which multi-select dropdown is open

const ixFilters = {
  dateFrom: "2026-09-01",
  dateTo: "2026-09-10",
  queues: [],
  lobs: [],
  agents: [],
  intents: [],
  statuses: [],
  sources: [],
};

function uniqueValues(key) {
  return [...new Set(INTERACTIONS.map((i) => i[key]))].sort();
}

function toggleFilterValue(key, value) {
  const arr = ixFilters[key];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
}

function matchesFilters(i) {
  if (ixFilters.dateFrom && i.date < ixFilters.dateFrom) return false;
  if (ixFilters.dateTo && i.date > ixFilters.dateTo) return false;
  if (ixFilters.queues.length && !ixFilters.queues.includes(i.queue)) return false;
  if (ixFilters.lobs.length && !ixFilters.lobs.includes(i.lob)) return false;
  if (ixFilters.agents.length && !ixFilters.agents.includes(i.agentName)) return false;
  if (ixFilters.intents.length && !ixFilters.intents.includes(i.intent)) return false;
  if (ixFilters.statuses.length && !ixFilters.statuses.includes(i.status)) return false;
  if (ixFilters.sources.length && !ixFilters.sources.includes(i.source)) return false;
  return true;
}

function filteredInteractions() {
  return INTERACTIONS.filter(matchesFilters);
}

function msField(label, key, options) {
  const selected = ixFilters[key];
  const chips = selected.length
    ? selected.map((v) => `<span class="chip">${v} <button type="button" data-ms-remove="${key}|${v}">×</button></span>`).join("")
    : `<span class="placeholder">All</span>`;
  const open = openMsKey === key;
  const opts = options
    .map(
      (o) => `
      <label class="ms-option">
        <input type="checkbox" data-ms-toggle="${key}|${o}" ${selected.includes(o) ? "checked" : ""} />
        <span>${o}</span>
      </label>`
    )
    .join("");
  return `
    <div class="field ms-wrap" data-ms-key="${key}">
      <label>${label} <span style="font-weight:400;color:var(--muted)">(multi)</span></label>
      <button class="ms-trigger" type="button" data-ms-open="${key}">${chips}</button>
      <div class="ms-dropdown" ${open ? "" : "hidden"} data-ms-drop="${key}">${opts}</div>
    </div>`;
}
function tenantRow() {
  return `
    <div class="tenant-row">
      <code>techclient / test / ude</code>
      <button class="link-btn" type="button">Change</button>
    </div>`;
}

function failedBar() {
  return `
    <div class="failed-bar">
      <div>
        <strong>Failed records</strong>
        <p>Open failures inside the tenant retry window. No open failures.</p>
      </div>
      <div class="btn-row">
        <button class="btn" type="button">↻ Retry</button>
        <button class="btn" type="button">✉ Email admin</button>
      </div>
    </div>`;
}

function renderOverview() {
  const core = FEATURES.filter((f) => f.tier === "core");
  const advanced = FEATURES.filter((f) => f.tier === "advanced");
  const insight = FEATURES.filter((f) => f.tier === "insight");
  const tile = (f) => `
    <button class="feature-tile ${f.tier}" type="button" data-goto="${f.view}">
      <div class="ft-name">${f.name}</div>
      <div class="ft-meta">→ ${f.view}</div>
    </button>`;

  return `
    <h1 class="page-title">AutoQRA feature map</h1>
    <p class="page-sub">31 capabilities across Interactions, Data Import, Sampling, Coaching, Reporting, Calibration, Advanced Insights, and Admin.</p>
    <div class="stat-row">
      <div class="stat"><div class="label">Total</div><div class="value">31</div></div>
      <div class="stat"><div class="label">Core</div><div class="value">${core.length}</div></div>
      <div class="stat"><div class="label">Advanced</div><div class="value">${advanced.length}</div></div>
      <div class="stat"><div class="label">Insights</div><div class="value">${insight.length}</div></div>
    </div>
    <div class="card"><h3>Core QA</h3><div class="feature-grid">${core.map(tile).join("")}</div></div>
    <div class="card"><h3>Advanced / Integration</h3><div class="feature-grid">${advanced.map(tile).join("")}</div></div>
    <div class="card"><h3>Insights / Admin</h3><div class="feature-grid">${insight.map(tile).join("")}</div></div>`;
}

function renderInteractionsList() {
  const rowsData = filteredInteractions();
  const rows = rowsData
    .map(
      (i) => `
    <tr class="clickable" data-open-ix="${i.id}">
      <td>${i.short}</td>
      <td>${i.date}</td>
      <td>${i.queue}</td>
      <td>${i.lob}</td>
      <td>${i.agentName}</td>
      <td>${i.intent}</td>
      <td><span class="status ${i.status === "COMPLETED" ? "ok" : "warn"}">${i.status}</span></td>
      <td>${i.score}</td>
      <td>${i.duration}</td>
    </tr>`
    )
    .join("");

  const empty = rowsData.length
    ? ""
    : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:1.25rem">No interactions match the selected filters.</td></tr>`;

  return `
    <div class="ix-list-page">
      <h1 class="page-title">Interactions</h1>
      <p class="page-sub">Browse audited conversations. Use multi-select filters, then select a row to open detail.</p>
      ${tenantRow()}
      <div class="list-toolbar">
        <div class="filters-inline">
          <div class="field"><label>Date from</label><input type="date" data-ix-date="dateFrom" value="${ixFilters.dateFrom}" /></div>
          <div class="field"><label>Date to</label><input type="date" data-ix-date="dateTo" value="${ixFilters.dateTo}" /></div>
          ${msField("Queue", "queues", uniqueValues("queue"))}
          ${msField("LOB", "lobs", uniqueValues("lob"))}
          ${msField("Agent", "agents", uniqueValues("agentName"))}
          ${msField("Intent", "intents", uniqueValues("intent"))}
          ${msField("Status", "statuses", uniqueValues("status"))}
          ${msField("Source", "sources", uniqueValues("source"))}
        </div>
        <div class="filter-actions">
          <button class="btn primary" type="button" data-ix-apply>Apply filters</button>
          <button class="btn" type="button" data-ix-clear>Clear</button>
        </div>
      </div>
      <div class="ix-table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Conversation</th><th>Date</th><th>Queue</th><th>LOB</th>
              <th>Agent</th><th>Intent</th><th>Status</th><th>Score</th><th>Duration</th>
            </tr>
          </thead>
          <tbody>${rows || empty}</tbody>
        </table>
      </div>
      <p class="hint" style="margin-top:0.65rem;color:var(--muted);font-size:0.85rem">${rowsData.length} of ${INTERACTIONS.length} interactions · multi-select filters · click a row to open detail</p>
    </div>`;
}

function renderInteractionDetail(ix) {
  const details = `
    <h3 style="margin:0 0 0.55rem;font-size:0.95rem">Conversation details</h3>
    <dl class="kv">
      <dt>Conversation ID</dt><dd>${ix.id}</dd>
      <dt>Channel</dt><dd>${ix.channel}</dd>
      <dt>Source</dt><dd>${ix.source}</dd>
      <dt>Escalation</dt><dd>${ix.escalated ? '<span class="status warn">Escalated</span>' : "None"}</dd>
      <dt>Duration</dt><dd>${ix.duration}</dd>
      <dt>Queue</dt><dd>${ix.queue}</dd>
      <dt>LOB</dt><dd>${ix.lob}</dd>
      <dt>Agent</dt><dd>${ix.agentName}</dd>
    </dl>
    <div class="insight-block">
      <h4>Intents</h4>
      <p><span class="chip">${ix.intent}</span></p>
    </div>
    <div class="insight-block">
      <h4>CRM / KB context</h4>
      <p><strong>CRM:</strong> Salesforce · Case #88214</p>
      <p style="margin-top:0.3rem"><strong>KB:</strong> ADR-221 Fraud verification script</p>
    </div>`;

  const auditQs = AUDIT_QUESTIONS.map(
    (q) => `
    <div class="q-card">
      <span class="priority">high</span>
      <div class="q-title">${q.q}</div>
      <div class="ai-note">${q.ai}</div>
      <div class="choice-row">
        <button class="choice ${q.choice === "Yes" ? "selected" : ""}" type="button">Yes (${q.points})</button>
        <button class="choice ${q.choice === "No" ? "selected" : ""}" type="button">No ✓</button>
        <button class="choice" type="button">NA</button>
      </div>
      <div class="field"><textarea readonly>${q.ai.replace(/^AI:\s*/, "")}</textarea></div>
    </div>`
  ).join("");

  const audit = `
    <div class="audit-form">
      <h3>247client1 Chat Quality Assurance Monitoring Form</h3>
      <p class="hint" style="margin:0 0 0.55rem">Monitoring form scoring + GenAI summary · identity from CSV / API pull</p>

      <div class="genai-box">
        <strong>GenAI summary</strong>
        Member reported an unauthorized charge. Bot verified identity, apologized, and escalated to fraud review with confirmation of next steps. Soft-skills section scored 20/20; no disclosure defects on this interaction.
      </div>

      <div class="score-summary">
        <div class="score-chip"><b>${ix.score === "—" ? "…" : ix.score}</b>Overall</div>
        <div class="score-chip"><b>20/20</b>Soft skills</div>
        <div class="score-chip"><b>Pass</b>Compliance</div>
        <div class="score-chip"><b>v3</b>Form version</div>
      </div>

      <div class="audit-meta">
        <div class="field"><label>Agent EmpId</label><input value="A10482" readonly /></div>
        <div class="field"><label>Manager Name</label><input value="S. Miles" readonly /></div>
        <div class="field"><label>Customer Name</label><input value="Jordan Lee" readonly /></div>
        <div class="field"><label>Agent Category</label><input value="Chat Tier 1" readonly /></div>
        <div class="field"><label>Evaluator</label><input value="ci_autoqra" readonly /></div>
        <div class="field"><label>Audit Type</label><select><option>Auto QA</option><option>Manual QA</option></select></div>
      </div>
      <p style="font-size:0.82rem;margin:0 0 0.55rem">AutoQRA status: <strong>${ix.status}</strong> · monitoring form scoring active
        <button class="btn" type="button" style="margin-left:0.5rem">▶ Start timer</button>
      </p>
      <div class="ack-box">
        <span class="status ok">Acknowledged</span>
        <strong>Agent acknowledgment</strong><br/>
        Agent decision: <strong>Accept</strong> · Comments: <strong>Looks Good</strong>
      </div>
      <div class="section-block">
        <div class="section-head">
          <span>Soft Skills and Professionalism</span>
          <span>20/20</span>
        </div>
        ${auditQs}
      </div>
      <div class="btn-row">
        <button class="btn primary" type="button">Save override</button>
        <button class="btn" type="button">Open dispute</button>
        <button class="btn" type="button">Human override…</button>
      </div>
    </div>`;

  const history = `
    <h3 style="margin:0 0 0.55rem;font-size:0.95rem">Audit Trail and Log</h3>
    <table class="table">
      <thead><tr><th>When</th><th>Event</th></tr></thead>
      <tbody>
        <tr><td>08:11</td><td>Autonomous scoring · 247client1 Chat v3</td></tr>
        <tr><td>08:12</td><td>GenAI summary generated</td></tr>
        <tr><td>08:12</td><td>Monitoring form scoring · Soft Skills 20/20</td></tr>
        <tr><td>09:18</td><td>Agent acknowledgment · Accept</td></tr>
      </tbody>
    </table>`;

  const sideBody = ixSideTab === "details" ? details : ixSideTab === "history" ? history : audit;

  return `
    <div class="ix-layout">
      <section class="ix-list">
        <div class="ix-list-head">
          <h2>Interactions</h2>
          <button class="link-btn" type="button" data-ix-back style="font-size:0.8rem">← All interactions</button>
        </div>
        <div class="ix-items">
          ${filteredInteractions().map(
            (i) => `
            <button class="ix-item ${i.id === ix.id ? "active" : ""}" type="button" data-open-ix="${i.id}">
              <div class="id">${i.short}</div>
              <div class="meta">${i.queue}</div>
              <div class="sub">${i.agentName} · ${i.score} · ${i.status}</div>
            </button>`
          ).join("")}
        </div>
      </section>

      <section class="ix-transcript">
        <div class="ix-trans-head">
          <div>
            <h2>Transcript</h2>
            <div class="ix-trans-meta">${ix.id} · ${ix.duration} · ${ix.agentName}</div>
          </div>
          <button class="btn" type="button" data-ix-back>← Back to list</button>
        </div>
        <div class="search-row"><input placeholder="Search transcript..." /></div>
        <div class="transcript-body">
          <div class="bubble bot"><div class="who">Bot · 11:45 AM</div>Welcome to 247client1 support. I can help with unauthorized charges.</div>
          <div class="bubble visitor"><div class="who">Visitor · 11:45 AM</div>I see a charge I didn't make on my account.</div>
          <div class="bubble bot"><div class="who">Bot · 11:46 AM</div>I'm sorry about that. Let's verify your identity, then I'll connect you to a specialist.</div>
          <div class="bubble visitor"><div class="who">Visitor · 11:47 AM</div>OK — last four of member number is 4912.</div>
          <div class="bubble bot"><div class="who">Bot · 11:48 AM</div>Verified. Escalating to fraud review now. You'll get a confirmation shortly.</div>
        </div>
      </section>

      <section class="ix-side">
        <div class="ix-side-tabs">
          <button class="tab ${ixSideTab === "details" ? "active" : ""}" type="button" data-ix-tab="details">Details</button>
          <button class="tab ${ixSideTab === "audit" ? "active" : ""}" type="button" data-ix-tab="audit">Audit</button>
          <button class="tab ${ixSideTab === "history" ? "active" : ""}" type="button" data-ix-tab="history">History</button>
        </div>
        <div class="ix-side-body">${sideBody}</div>
      </section>
    </div>`;
}

function renderInteractions() {
  if (!selectedIx) return renderInteractionsList();
  const ix = INTERACTIONS.find((i) => i.id === selectedIx) || INTERACTIONS[0];
  return renderInteractionDetail(ix);
}

function renderDataImport() {
  const ingest = `
    <p class="hint" style="margin:0 0 0.75rem">Upload CSV or run SFTP / bucket ingest for this techclient tenant.</p>
    <div class="grid-2">
      <div class="card" style="margin:0">
        <h3>Upload CSV</h3>
        <p class="hint">Upload a QRA-Input style CSV. Processing is async; max 50 MB. <a href="#">Download sample CSV</a></p>
        <div class="dropzone">
          <button class="btn" type="button">Choose File</button>
          <span style="margin-left:0.5rem;color:var(--muted)">No file chosen</span>
        </div>
        <div class="footer-actions"><span></span><button class="btn" type="button" disabled>Upload &amp; queue</button></div>
      </div>
      <div class="card" style="margin:0">
        <h3>Selected job <span class="status ok">COMPLETED</span></h3>
        <dl class="kv">
          <dt>Job</dt><dd style="font-family:var(--mono);font-size:0.75rem">${selectedIngestJob}</dd>
          <dt>File</dt><dd>qra-input-sample (4).csv</dd>
          <dt>Rows</dt><dd>16 success / 0 failed / 16 total</dd>
          <dt>Source</dt><dd>csv · techclient</dd>
        </dl>
      </div>
    </div>
    <div class="card" style="margin-top:0.85rem">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap">
        <div>
          <h3 style="margin:0">Ingest row preview</h3>
          <p class="hint" style="margin:0.25rem 0 0">Server-paginated preview (50 rows/page).</p>
        </div>
        <div class="pill-filters">
          <button class="pill active" type="button">FAILED 0</button>
          <button class="pill" type="button">SUCCESS 16</button>
          <button class="pill" type="button">ALL 16</button>
        </div>
      </div>
      <p style="color:var(--muted);margin:0.85rem 0 0">No failed items for this job.</p>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">Recent ingest jobs</h3>
        <button class="link-btn" type="button">↻ Refresh</button>
      </div>
      <table class="table" style="margin-top:0.55rem">
        <thead><tr><th>Job</th><th>Source</th><th>File</th><th>Status</th><th>Rows</th><th>Updated</th></tr></thead>
        <tbody>
          <tr class="clickable selected" data-job="ing_340ceb2fe31747c8b771e871a15ec2356">
            <td style="font-family:var(--mono);font-size:0.75rem">ing_340ceb2f…</td>
            <td><span class="chip">csv</span></td>
            <td>qra-input-sample (4).csv</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>16/16</td>
            <td>2026-09-10 11:56:44</td>
          </tr>
          <tr class="clickable" data-job="ing_api_9912">
            <td style="font-family:var(--mono);font-size:0.75rem">ing_api_9912…</td>
            <td><span class="chip">api_pull</span></td>
            <td>get_conversations</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>2104/2104</td>
            <td>2026-09-10 08:00:12</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  const exportTab = `
    <p class="hint" style="margin:0 0 0.75rem">Export completed AutoQRA as QRA-Output CSV.</p>
    <div class="grid-2">
      <div class="card" style="margin:0">
        <h3>Export AutoQRA</h3>
        <p class="hint">Export COMPLETED AutoQRA rows. <a href="#">Download column sample</a></p>
        <div class="grid-filters">
          <div class="field"><label>Date from</label><input placeholder="mm/dd/yyyy" /></div>
          <div class="field"><label>Date to</label><input placeholder="mm/dd/yyyy" /></div>
        </div>
        <div class="footer-actions"><span></span><button class="btn" disabled type="button">Start export</button></div>
      </div>
      <div class="card" style="margin:0">
        <h3>Selected job</h3>
        <p class="hint">Select an export job to download artifacts.</p>
      </div>
    </div>`;

  return `
    <h1 class="page-title">Data Import</h1>
    <p class="page-sub">Ingest, pull, and export conversation data for the selected techclient tenant.</p>
    ${tenantRow()}
    ${failedBar()}
    <div class="tabs">
      <button class="tab ${dataTab === "ingest" ? "active" : ""}" type="button" data-data-tab="ingest">Ingest <span class="badge">2</span></button>
      <button class="tab ${dataTab === "export" ? "active" : ""}" type="button" data-data-tab="export">Export</button>
    </div>
    ${dataTab === "ingest" ? ingest : exportTab}`;
}

function renderSampling() {
  const newSample = `
    <div class="card">
      <h3>Sample from ingested interactions</h3>
      <p class="hint">Filters load from ci_interactions. Queues AutoQRA, enrichment, and evaluation.</p>
      <div class="grid-filters">
        <div class="field"><label>Date from</label><input value="09/01/2026" /></div>
        <div class="field"><label>Date to</label><input value="09/10/2026" /></div>
        <div class="field"><label>Queue</label>
          <div class="chip-select">
            <span class="chip">UHC_Refill_Status <button type="button">×</button></span>
            <span class="chip">UHC_Rx_Refill_Chat <button type="button">×</button></span>
          </div>
        </div>
        <div class="field"><label>LOB</label>
          <div class="chip-select">
            <span class="chip">Commercial Pharmacy <button type="button">×</button></span>
          </div>
        </div>
        <div class="field"><label>Agent</label><select><option>All agents</option></select></div>
        <div class="field"><label>Team leader</label><select><option>All team leaders</option></select></div>
        <div class="field"><label>Intent</label>
          <div class="chip-select"><span class="chip">rx_refill_request <button type="button">×</button></span></div>
        </div>
        <div class="field"><label>Requested count</label><input type="number" value="10" /></div>
      </div>
      <div class="footer-actions">
        <p class="hint">After queueing, open Jobs &amp; results.</p>
        <button class="btn primary" type="button">Start sampling</button>
      </div>
    </div>`;

  const jobs = `
    <div class="card">
      <h3>Jobs &amp; results</h3>
      <table class="table">
        <thead><tr><th>Job</th><th>Filters</th><th>Requested</th><th>Status</th><th>AutoQRA</th></tr></thead>
        <tbody>
          <tr><td style="font-family:var(--mono);font-size:0.75rem">smp_44a1…</td><td>UHC · Rx</td><td>10</td><td><span class="status ok">COMPLETED</span></td><td>10 scored</td></tr>
          <tr><td style="font-family:var(--mono);font-size:0.75rem">smp_91bc…</td><td>247client1_Web_Chat</td><td>25</td><td><span class="status warn">RUNNING</span></td><td>12 / 25</td></tr>
        </tbody>
      </table>
    </div>`;

  return `
    <h1 class="page-title">Sampling</h1>
    <p class="page-sub">Sample ingested interactions and run AutoQRA modules.</p>
    ${tenantRow()}
    ${failedBar()}
    <div class="tabs">
      <button class="tab ${samplingTab === "new" ? "active" : ""}" type="button" data-samp-tab="new">New sample</button>
      <button class="tab ${samplingTab === "jobs" ? "active" : ""}" type="button" data-samp-tab="jobs">Jobs &amp; results</button>
    </div>
    ${samplingTab === "new" ? newSample : jobs}`;
}

function renderCoaching() {
  const cards = COACHING.map(
    (c) => `
    <article class="coach-card">
      <span class="severity ${c.severity}">${c.severity.toUpperCase()}</span>
      <h3>${c.agent}</h3>
      <div class="audit-count">${c.audits} audits · ${c.fails} fail / defect hits · theme: ${c.theme}</div>
      <p class="opp">${c.opportunity}</p>
      <div class="btn-row">
        <button class="btn primary" type="button">Open coaching plan</button>
        <button class="btn" type="button">View audits</button>
      </div>
    </article>`
  ).join("");

  return `
    <h1 class="page-title">Coaching</h1>
    <p class="page-sub">Coaching opportunities prioritized by audit volume and recurring defect patterns from AutoQRA scoring.</p>
    ${tenantRow()}
    <div class="stat-row">
      <div class="stat"><div class="label">Agents with opps</div><div class="value">${COACHING.length}</div></div>
      <div class="stat"><div class="label">Audits in window</div><div class="value">255</div></div>
      <div class="stat"><div class="label">High priority</div><div class="value">2</div></div>
      <div class="stat"><div class="label">Avg audits / agent</div><div class="value">51</div></div>
    </div>
    <div class="coach-grid">${cards}</div>`;
}

function renderReporting() {
  return `
    <h1 class="page-title">Reporting &amp; Insights</h1>
    <p class="page-sub">Apache Superset dashboards for AutoQRA volume, scores, overrides, and LOB trends.</p>
    ${tenantRow()}
    <div class="embed-frame">
      <div class="embed-chrome">
        <span class="dot"></span>
        <span>Superset · AutoQRA Executive Dashboard</span>
        <span style="margin-left:auto;font-family:var(--mono);font-size:0.72rem">/superset/dashboard/autoqra-exec/</span>
        <button class="btn" type="button">Open in Superset ↗</button>
      </div>
      <div class="embed-body">
        <div class="stat-row" style="margin:0">
          <div class="stat"><div class="label">Audits MTD</div><div class="value">18.4k</div></div>
          <div class="stat"><div class="label">Avg score</div><div class="value">86.4</div></div>
          <div class="stat"><div class="label">Agreement</div><div class="value">92%</div></div>
          <div class="stat"><div class="label">Override rate</div><div class="value">4.8%</div></div>
        </div>
        <div class="superset-mock">
          <div class="chart-box">
            <h4>Audit volume by day</h4>
            <div class="bar-chart">
              <span style="height:40%"></span><span style="height:55%"></span><span style="height:70%"></span>
              <span style="height:48%"></span><span style="height:82%"></span><span style="height:66%"></span>
              <span style="height:90%"></span>
            </div>
          </div>
          <div class="chart-box">
            <h4>Pass / fail / review mix</h4>
            <table class="table">
              <tbody>
                <tr><td>Auto-pass</td><td>72%</td></tr>
                <tr><td>Auto-fail</td><td>11%</td></tr>
                <tr><td>Human review</td><td>17%</td></tr>
              </tbody>
            </table>
          </div>
          <div class="chart-box">
            <h4>Score by LOB</h4>
            <table class="table">
              <tbody>
                <tr><td>Retail</td><td>88.1</td></tr>
                <tr><td>Cards</td><td>81.4</td></tr>
                <tr><td>Pharmacy</td><td>90.2</td></tr>
              </tbody>
            </table>
          </div>
          <div class="chart-box">
            <h4>Top defect parameters</h4>
            <table class="table">
              <tbody>
                <tr><td>Disclosure completeness</td><td>142</td></tr>
                <tr><td>Empathy / rapport</td><td>89</td></tr>
                <tr><td>Resolution confirmation</td><td>61</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <p class="hint" style="margin-top:0.65rem;color:var(--muted);font-size:0.85rem">Wireframe placeholder for embedded Superset. Production loads governed datasets from AutoQRA result tables.</p>`;
}

function renderCalibration() {
  return `
    <h1 class="page-title">Calibration &amp; AI Optimization</h1>
    <p class="page-sub">Align human and AI scoring, tune thresholds, and optimize prompts / models from disagreement patterns.</p>
    ${tenantRow()}
    <div class="calib-grid">
      <div class="card">
        <h3>Calibration sessions</h3>
        <p class="hint">Compare AI vs lead reviewer on sampled audits.</p>
        <table class="table">
          <thead><tr><th>Session</th><th>Audits</th><th>Agreement</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Weekly Cards · Soft skills</td><td>12</td><td>90%</td><td><span class="status warn">Scheduled</span></td></tr>
            <tr><td>Pharmacy disclosures</td><td>20</td><td>93%</td><td><span class="status ok">Complete</span></td></tr>
            <tr><td>Fraud intent pack</td><td>15</td><td>—</td><td><span class="status neutral">Draft</span></td></tr>
          </tbody>
        </table>
        <div class="btn-row" style="margin-top:0.65rem">
          <button class="btn primary" type="button">Start session</button>
          <button class="btn" type="button">Export pack</button>
        </div>
      </div>
      <div class="card">
        <h3>AI Optimization</h3>
        <p class="hint">Actions driven by override and anomaly signals.</p>
        <ul class="opt-list">
          <li><strong>Prompt v14 drift</strong> — Soft skills agreement dipped 3pts. Recommend A/B vs v13.</li>
          <li><strong>Routing threshold</strong> — Cards chat human-route share 24% (target 17%). Review confidence cutover 0.86 → 0.88.</li>
          <li><strong>Hallucination watch</strong> — Unsupported rationale 2.1% (under 5% gate).</li>
          <li><strong>Scorecard gap</strong> — New promo disclosure not in 247client1 form v3. Queue form modify.</li>
        </ul>
        <div class="btn-row" style="margin-top:0.65rem">
          <button class="btn primary" type="button">Open model ops</button>
          <button class="btn" type="button">Reprocess sample</button>
        </div>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="label">Human agreement</div><div class="value">92%</div></div>
      <div class="stat"><div class="label">Override rate</div><div class="value">4.8%</div></div>
      <div class="stat"><div class="label">Hallucination</div><div class="value">2.1%</div></div>
      <div class="stat"><div class="label">Active prompt</div><div class="value">v14</div></div>
    </div>`;
}

function renderAdvanced() {
  return `
    <h1 class="page-title">Advanced Insights</h1>
    <p class="page-sub">Sentiment analysis, predictive QA, intent analytics, and behavioral scoring signals.</p>
    ${tenantRow()}
    <div class="adv-grid">
      <div class="adv-card">
        <h3>Sentiment analysis</h3>
        <p class="hint" style="margin:0;color:var(--muted);font-size:0.85rem">Customer / agent tone across audited interactions</p>
        <div class="sentiment-row">
          <div class="sent-pill pos">Positive<br/><b>41%</b></div>
          <div class="sent-pill neu">Neutral<br/><b>46%</b></div>
          <div class="sent-pill neg">Negative<br/><b>13%</b></div>
        </div>
        <p style="font-size:0.86rem;margin:0">Negative spikes correlate with fraud-unauthorized-charges and payment_arrangement intents.</p>
      </div>
      <div class="adv-card">
        <h3>Predictive analysis</h3>
        <p class="hint" style="margin:0 0 0.45rem;color:var(--muted);font-size:0.85rem">Forecast risk before volume builds</p>
        <p style="font-size:0.88rem;line-height:1.45;margin:0 0 0.55rem">Cards chat fail risk <strong>+18%</strong> tomorrow from promo script variance. Pharmacy refill queue stable.</p>
        <button class="btn primary" type="button">Open risk plan</button>
      </div>
      <div class="adv-card">
        <h3>Intent analytics</h3>
        <table class="table">
          <tbody>
            <tr><td>rx_refill_request</td><td>18%</td></tr>
            <tr><td>fraud-unauthorized-charges</td><td>14%</td></tr>
            <tr><td>address_update</td><td>11%</td></tr>
            <tr><td>payment_arrangement</td><td>9%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="grid-2" style="margin-top:0.75rem">
      <div class="card">
        <h3>Behavioral scoring trends</h3>
        <table class="table">
          <thead><tr><th>Dimension</th><th>Avg</th><th>WoW</th></tr></thead>
          <tbody>
            <tr><td>Empathy</td><td>4.2</td><td>+0.1</td></tr>
            <tr><td>Ownership</td><td>4.5</td><td>0</td></tr>
            <tr><td>Clarity</td><td>3.9</td><td>-0.2</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>Anomaly highlights</h3>
        <ul class="opt-list">
          <li>Override rate ↑ Cards LOB (watch)</li>
          <li>Sentiment negative cluster · payment_arrangement</li>
          <li>Predictive alert · promo script variance</li>
        </ul>
      </div>
    </div>`;
}

function renderAdmin() {
  return `
    <h1 class="page-title">Admin</h1>
    <p class="page-sub">Tenant configuration, CRM / KB integration, ingestion, RBAC, and monitoring forms.</p>
    ${tenantRow()}

    <div class="card">
      <h3>CRM &amp; Knowledge Base integration</h3>
      <p class="hint">Connect CRMs and KB sources so AutoQRA can pull case context and policy articles during review.</p>
      <button class="admin-link-card" type="button" data-open-crm>
        <div>
          <strong>Configure CRM &amp; KB</strong>
          <span>3 connected · Salesforce, Confluence, Internal Policy KB</span>
        </div>
        <span>Open pane →</span>
      </button>
    </div>

    <div class="card admin-block">
      <h3>Tenant configuration</h3>
      <pre>{
  "sample_daily_quota": 1700,
  "quota_timezone": "UTC",
  "transcript_report_id": "get_ingested_transcript",
  "max_csv_bytes": 52428800,
  "uses_agentic_runtime": true,
  "enable_ai_coworker_tab": false
}</pre>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>API Pull (Data ingestion)</h3>
        <dl class="kv">
          <dt>Enable</dt><dd>Yes</dd>
          <dt>Last watermark</dt><dd>2026-08-31T23:59:59Z</dd>
          <dt>Connector</dt><dd>dasng</dd>
          <dt>Report ID</dt><dd>get_conversations</dd>
        </dl>
      </div>
      <div class="card">
        <h3>SFTP / Cloud bucket</h3>
        <dl class="kv">
          <dt>SFTP</dt><dd>Disabled</dd>
          <dt>Bucket ingest</dt><dd>Enabled · *.csv</dd>
        </dl>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>RBAC</h3>
        <table class="table">
          <thead><tr><th>Role</th><th>Audits</th><th>Override</th><th>Config</th></tr></thead>
          <tbody>
            <tr><td>QA Analyst</td><td>✓</td><td>✓</td><td>—</td></tr>
            <tr><td>QA Manager</td><td>✓</td><td>✓</td><td>✓</td></tr>
            <tr><td>System Admin</td><td>✓</td><td>✓</td><td>✓</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>Monitoring form scoring</h3>
        <ul style="margin:0;padding-left:1.1rem;font-size:0.9rem;line-height:1.6">
          <li>247client1 Chat QA form v3 — published (scoring + GenAI summary)</li>
          <li>Queue <code>247client1_Web_Chat</code> → scorecard v3</li>
          <li>Queue <code>UHC_Rx_Refill_Chat</code> → Pharmacy form v1.4</li>
        </ul>
        <div class="btn-row" style="margin-top:0.75rem">
          <button class="btn primary" type="button">Modify monitoring form</button>
          <button class="btn" type="button">Map queue</button>
        </div>
      </div>
    </div>`;
}

function renderCrmPaneBody() {
  return `
    <p style="margin:0 0 0.75rem;font-size:0.88rem;color:var(--muted)">Known CRM and KB systems for this techclient. Select one to configure endpoints and scopes.</p>
    ${CRMS.map(
      (c) => `
      <div class="crm-item ${c.id === selectedCrm ? "active" : ""}" data-crm="${c.id}">
        <h4>${c.name} <span class="status ${c.status === "Connected" ? "ok" : "neutral"}">${c.status}</span></h4>
        <p>${c.type} · ${c.endpoint}</p>
        <div class="crm-actions">
          <button class="btn ${c.status === "Connected" ? "" : "primary"}" type="button" data-crm-cfg="${c.id}">
            ${c.status === "Connected" ? "Edit config" : "Connect"}
          </button>
        </div>
      </div>`
    ).join("")}
    <div class="card" style="margin-top:0.5rem">
      <h3>Configuration · ${CRMS.find((c) => c.id === selectedCrm)?.name || ""}</h3>
      <div class="form-grid" style="display:grid;gap:0.55rem">
        <div class="field"><label>Base URL / endpoint</label><input value="${CRMS.find((c) => c.id === selectedCrm)?.endpoint || ""}" /></div>
        <div class="field"><label>Auth</label><select><option>OAuth 2.0</option><option>API key</option><option>SSO</option></select></div>
        <div class="field"><label>Scopes</label><input value="cases:read, contacts:read, articles:read" /></div>
        <div class="field"><label>Use in AutoQRA review</label><select><option>Yes — show on Details tab</option><option>No</option></select></div>
      </div>
      <div class="btn-row" style="margin-top:0.65rem">
        <button class="btn primary" type="button">Save</button>
        <button class="btn" type="button" data-close-pane>Cancel</button>
      </div>
    </div>`;
}

function openCrmPane() {
  crmPaneBody.innerHTML = renderCrmPaneBody();
  crmPane.hidden = false;
}

function closeCrmPane() {
  crmPane.hidden = true;
}

const RENDERERS = {
  overview: renderOverview,
  interactions: renderInteractions,
  "data-import": renderDataImport,
  sampling: renderSampling,
  coaching: renderCoaching,
  reporting: renderReporting,
  calibration: renderCalibration,
  advanced: renderAdvanced,
  admin: renderAdmin,
};

function setNav(view) {
  document.querySelectorAll(".side-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  quotaBox.hidden = !(view === "sampling" || view === "data-import");
}

function render(view) {
  currentView = view;
  if (view !== "interactions") selectedIx = null;
  setNav(view);
  workspace.innerHTML = RENDERERS[view]();
  sideNav.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.querySelectorAll(".side-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedIx = null;
    render(btn.dataset.view);
  });
});

document.getElementById("collapseNav").addEventListener("click", () => {
  sideNav.classList.toggle("collapsed");
});

workspace.addEventListener("click", (e) => {
  const goto = e.target.closest("[data-goto]");
  if (goto) {
    selectedIx = null;
    openMsKey = null;
    render(goto.dataset.goto);
    return;
  }

  const openIx = e.target.closest("[data-open-ix]");
  if (openIx) {
    selectedIx = openIx.dataset.openIx;
    ixSideTab = "audit";
    openMsKey = null;
    render("interactions");
    return;
  }

  if (e.target.closest("[data-ix-back]")) {
    selectedIx = null;
    openMsKey = null;
    render("interactions");
    return;
  }

  const ixTab = e.target.closest("[data-ix-tab]");
  if (ixTab) {
    ixSideTab = ixTab.dataset.ixTab;
    render("interactions");
    return;
  }

  // Multi-select: remove chip
  const msRemove = e.target.closest("[data-ms-remove]");
  if (msRemove) {
    e.preventDefault();
    e.stopPropagation();
    const [key, value] = msRemove.dataset.msRemove.split("|");
    toggleFilterValue(key, value);
    openMsKey = null;
    render("interactions");
    return;
  }

  // Multi-select: toggle checkbox option (handled on change; stop click bubble only)
  if (e.target.closest("[data-ms-toggle]") || e.target.closest(".ms-option")) {
    e.stopPropagation();
    return;
  }

  // Multi-select: open/close dropdown
  const msOpen = e.target.closest("[data-ms-open]");
  if (msOpen) {
    e.preventDefault();
    e.stopPropagation();
    const key = msOpen.dataset.msOpen;
    openMsKey = openMsKey === key ? null : key;
    render("interactions");
    return;
  }

  // Keep dropdown open when clicking inside it
  if (e.target.closest("[data-ms-drop]")) {
    e.stopPropagation();
    return;
  }

  if (e.target.closest("[data-ix-apply]")) {
    openMsKey = null;
    // read dates from inputs if present
    const from = workspace.querySelector('[data-ix-date="dateFrom"]');
    const to = workspace.querySelector('[data-ix-date="dateTo"]');
    if (from) ixFilters.dateFrom = from.value;
    if (to) ixFilters.dateTo = to.value;
    render("interactions");
    return;
  }

  if (e.target.closest("[data-ix-clear]")) {
    ixFilters.dateFrom = "2026-09-01";
    ixFilters.dateTo = "2026-09-10";
    ixFilters.queues = [];
    ixFilters.lobs = [];
    ixFilters.agents = [];
    ixFilters.intents = [];
    ixFilters.statuses = [];
    ixFilters.sources = [];
    openMsKey = null;
    render("interactions");
    return;
  }

  // Close any open multi-select when clicking elsewhere in workspace
  if (openMsKey && !e.target.closest(".ms-wrap")) {
    openMsKey = null;
    render("interactions");
    return;
  }

  const dTab = e.target.closest("[data-data-tab]");
  if (dTab) {
    dataTab = dTab.dataset.dataTab;
    render("data-import");
    return;
  }

  const sTab = e.target.closest("[data-samp-tab]");
  if (sTab) {
    samplingTab = sTab.dataset.sampTab;
    render("sampling");
    return;
  }

  const job = e.target.closest("[data-job]");
  if (job) {
    selectedIngestJob = job.dataset.job;
    render("data-import");
    return;
  }

  if (e.target.closest("[data-open-crm]")) {
    openCrmPane();
    return;
  }

  const pill = e.target.closest(".pill");
  if (pill && pill.parentElement?.classList.contains("pill-filters")) {
    pill.parentElement.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
  }

  const choice = e.target.closest(".choice");
  if (choice) {
    const row = choice.parentElement;
    row.querySelectorAll(".choice").forEach((c) => c.classList.remove("selected"));
    choice.classList.add("selected");
  }
});

workspace.addEventListener("change", (e) => {
  const dateInput = e.target.closest("[data-ix-date]");
  if (dateInput) {
    ixFilters[dateInput.dataset.ixDate] = dateInput.value;
    return;
  }
  const msToggle = e.target.closest("[data-ms-toggle]");
  if (msToggle) {
    const [key, value] = msToggle.dataset.msToggle.split("|");
    const arr = ixFilters[key];
    const idx = arr.indexOf(value);
    if (msToggle.checked && idx < 0) arr.push(value);
    if (!msToggle.checked && idx >= 0) arr.splice(idx, 1);
    openMsKey = key;
    render("interactions");
  }
});

crmPane.addEventListener("click", (e) => {
  if (e.target.closest("[data-close-pane]")) {
    closeCrmPane();
    return;
  }
  const item = e.target.closest("[data-crm]");
  if (item) {
    selectedCrm = item.dataset.crm;
    crmPaneBody.innerHTML = renderCrmPaneBody();
  }
  const cfg = e.target.closest("[data-crm-cfg]");
  if (cfg) {
    selectedCrm = cfg.dataset.crmCfg;
    crmPaneBody.innerHTML = renderCrmPaneBody();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !crmPane.hidden) closeCrmPane();
});

render("interactions");
