/* AutoQRA wireframe integrated with Conversation Insights UI patterns */

const FEATURES = [
  { id: "audit-forms", name: "Audit forms", tier: "core", view: "interactions" },
  { id: "dispute-workflows", name: "Dispute workflows", tier: "core", view: "interactions" },
  { id: "manual-qa", name: "Manual QA workflows", tier: "core", view: "interactions" },
  { id: "transcript-viewer", name: "Transcript viewer", tier: "core", view: "interactions" },
  { id: "assist-mode", name: "Auto QRA assist mode", tier: "core", view: "interactions" },
  { id: "ai-rationale", name: "AI rationale generation", tier: "core", view: "interactions" },
  { id: "reporting-basics", name: "Reporting basics", tier: "core", view: "analytics" },
  { id: "multi-lob", name: "Multi-LOB support", tier: "core", view: "sampling" },
  { id: "audit-trail", name: "Audit Trail and Log", tier: "core", view: "interactions" },
  { id: "human-override", name: "Human override workflow", tier: "core", view: "interactions" },
  { id: "crm-docs", name: "Access to CRM and Documentation", tier: "advanced", view: "interactions" },
  { id: "calibration", name: "Calibration sessions", tier: "advanced", view: "analytics" },
  { id: "compliance-alerts", name: "Compliance Detection and Alerts", tier: "advanced", view: "interactions" },
  { id: "tech-ingestion", name: "Technology Client — Data ingestion", tier: "advanced", view: "data-import" },
  { id: "autonomous-scoring", name: "Fully autonomous scoring", tier: "advanced", view: "sampling" },
  { id: "advanced-dashboards", name: "Advanced dashboards", tier: "advanced", view: "analytics" },
  { id: "cloud-integrations", name: "Cloud integrations", tier: "advanced", view: "data-import" },
  { id: "csv-ingestion", name: "CSV ingestion", tier: "advanced", view: "data-import" },
  { id: "queue-mapping", name: "Queue mapping", tier: "advanced", view: "admin" },
  { id: "sentiment", name: "Sentiment analysis", tier: "advanced", view: "interactions" },
  { id: "coaching", name: "Agent coaching recommendations", tier: "insight", view: "analytics" },
  { id: "rbac", name: "RBAC", tier: "insight", view: "admin" },
  { id: "self-serve", name: "Self-serve Capabilities (Based on RBAC)", tier: "insight", view: "admin" },
  { id: "multi-language", name: "Multi-language QA", tier: "insight", view: "interactions" },
  { id: "realtime", name: "Real-time auditing", tier: "insight", view: "interactions" },
  { id: "monitoring-form", name: "New / Modification of the Monitoring Form", tier: "insight", view: "admin" },
  { id: "anomaly", name: "AI anomaly detection", tier: "insight", view: "analytics" },
  { id: "genai-summaries", name: "GenAI summaries", tier: "insight", view: "interactions" },
  { id: "intent", name: "Intent analytics", tier: "insight", view: "analytics" },
  { id: "predictive", name: "Predictive QA insights", tier: "insight", view: "analytics" },
  { id: "behavioral", name: "Behavioral scoring", tier: "insight", view: "interactions" },
];

