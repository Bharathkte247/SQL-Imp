/* AutoQRA interactive product wireframe — all 31 features */

const FEATURES = [
  // Core (green)
  { id: "audit-forms", name: "Audit forms", tier: "core", view: "audit", desc: "Create and complete QA scorecards with up to 30 parameters per interaction." },
  { id: "dispute-workflows", name: "Dispute workflows", tier: "core", view: "audit", desc: "Agents and supervisors challenge audit outcomes with tracked resolution steps." },
  { id: "manual-qa", name: "Manual QA workflows", tier: "core", view: "audit", desc: "Traditional human-led review queues with assignment, filters, and SLA tracking." },
  { id: "transcript-viewer", name: "Transcript viewer", tier: "core", view: "audit", desc: "Read voice/chat transcripts with speaker labels, timestamps, and evidence highlights." },
  { id: "assist-mode", name: "Auto QRA assist mode", tier: "core", view: "audit", desc: "AI pre-fills scores and evidence while the auditor remains in control." },
  { id: "ai-rationale", name: "AI rationale generation", tier: "core", view: "scoring", desc: "Model-generated explanations tied to transcript evidence for every parameter score." },
  { id: "reporting-basics", name: "Reporting basics", tier: "core", view: "analytics", desc: "Standard volume, score, routing, and override reports for day-to-day QA ops." },
  { id: "multi-lob", name: "Multi-LOB support", tier: "core", view: "data", desc: "Isolate scorecards, queues, and dashboards across lines of business." },
  { id: "audit-trail", name: "Audit Trail and Log", tier: "core", view: "compliance", desc: "Immutable history of scores, overrides, exports, and configuration changes." },
  { id: "human-override", name: "Human override workflow", tier: "core", view: "audit", desc: "Authorized reviewers change AI outcomes with mandatory rationale and before/after capture." },

  // Advanced (yellow)
  { id: "crm-docs", name: "Access to CRM and Documentation", tier: "advanced", view: "data", desc: "Pull customer context and knowledge articles alongside the transcript during review." },
  { id: "calibration", name: "Calibration sessions", tier: "advanced", view: "analytics", desc: "Compare AI vs human scores in facilitated sessions to keep agreement above target." },
  { id: "compliance-alerts", name: "Compliance Detection and Alerts", tier: "advanced", view: "compliance", desc: "Flag missing disclosures, regulated topics, and policy violations with alert routing." },
  { id: "tech-ingestion", name: "Technology Client — Data ingestion", tier: "advanced", view: "data", desc: "Ingest conversation payloads from client contact-center and telephony systems." },
  { id: "autonomous-scoring", name: "Fully autonomous scoring", tier: "advanced", view: "scoring", desc: "Auto-pass / auto-fail high-confidence audits without human touch under policy thresholds." },
  { id: "advanced-dashboards", name: "Advanced dashboards", tier: "advanced", view: "analytics", desc: "Deep drill-downs by queue, agent, parameter, language, channel, and model version." },
  { id: "cloud-integrations", name: "Cloud integrations", tier: "advanced", view: "data", desc: "Connect Azure storage, identity, and enterprise cloud services used by AutoQRA." },
  { id: "csv-ingestion", name: "CSV ingestion", tier: "advanced", view: "data", desc: "Upload batch transcript and metadata files for offline or pilot workloads." },
  { id: "queue-mapping", name: "Queue mapping", tier: "advanced", view: "data", desc: "Map source queues to scorecards, sampling rules, and routing policies." },
  { id: "sentiment", name: "Sentiment analysis", tier: "advanced", view: "scoring", desc: "Detect customer and agent tone shifts and surface them as QA context signals." },

  // Insights (white)
  { id: "coaching", name: "Agent coaching recommendations", tier: "insight", view: "analytics", desc: "Generate coaching actions from recurring defects and behavioral score patterns." },
  { id: "rbac", name: "RBAC", tier: "insight", view: "admin", desc: "Role-based access across audits, configuration, dashboards, and administration." },
  { id: "self-serve", name: "Self-serve Capabilities (Based on RBAC)", tier: "insight", view: "admin", desc: "Let authorized users manage thresholds, exports, and scorecard settings without tickets." },
  { id: "multi-language", name: "Multi-language QA", tier: "insight", view: "scoring", desc: "Score interactions across languages with language-aware rubrics and reporting." },
  { id: "realtime", name: "Real-time auditing", tier: "insight", view: "audit", desc: "Near-real-time audit jobs for escalations, complaints, and regulated interactions." },
  { id: "monitoring-form", name: "New / Modification of the Monitoring Form", tier: "insight", view: "compliance", desc: "Create and version monitoring forms / scorecards with change history." },
  { id: "anomaly", name: "AI anomaly detection", tier: "insight", view: "scoring", desc: "Detect unusual score distributions, override spikes, and outlier interactions." },
  { id: "genai-summaries", name: "GenAI summaries", tier: "insight", view: "scoring", desc: "Generate concise interaction and audit summaries for reviewers and coaches." },
  { id: "intent", name: "Intent analytics", tier: "insight", view: "analytics", desc: "Classify why customers contacted and correlate intent with quality outcomes." },
  { id: "predictive", name: "Predictive QA insights", tier: "insight", view: "analytics", desc: "Forecast risk queues and likely fail patterns before volume builds." },
  { id: "behavioral", name: "Behavioral scoring", tier: "insight", view: "scoring", desc: "Score soft-skill and behavioral dimensions beyond binary compliance checks." },
];

const TIER_LABEL = {
  core: "Core QA",
  advanced: "Advanced / Integration",
  insight: "Insights / Admin",
};

const VIEW_TITLES = {
  overview: "Feature Map",
  audit: "Audit Workspace",
  scoring: "AI Scoring",
  analytics: "Analytics & Coaching",
  data: "Data & Integrations",
  compliance: "Compliance & Forms",
  admin: "Admin & Access",
};

const content = document.getElementById("content");
const crumb = document.getElementById("crumb");
const sidebar = document.getElementById("sidebar");
const drawer = document.getElementById("featureDrawer");
const drawerTitle = document.getElementById("drawerTitle");
const drawerDesc = document.getElementById("drawerDesc");
const drawerTier = document.getElementById("drawerTier");
const drawerScreen = document.getElementById("drawerScreen");
const drawerGo = document.getElementById("drawerGo");
const drawerClose = document.getElementById("drawerClose");

let currentView = "overview";
let selectedFeature = null;

function featuresFor(view) {
  return FEATURES.filter((f) => f.view === view);
}

function featureTiles(list) {
  return list
    .map(
      (f) => `
      <button class="feature-tile ${f.tier}" data-feature="${f.id}" type="button">
        <span class="ft-name">${f.name}</span>
        <span class="ft-meta">${TIER_LABEL[f.tier]} · → ${VIEW_TITLES[f.view]}</span>
      </button>`
    )
    .join("");
}