const INTERACTIONS = [
  {
    id: "0459517b-4e6d-4d1f-a8a8-8ca18a4601fe",
    short: "0459517b…601fe",
    agent: "qa",
    duration: "3m 29s",
    queue: "patelco_Web_Chat",
    lob: "Test_Lob",
    channel: "ude",
    source: "api_pull",
    intent: "fraud-unauthorized-charges",
    sentiment: "neutral",
    escalated: true,
    status: "COMPLETED",
  },
  {
    id: "1a82c0ee-91b2-4a11-9c44-77f0aa001122",
    short: "1a82c0ee…1122",
    agent: "m.chen",
    duration: "5m 12s",
    queue: "patelco_Web_Chat",
    lob: "Retail",
    channel: "ude",
    source: "csv",
    intent: "address_update",
    sentiment: "positive",
    escalated: false,
    status: "COMPLETED",
  },
  {
    id: "9f33d4aa-2201-4e55-bb19-55aa99112233",
    short: "9f33d4aa…2233",
    agent: "r.patel",
    duration: "2m 05s",
    queue: "UHC_Rx_Refill_Chat",
    lob: "Commercial Pharmacy",
    channel: "ude",
    source: "api_pull",
    intent: "rx_refill_request",
    sentiment: "neutral",
    escalated: false,
    status: "IN_REVIEW",
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

const workspace = document.getElementById("workspace");
const quotaBox = document.getElementById("quotaBox");
const sideNav = document.getElementById("sideNav");

let currentView = "interactions";
let selectedIx = INTERACTIONS[0].id;
let ixSideTab = "audit";
let dataTab = "ingest";
let samplingTab = "new";
let selectedIngestJob = "ing_340ceb2fe31747c8b771e871a15ec2356";

function tenantRow(extra = "") {
  return `
    <div class="tenant-row">
      <code>techclient / test / ude</code>
      <button class="link-btn" type="button">Change</button>
      ${extra}
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
    <p class="page-sub">All 31 capabilities mapped onto Conversation Insights screens: Interactions, Data Import, Sampling, Admin, Analytics.</p>
    <div class="stat-row">
      <div class="stat"><div class="label">Total</div><div class="value">31</div></div>
      <div class="stat"><div class="label">Core</div><div class="value">${core.length}</div></div>
      <div class="stat"><div class="label">Advanced</div><div class="value">${advanced.length}</div></div>
      <div class="stat"><div class="label">Insights</div><div class="value">${insight.length}</div></div>
    </div>
    <div class="card">
      <h3>Core QA</h3>
      <div class="feature-grid">${core.map(tile).join("")}</div>
    </div>
    <div class="card">
      <h3>Advanced / Integration</h3>
      <div class="feature-grid">${advanced.map(tile).join("")}</div>
    </div>
    <div class="card">
      <h3>Insights / Admin</h3>
      <div class="feature-grid">${insight.map(tile).join("")}</div>
    </div>`;
}

function renderInteractions() {
  const ix = INTERACTIONS.find((i) => i.id === selectedIx) || INTERACTIONS[0];

  const list = INTERACTIONS.map(
    (i) => `
    <button class="ix-item ${i.id === ix.id ? "active" : ""}" type="button" data-ix="${i.id}">
      <div class="id">${i.short}</div>
      <div class="meta">${i.queue}</div>
      <div class="sub">${i.agent} · ${i.duration} · ${i.intent}</div>
    </button>`
  ).join("");

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
      <dt>Agent</dt><dd>${ix.agent}</dd>
    </dl>
    <div class="insight-block">
      <h4>Intents</h4>
      <p><span class="chip">${ix.intent}</span></p>
    </div>
    <div class="insight-block">
      <h4>AI Insights</h4>
      <p><strong>Sentiment:</strong> ${ix.sentiment}</p>
      <p style="margin-top:0.35rem"><strong>Primary intent:</strong> Member reported an unauthorized charge and requested verification.</p>
      <p style="margin-top:0.35rem"><strong>Resolution:</strong> Concierge verified identity and routed to fraud review.</p>
      <p style="margin-top:0.35rem"><strong>GenAI summary:</strong> Short fraud verification chat; soft-skills section scored 20/20.</p>
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
      <h3>Patelco's Chat Quality Assurance Monitoring Form</h3>
      <p class="hint" style="margin:0 0 0.55rem">Identity (from interaction) — copied from CSV / API pull. Not edited on AutoQRA submit.</p>
      <div class="audit-meta">
        <div class="field"><label>Agent EmpId</label><input value="A10482" readonly /></div>
        <div class="field"><label>Manager Name</label><input value="S. Miles" readonly /></div>
        <div class="field"><label>Customer Name</label><input value="Jordan Lee" readonly /></div>
        <div class="field"><label>Agent Category</label><input value="Chat Tier 1" readonly /></div>
        <div class="field"><label>Evaluator</label><input value="ci_autoqra" readonly /></div>
        <div class="field"><label>Audit Type</label><select><option>Auto QA</option><option>Manual QA</option></select></div>
      </div>
      <p style="font-size:0.82rem;margin:0 0 0.55rem">AutoQRA status: <strong>${ix.status}</strong> · v3
        <button class="btn" type="button" style="margin-left:0.5rem">▶ Start timer</button>
      </p>
      <div class="ack-box">
        <span class="status ok">Acknowledged</span>
        <strong>Agent acknowledgment</strong><br/>
        Agent decision: <strong>Accept</strong><br/>
        Agent comments: <strong>Looks Good</strong>
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
        <tr><td>08:11</td><td>Autonomous scoring · scorecard Patelco Chat v3</td></tr>
        <tr><td>08:12</td><td>AI rationale generated for Soft Skills Q1–Q5</td></tr>
        <tr><td>09:18</td><td>Agent acknowledgment · Accept</td></tr>
        <tr><td>09:40</td><td>QA Lead viewed evidence highlight</td></tr>
      </tbody>
    </table>`;

  const sideBody = ixSideTab === "details" ? details : ixSideTab === "history" ? history : audit;

  return `
    <div class="ix-layout">
      <section class="ix-list">
        <div class="ix-list-head"><h2>Interactions</h2></div>
        <div class="filter-stack">
          <div class="field"><label>Date range</label><input type="text" value="09/01/2026 – 09/10/2026" /></div>
          <div class="field"><label>Queue</label>
            <div class="chip-select"><span class="chip">patelco_Web_Chat <button type="button">×</button></span></div>
          </div>
          <div class="field"><label>LOB</label>
            <div class="chip-select"><span class="chip">Test_Lob <button type="button">×</button></span></div>
          </div>
          <div class="field"><label>Agent</label><select><option>All agents</option><option>qa</option><option>m.chen</option></select></div>
          <div class="field"><label>Intent</label>
            <div class="chip-select"><span class="chip">fraud-unauthorized-charges <button type="button">×</button></span></div>
          </div>
          <div class="field"><label>Source</label><select><option>All sources</option><option>api_pull</option><option>csv</option></select></div>
          <div class="field"><label>AutoQRA status</label><select><option>All</option><option>COMPLETED</option><option>IN_REVIEW</option></select></div>
          <button class="btn primary" type="button">Apply filters</button>
        </div>
        <div class="ix-items">${list}</div>
      </section>

      <section class="ix-transcript">
        <div class="ix-trans-head">
          <div>
            <h2>Transcript</h2>
            <div class="ix-trans-meta">${ix.id} · ${ix.duration} · Agent ${ix.agent}</div>
          </div>
          <button class="btn" type="button">← Back</button>
        </div>
        <div class="search-row"><input placeholder="Search transcript..." /></div>
        <div class="transcript-body">
          <div class="bubble bot"><div class="who">Bot · 11:45 AM</div>Welcome to Patelco support. I can help with unauthorized charges.</div>
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
          <p class="hint" style="margin:0.25rem 0 0">Server-paginated preview (50 rows/page). Filter failures first for large jobs.</p>
        </div>
        <div class="pill-filters">
          <button class="pill active" type="button">FAILED 0</button>
          <button class="pill" type="button">SUCCESS 16</button>
          <button class="pill" type="button">ALL 16</button>
        </div>
      </div>
      <p style="color:var(--muted);margin:0.85rem 0 0">No failed items for this job. Switch to ALL or SUCCESS to browse outcomes.</p>
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
          <tr class="clickable" data-job="ing_758351914494">
            <td style="font-family:var(--mono);font-size:0.75rem">ing_75835191…</td>
            <td><span class="chip">csv</span></td>
            <td>qra-input-sample (4).csv</td>
            <td><span class="status bad">FAILED</span></td>
            <td>0/0</td>
            <td>2026-09-10 11:37:42</td>
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
        <p class="hint">Export COMPLETED AutoQRA rows as QRA-Output CSV for the selected date range. <a href="#">Download column sample</a></p>
        <div class="grid-filters">
          <div class="field"><label>Date from</label><input type="text" placeholder="mm/dd/yyyy" /></div>
          <div class="field"><label>Date to</label><input type="text" placeholder="mm/dd/yyyy" /></div>
        </div>
        <div class="footer-actions"><span></span><button class="btn" type="button" disabled>Start export</button></div>
      </div>
      <div class="card" style="margin:0">
        <h3>Selected job</h3>
        <p class="hint">Select an export job to download artifacts or view errors.</p>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">Recent export jobs</h3>
        <button class="link-btn" type="button">↻ Refresh</button>
      </div>
      <p style="color:var(--muted);margin:0.75rem 0 0">No export jobs yet. Choose a date range and start an export.</p>
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
      <p class="hint">Multi-select filters are loaded from ci_interactions. Leave a field empty to include all values. Date range also scopes available options. Queues AutoQRA, enrichment, and evaluation modules.</p>
      <div class="grid-filters">
        <div class="field"><label>Date from</label><input type="text" placeholder="mm/dd/yyyy" value="09/01/2026" /></div>
        <div class="field"><label>Date to</label><input type="text" placeholder="mm/dd/yyyy" value="09/10/2026" /></div>
        <div class="field"><label>Queue</label>
          <div class="chip-select">
            <span class="chip">UHC_Refill_Status <button type="button">×</button></span>
            <span class="chip">UHC_Rx_Refill_Chat <button type="button">×</button></span>
          </div>
        </div>
        <div class="field"><label>LOB</label>
          <div class="chip-select">
            <span class="chip">Commercial Pharmacy <button type="button">×</button></span>
            <span class="chip">Medicaid Pharmacy <button type="button">×</button></span>
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
        <p class="hint">After queueing, you'll be taken to Jobs &amp; results to watch progress.</p>
        <button class="btn primary" type="button">Start sampling</button>
      </div>
    </div>`;

  const jobs = `
    <div class="card">
      <h3>Jobs &amp; results</h3>
      <p class="hint">Sampling jobs run AutoQRA scoring, enrichment, and evaluation for the selected techclient filters.</p>
      <table class="table">
        <thead><tr><th>Job</th><th>Filters</th><th>Requested</th><th>Status</th><th>AutoQRA</th><th>Updated</th></tr></thead>
        <tbody>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">smp_44a1…</td>
            <td>UHC queues · Rx intent</td>
            <td>10</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>10 scored</td>
            <td>2026-09-10 12:04</td>
          </tr>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">smp_91bc…</td>
            <td>patelco_Web_Chat</td>
            <td>25</td>
            <td><span class="status warn">RUNNING</span></td>
            <td>12 / 25</td>
            <td>2026-09-10 12:10</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  return `
    <h1 class="page-title">Sampling</h1>
    <p class="page-sub">Sample ingested interactions and run AutoQRA, enrichment, and evaluation modules.</p>
    ${tenantRow()}
    ${failedBar()}
    <div class="tabs">
      <button class="tab ${samplingTab === "new" ? "active" : ""}" type="button" data-samp-tab="new">New sample</button>
      <button class="tab ${samplingTab === "jobs" ? "active" : ""}" type="button" data-samp-tab="jobs">Jobs &amp; results</button>
    </div>
    ${samplingTab === "new" ? newSample : jobs}`;
}

function renderAdmin() {
  return `
    <h1 class="page-title">Admin</h1>
    <p class="page-sub">Tenant configuration for techclient data ingestion, quotas, and AutoQRA runtime.</p>
    ${tenantRow()}
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
          <dt>Page size</dt><dd>100</dd>
          <dt>Overlap</dt><dd>300 seconds</dd>
        </dl>
      </div>
      <div class="card">
        <h3>SFTP ingestion</h3>
        <dl class="kv">
          <dt>Enable</dt><dd>No</dd>
          <dt>Remote path</dt><dd>—</dd>
          <dt>File pattern</dt><dd>*.csv</dd>
        </dl>
        <h3 style="margin-top:1rem">Cloud bucket ingestion</h3>
        <dl class="kv">
          <dt>Enable</dt><dd>Yes</dd>
          <dt>Path prefix</dt><dd>—</dd>
          <dt>File pattern</dt><dd>*.csv</dd>
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
        <h3>Monitoring form / queue mapping</h3>
        <ul style="margin:0;padding-left:1.1rem;font-size:0.9rem;line-height:1.6">
          <li>Patelco Chat QA form v3 — published</li>
          <li>Queue <code>patelco_Web_Chat</code> → scorecard v3</li>
          <li>Queue <code>UHC_Rx_Refill_Chat</code> → Pharmacy form v1.4</li>
        </ul>
        <div class="btn-row" style="margin-top:0.75rem">
          <button class="btn primary" type="button">Modify monitoring form</button>
          <button class="btn" type="button">Map queue</button>
        </div>
      </div>
    </div>`;
}

function renderAnalytics() {
  return `
    <h1 class="page-title">Analytics</h1>
    <p class="page-sub">Reporting basics, advanced dashboards, coaching, intent, and predictive QA insights.</p>
    ${tenantRow()}
    <div class="stat-row">
      <div class="stat"><div class="label">Audits today</div><div class="value">2,048</div></div>
      <div class="stat"><div class="label">Avg score</div><div class="value">86.4</div></div>
      <div class="stat"><div class="label">Agreement</div><div class="value">92%</div></div>
      <div class="stat"><div class="label">Sample quota</div><div class="value">1700</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Reporting basics</h3>
        <table class="table">
          <thead><tr><th>Queue</th><th>Volume</th><th>Pass%</th><th>Overrides</th></tr></thead>
          <tbody>
            <tr><td>patelco_Web_Chat</td><td>820</td><td>84%</td><td>42</td></tr>
            <tr><td>UHC_Rx_Refill_Chat</td><td>610</td><td>79%</td><td>55</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>Intent analytics</h3>
        <table class="table">
          <thead><tr><th>Intent</th><th>Share</th></tr></thead>
          <tbody>
            <tr><td>fraud-unauthorized-charges</td><td>14%</td></tr>
            <tr><td>rx_refill_request</td><td>18%</td></tr>
            <tr><td>address_update</td><td>11%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Agent coaching recommendations</h3>
        <p>Agent R. Patel — disclosure drill · Agent M. Chen — empathy tips</p>
      </div>
      <div class="card">
        <h3>Predictive QA insights</h3>
        <p>Elevated fail risk on Cards chat tomorrow (+18%) from promo script variance.</p>
      </div>
    </div>`;
}

const RENDERERS = {
  overview: renderOverview,
  interactions: renderInteractions,
  "data-import": renderDataImport,
  sampling: renderSampling,
  admin: renderAdmin,
  analytics: renderAnalytics,
};

function setNav(view) {
  document.querySelectorAll(".side-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  quotaBox.hidden = !(view === "sampling" || view === "data-import");
}

function render(view) {
  currentView = view;
  setNav(view);
  workspace.innerHTML = RENDERERS[view]();
  sideNav.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.querySelectorAll(".side-item").forEach((btn) => {
  btn.addEventListener("click", () => render(btn.dataset.view));
});

document.getElementById("collapseNav").addEventListener("click", () => {
  sideNav.classList.toggle("collapsed");
});

workspace.addEventListener("click", (e) => {
  const goto = e.target.closest("[data-goto]");
  if (goto) {
    render(goto.dataset.goto);
    return;
  }

  const ix = e.target.closest("[data-ix]");
  if (ix) {
    selectedIx = ix.dataset.ix;
    render("interactions");
    return;
  }

  const ixTab = e.target.closest("[data-ix-tab]");
  if (ixTab) {
    ixSideTab = ixTab.dataset.ixTab;
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

render("interactions");