function renderOverview() {
  const core = FEATURES.filter((f) => f.tier === "core");
  const advanced = FEATURES.filter((f) => f.tier === "advanced");
  const insight = FEATURES.filter((f) => f.tier === "insight");

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>AutoQRA feature map</h1>
          <p>Wireframe coverage for all ${FEATURES.length} capabilities — core QA workflows, advanced integrations, and insight / admin features. Select any tile to open its screen.</p>
        </div>
        <span class="badge">Wireframe v1</span>
      </div>

      <div class="section">
        <div class="stat-row">
          <div class="stat"><div class="label">Total features</div><div class="value">${FEATURES.length}</div></div>
          <div class="stat"><div class="label">Core QA</div><div class="value">${core.length}</div></div>
          <div class="stat"><div class="label">Advanced</div><div class="value">${advanced.length}</div></div>
          <div class="stat"><div class="label">Insights</div><div class="value">${insight.length}</div></div>
        </div>
        <div class="callout">Color coding mirrors the product feature matrix: green = core operational QA, yellow = advanced / integration, white = analytics &amp; admin.</div>
      </div>

      <div class="section">
        <h2>Core QA</h2>
        <p class="hint">Audit execution, human oversight, and foundational reporting.</p>
        <div class="feature-grid">${featureTiles(core)}</div>
      </div>
      <div class="section">
        <h2>Advanced / Integration</h2>
        <p class="hint">Autonomous scoring, data feeds, cloud connectivity, and calibration.</p>
        <div class="feature-grid">${featureTiles(advanced)}</div>
      </div>
      <div class="section">
        <h2>Insights / Admin</h2>
        <p class="hint">Coaching, RBAC, multi-language, GenAI insights, and form administration.</p>
        <div class="feature-grid">${featureTiles(insight)}</div>
      </div>
    </section>`;
}

function renderAudit() {
  const feats = featuresFor("audit");
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>Audit Workspace</h1>
          <p>Primary reviewer surface: forms, transcript, assist mode, override, disputes, manual queues, and real-time jobs.</p>
        </div>
        <span class="badge">7 features</span>
      </div>

      <div class="section">
        <div class="feature-grid">${featureTiles(feats)}</div>
      </div>

      <div class="section">
        <h2>Review canvas</h2>
        <p class="hint">Wireframe of a single interaction under Auto QRA assist mode with human override.</p>
        <div class="layout-2">
          <div class="wire-box">
            <h3>Transcript viewer <span class="wire-label">F04</span></h3>
            <div class="transcript">
              <div class="turn"><span class="who">Agent 00:12</span><br/>Thank you for calling Meridian Bank, this is Priya. How can I help today?</div>
              <div class="turn"><span class="who">Customer 00:18</span><br/>I need to update my mailing address before my statement closes.</div>
              <div class="turn"><span class="who">Agent 00:26</span><br/>Absolutely. For security, may I verify the last four of your SSN and date of birth?</div>
              <div class="turn"><span class="who">Customer 00:34</span><br/>Sure — and please confirm when the change takes effect.</div>
              <div class="turn"><span class="who">Agent 00:48</span><br/>I've updated the address on file. <span class="hit">You'll receive confirmation by email within one business day.</span></div>
            </div>
            <div class="btn-row">
              <button class="btn" type="button">Jump to evidence</button>
              <button class="btn" type="button">Mask PII</button>
              <button class="btn primary" type="button">Real-time mode</button>
            </div>
          </div>

          <div class="wire-box">
            <h3>Audit form + Assist mode <span class="wire-label">F01 · F05</span></h3>
            <ul class="list">
              <li><span>Greeting &amp; authentication</span><span class="tag ok">Pass · 98%</span></li>
              <li><span>Disclosure completeness</span><span class="tag warn">Review · 71%</span></li>
              <li><span>Resolution confirmation</span><span class="tag ok">Pass · 94%</span></li>
              <li><span>Empathy / soft skills</span><span class="tag ok">Pass · 88%</span></li>
            </ul>
            <div class="callout" style="margin-top:0.75rem">Assist mode pre-scored 27/30 parameters. 3 routed for human confirmation.</div>
            <div class="btn-row">
              <button class="btn primary" type="button">Confirm scores</button>
              <button class="btn" type="button">Human override…</button>
              <button class="btn" type="button">Open dispute</button>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="layout-3">
          <div class="wire-box">
            <h3>Manual QA queue <span class="wire-label">F03</span></h3>
            <ul class="list">
              <li><span>AUD-48291 · Retail</span><span class="tag warn">Due 2h</span></li>
              <li><span>AUD-48277 · Cards</span><span class="tag">Assigned</span></li>
              <li><span>AUD-48260 · Wealth</span><span class="tag bad">SLA risk</span></li>
            </ul>
          </div>
          <div class="wire-box">
            <h3>Human override <span class="wire-label">F10</span></h3>
            <div class="form-grid">
              <div class="field"><label>Parameter</label><select><option>Disclosure completeness</option></select></div>
              <div class="field"><label>New score</label><select><option>Pass</option><option>Fail</option><option>N/A</option></select></div>
              <div class="field"><label>Rationale (required)</label><textarea placeholder="Explain why AI score is overridden…"></textarea></div>
            </div>
          </div>
          <div class="wire-box">
            <h3>Dispute workflow <span class="wire-label">F02</span></h3>
            <div class="timeline">
              <div class="event"><div class="time">09:14</div><div class="body">Agent filed dispute — “Disclosure was given at 00:48”.</div></div>
              <div class="event"><div class="time">09:40</div><div class="body">QA Lead reviewing evidence highlight.</div></div>
              <div class="event"><div class="time">Pending</div><div class="body">Resolution options: uphold / revise / calibrate.</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function renderScoring() {
  const feats = featuresFor("scoring");
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>AI Scoring</h1>
          <p>Autonomous scoring, rationale, sentiment, GenAI summaries, behavioral scores, anomalies, and multi-language QA.</p>
        </div>
        <span class="badge">7 features</span>
      </div>
      <div class="section"><div class="feature-grid">${featureTiles(feats)}</div></div>

      <div class="section">
        <div class="layout-2">
          <div class="wire-box">
            <h3>Fully autonomous scoring <span class="wire-label">F15</span></h3>
            <div class="stat-row" style="margin-bottom:0.65rem">
              <div class="stat"><div class="label">Auto-pass</div><div class="value">72%</div></div>
              <div class="stat"><div class="label">Auto-fail</div><div class="value">11%</div></div>
              <div class="stat"><div class="label">Human route</div><div class="value">17%</div></div>
              <div class="stat"><div class="label">Conf. thresh</div><div class="value">0.86</div></div>
            </div>
            <p class="hint" style="margin:0">Routing policy considers score, confidence, hallucination flags, and regulated topics.</p>
          </div>
          <div class="wire-box">
            <h3>AI rationale generation <span class="wire-label">F06</span></h3>
            <div class="callout">Parameter: Disclosure completeness — Fail proposed (conf 0.71)</div>
            <p style="margin:0;font-size:0.9rem;line-height:1.45">Model cites missing “effective date” wording. Evidence span tagged at 00:48; reviewer can accept or override.</p>
            <div class="btn-row"><button class="btn" type="button">Show prompt version</button><button class="btn" type="button">Flag hallucination</button></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="layout-3">
          <div class="wire-box">
            <h3>Sentiment analysis <span class="wire-label">F20</span></h3>
            <dl class="kv">
              <dt>Customer</dt><dd>Neutral → Positive</dd>
              <dt>Agent</dt><dd>Calm / professional</dd>
              <dt>Risk spike</dt><dd>None</dd>
            </dl>
            <div class="score-bar"><span style="width:68%"></span></div>
          </div>
          <div class="wire-box">
            <h3>Behavioral scoring <span class="wire-label">F31</span></h3>
            <ul class="list">
              <li><span>Empathy</span><span>4.2 / 5</span></li>
              <li><span>Ownership</span><span>4.6 / 5</span></li>
              <li><span>Clarity</span><span>3.9 / 5</span></li>
            </ul>
          </div>
          <div class="wire-box">
            <h3>GenAI summaries <span class="wire-label">F28</span></h3>
            <p style="margin:0;font-size:0.88rem;line-height:1.45">Customer requested address update. Agent authenticated, completed change, confirmed email follow-up. One disclosure parameter needs review.</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="layout-2">
          <div class="wire-box">
            <h3>AI anomaly detection <span class="wire-label">F27</span></h3>
            <ul class="list">
              <li><span>Override rate ↑ Cards LOB</span><span class="tag warn">Anomaly</span></li>
              <li><span>Score drift · Prompt v14</span><span class="tag warn">Watch</span></li>
              <li><span>Hallucination rate</span><span class="tag ok">2.1%</span></li>
            </ul>
          </div>
          <div class="wire-box">
            <h3>Multi-language QA <span class="wire-label">F24</span></h3>
            <table class="table">
              <thead><tr><th>Language</th><th>Audits</th><th>Agreement</th></tr></thead>
              <tbody>
                <tr><td>English</td><td>1,240</td><td>93%</td></tr>
                <tr><td>Spanish</td><td>410</td><td>91%</td></tr>
                <tr><td>French</td><td>180</td><td>89%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>`;
}

function renderAnalytics() {
  const feats = featuresFor("analytics");
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>Analytics &amp; Coaching</h1>
          <p>Reporting basics, advanced dashboards, calibration, coaching recommendations, intent analytics, and predictive insights.</p>
        </div>
        <span class="badge">6 features</span>
      </div>
      <div class="section"><div class="feature-grid">${featureTiles(feats)}</div></div>

      <div class="section">
        <h2>Advanced dashboards <span class="wire-label">F16</span></h2>
        <div class="tabs">
          <button class="tab active" type="button">Ops</button>
          <button class="tab" type="button">Quality</button>
          <button class="tab" type="button">Intent</button>
          <button class="tab" type="button">Predictive</button>
        </div>
        <div class="stat-row">
          <div class="stat"><div class="label">Audits today</div><div class="value">2,048</div></div>
          <div class="stat"><div class="label">Avg score</div><div class="value">86.4</div></div>
          <div class="stat"><div class="label">Agreement</div><div class="value">92%</div></div>
          <div class="stat"><div class="label">Backlog</div><div class="value">64</div></div>
        </div>
        <div class="layout-2">
          <div class="wire-box">
            <h3>Reporting basics <span class="wire-label">F07</span></h3>
            <table class="table">
              <thead><tr><th>Queue</th><th>Volume</th><th>Pass%</th><th>Overrides</th></tr></thead>
              <tbody>
                <tr><td>Retail voice</td><td>820</td><td>84%</td><td>42</td></tr>
                <tr><td>Cards chat</td><td>610</td><td>79%</td><td>55</td></tr>
                <tr><td>Wealth</td><td>210</td><td>91%</td><td>9</td></tr>
              </tbody>
            </table>
          </div>
          <div class="wire-box">
            <h3>Intent analytics <span class="wire-label">F29</span></h3>
            <ul class="list">
              <li><span>Address / profile update</span><span>22%</span></li>
              <li><span>Payment arrangement</span><span>18%</span></li>
              <li><span>Fraud / dispute</span><span>14%</span></li>
              <li><span>Product inquiry</span><span>11%</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="layout-3">
          <div class="wire-box">
            <h3>Calibration sessions <span class="wire-label">F12</span></h3>
            <p class="hint">Session: Weekly Cards calibration · 12 audits</p>
            <ul class="list">
              <li><span>AI vs Lead agreement</span><span>90%</span></li>
              <li><span>Parameter focus</span><span>Disclosures</span></li>
              <li><button class="linkish" type="button">Start session</button><span class="tag">Scheduled</span></li>
            </ul>
          </div>
          <div class="wire-box">
            <h3>Coaching recommendations <span class="wire-label">F21</span></h3>
            <ul class="list">
              <li><span>Agent R. Patel</span><span class="tag warn">Disclosure drill</span></li>
              <li><span>Agent M. Chen</span><span class="tag">Empathy tips</span></li>
              <li><span>Team Cards-B</span><span class="tag">Hold time</span></li>
            </ul>
          </div>
          <div class="wire-box">
            <h3>Predictive QA insights <span class="wire-label">F30</span></h3>
            <p style="margin:0 0 0.5rem;font-size:0.88rem;line-height:1.45">Model forecasts elevated fail risk on Cards chat tomorrow (+18%) driven by new promo script variance.</p>
            <button class="btn primary" type="button">Open risk plan</button>
          </div>
        </div>
      </div>
    </section>`;
}

function renderData() {
  const feats = featuresFor("data");
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>Data &amp; Integrations</h1>
          <p>CRM/docs context, technology client ingestion, CSV upload, cloud integrations, queue mapping, and multi-LOB support.</p>
        </div>
        <span class="badge">6 features</span>
      </div>
      <div class="section"><div class="feature-grid">${featureTiles(feats)}</div></div>

      <div class="section">
        <div class="layout-split">
          <div class="wire-box">
            <h3>Sources</h3>
            <ul class="list">
              <li><span>CRM connector</span><span class="tag ok">Live</span></li>
              <li><span>Tech client feed</span><span class="tag ok">Live</span></li>
              <li><span>CSV batches</span><span class="tag">Ready</span></li>
              <li><span>Cloud storage</span><span class="tag ok">Azure</span></li>
            </ul>
          </div>
          <div>
            <div class="layout-2">
              <div class="wire-box">
                <h3>Access to CRM &amp; Documentation <span class="wire-label">F11</span></h3>
                <dl class="kv">
                  <dt>Customer</dt><dd>Jordan Lee · ****4912</dd>
                  <dt>Product</dt><dd>Everyday Checking</dd>
                  <dt>Open cases</dt><dd>1 · Address change</dd>
                  <dt>KB article</dt><dd>ADR-221 Address update script</dd>
                </dl>
              </div>
              <div class="wire-box">
                <h3>Technology Client — Data ingestion <span class="wire-label">F14</span></h3>
                <ul class="list">
                  <li><span>Last batch</span><span>08:00 · 2,104 recs</span></li>
                  <li><span>Validation errors</span><span class="tag ok">0.4%</span></li>
                  <li><span>Duplicates blocked</span><span>17</span></li>
                </ul>
              </div>
            </div>
            <div class="layout-2" style="margin-top:0.9rem">
              <div class="wire-box">
                <h3>CSV ingestion <span class="wire-label">F18</span></h3>
                <div class="form-grid">
                  <div class="field"><label>Upload file</label><input type="text" value="pilot_transcripts_week36.csv" readonly /></div>
                  <div class="field"><label>LOB mapping</label><select><option>Retail Banking</option><option>Cards</option></select></div>
                </div>
                <div class="btn-row"><button class="btn primary" type="button">Validate &amp; ingest</button></div>
              </div>
              <div class="wire-box">
                <h3>Cloud integrations <span class="wire-label">F17</span></h3>
                <ul class="list">
                  <li><span>Azure Blob Storage</span><span class="tag ok">Connected</span></li>
                  <li><span>Entra ID SSO</span><span class="tag ok">Connected</span></li>
                  <li><span>Superset reporting</span><span class="tag ok">Connected</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="layout-2">
          <div class="wire-box">
            <h3>Queue mapping <span class="wire-label">F19</span></h3>
            <table class="table">
              <thead><tr><th>Source queue</th><th>Scorecard</th><th>Routing</th></tr></thead>
              <tbody>
                <tr><td>RET_VOICE_GEN</td><td>Retail v3.2</td><td>Hybrid</td></tr>
                <tr><td>CARD_CHAT_PROMO</td><td>Cards Promo v1.4</td><td>Human-heavy</td></tr>
                <tr><td>WLTH_SECURE</td><td>Wealth Comp v2.0</td><td>Compliance first</td></tr>
              </tbody>
            </table>
          </div>
          <div class="wire-box">
            <h3>Multi-LOB support <span class="wire-label">F08</span></h3>
            <div class="tabs">
              <button class="tab active" type="button">Retail</button>
              <button class="tab" type="button">Cards</button>
              <button class="tab" type="button">Wealth</button>
              <button class="tab" type="button">Collections</button>
            </div>
            <p class="hint">Each LOB keeps isolated scorecards, queues, dashboards, and RBAC scopes.</p>
          </div>
        </div>
      </div>
    </section>`;
}

function renderCompliance() {
  const feats = featuresFor("compliance");
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>Compliance &amp; Forms</h1>
          <p>Compliance detection, alerts, immutable audit trail, and monitoring form create / modify workflows.</p>
        </div>
        <span class="badge">3 features</span>
      </div>
      <div class="section"><div class="feature-grid">${featureTiles(feats)}</div></div>

      <div class="section">
        <div class="layout-2">
          <div class="wire-box">
            <h3>Compliance Detection and Alerts <span class="wire-label">F13</span></h3>
            <ul class="list">
              <li><span>Missing mini-Miranda</span><span class="tag bad">Alert</span></li>
              <li><span>Regulated product pitch</span><span class="tag warn">Watch</span></li>
              <li><span>Recording disclosure OK</span><span class="tag ok">Clear</span></li>
            </ul>
            <div class="btn-row"><button class="btn primary" type="button">Route to Compliance</button></div>
          </div>
          <div class="wire-box">
            <h3>Audit Trail and Log <span class="wire-label">F09</span></h3>
            <div class="timeline">
              <div class="event"><div class="time">08:02</div><div class="body">Ingestion completed · batch B-9921 · 2,104 conversations</div></div>
              <div class="event"><div class="time">08:11</div><div class="body">Autonomous scoring · model 7B-q · scorecard Retail v3.2</div></div>
              <div class="event"><div class="time">09:18</div><div class="body">Override by S. Miles · Disclosure completeness Fail → Pass</div></div>
              <div class="event"><div class="time">09:41</div><div class="body">Export approved · compliance pack CP-441</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="wire-box">
          <h3>New / Modification of the Monitoring Form <span class="wire-label">F26</span></h3>
          <div class="layout-2">
            <div class="form-grid">
              <div class="field"><label>Form name</label><input value="Retail Voice Monitoring v3.3" /></div>
              <div class="field"><label>Parameters</label><input value="30" /></div>
              <div class="field"><label>Change type</label><select><option>Modify existing</option><option>Create new</option></select></div>
              <div class="field"><label>Change notes</label><textarea>Align disclosure wording with legal bulletin LB-118.</textarea></div>
            </div>
            <div>
              <p class="hint">Versioned scorecards — drafts require QA Manager + Compliance approval before publish.</p>
              <ul class="list">
                <li><span>v3.2 · Published</span><span class="tag ok">Live</span></li>
                <li><span>v3.3 · Draft</span><span class="tag warn">In review</span></li>
                <li><span>v3.1 · Archived</span><span class="tag">Historic</span></li>
              </ul>
              <div class="btn-row">
                <button class="btn" type="button">Save draft</button>
                <button class="btn primary" type="button">Submit for approval</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function renderAdmin() {
  const feats = featuresFor("admin");
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h1>Admin &amp; Access</h1>
          <p>RBAC and self-serve capabilities gated by role — thresholds, exports, and configuration without engineering tickets.</p>
        </div>
        <span class="badge">2 features</span>
      </div>
      <div class="section"><div class="feature-grid">${featureTiles(feats)}</div></div>

      <div class="section">
        <div class="layout-2">
          <div class="wire-box">
            <h3>RBAC <span class="wire-label">F22</span></h3>
            <table class="table">
              <thead><tr><th>Role</th><th>Audits</th><th>Override</th><th>Config</th><th>Admin</th></tr></thead>
              <tbody>
                <tr><td>QA Analyst</td><td>✓</td><td>✓</td><td>—</td><td>—</td></tr>
                <tr><td>QA Manager</td><td>✓</td><td>✓</td><td>✓</td><td>—</td></tr>
                <tr><td>Compliance</td><td>✓</td><td>limited</td><td>forms</td><td>—</td></tr>
                <tr><td>System Admin</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                <tr><td>Executive viewer</td><td>agg.</td><td>—</td><td>—</td><td>—</td></tr>
              </tbody>
            </table>
          </div>
          <div class="wire-box">
            <h3>Self-serve (based on RBAC) <span class="wire-label">F23</span></h3>
            <ul class="list">
              <li><span>Adjust routing thresholds</span><span class="tag">QA Manager</span></li>
              <li><span>Export audit packs</span><span class="tag">Compliance</span></li>
              <li><span>Map new source queue</span><span class="tag">QA Manager</span></li>
              <li><span>Disable inference kill-switch</span><span class="tag">Admin</span></li>
            </ul>
            <div class="btn-row"><button class="btn primary" type="button">Open self-serve console</button></div>
          </div>
        </div>
      </div>
    </section>`;
}

const RENDERERS = {
  overview: renderOverview,
  audit: renderAudit,
  scoring: renderScoring,
  analytics: renderAnalytics,
  data: renderData,
  compliance: renderCompliance,
  admin: renderAdmin,
};

function setActiveNav(view) {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

function render(view) {
  currentView = view;
  content.innerHTML = RENDERERS[view]();
  crumb.textContent = `AutoQRA / ${VIEW_TITLES[view]}`;
  setActiveNav(view);
  sidebar.classList.remove("open");
  content.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openFeature(id) {
  const feature = FEATURES.find((f) => f.id === id);
  if (!feature) return;
  selectedFeature = feature;
  drawerTier.textContent = TIER_LABEL[feature.tier];
  drawerTitle.textContent = feature.name;
  drawerDesc.textContent = feature.desc;
  drawerScreen.textContent = VIEW_TITLES[feature.view];
  drawer.hidden = false;
}

function closeDrawer() {
  drawer.hidden = true;
  selectedFeature = null;
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => render(btn.dataset.view));
});

document.getElementById("menuToggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

content.addEventListener("click", (e) => {
  const tile = e.target.closest("[data-feature]");
  if (tile) openFeature(tile.dataset.feature);

  const tab = e.target.closest(".tab");
  if (tab) {
    const group = tab.parentElement;
    group.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  }
});

drawerClose.addEventListener("click", closeDrawer);
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});
drawerGo.addEventListener("click", () => {
  if (!selectedFeature) return;
  const view = selectedFeature.view;
  closeDrawer();
  render(view);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !drawer.hidden) closeDrawer();
});

render("overview");
