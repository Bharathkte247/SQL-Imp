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
  { id: "calibration", name: "Calibration sessions", tier: "advanced", view: "admin" },
  { id: "compliance-alerts", name: "Compliance Detection and Alerts", tier: "advanced", view: "interactions" },
  { id: "tech-ingestion", name: "Technology Client — Data ingestion", tier: "advanced", view: "data-import" },
  { id: "autonomous-scoring", name: "Fully autonomous scoring", tier: "advanced", view: "sampling" },
  { id: "advanced-dashboards", name: "Advanced dashboards", tier: "advanced", view: "reporting" },
  { id: "cloud-integrations", name: "Cloud integrations", tier: "advanced", view: "data-import" },
  { id: "csv-ingestion", name: "CSV ingestion", tier: "advanced", view: "data-import" },
  { id: "queue-mapping", name: "Queue mapping", tier: "advanced", view: "admin" },
  { id: "sentiment", name: "Sentiment analysis", tier: "advanced", view: "admin" },
  { id: "coaching", name: "Agent coaching recommendations", tier: "insight", view: "coaching" },
  { id: "rbac", name: "RBAC", tier: "insight", view: "admin" },
  { id: "self-serve", name: "Self-serve Capabilities (Based on RBAC)", tier: "insight", view: "admin" },
  { id: "multi-language", name: "Multi-language QA", tier: "insight", view: "interactions" },
  { id: "realtime", name: "Real-time auditing", tier: "insight", view: "interactions" },
  { id: "monitoring-form", name: "New / Modification of the Monitoring Form", tier: "insight", view: "admin" },
  { id: "anomaly", name: "AI anomaly detection", tier: "insight", view: "admin" },
  { id: "genai-summaries", name: "GenAI summaries", tier: "insight", view: "interactions" },
  { id: "intent", name: "Intent analytics", tier: "insight", view: "admin" },
  { id: "predictive", name: "Predictive QA insights", tier: "insight", view: "admin" },
  { id: "behavioral", name: "Behavioral scoring", tier: "insight", view: "interactions" },
];

const AUDIT_STATUSES = [
  "Not Audited",
  "LLM Audited",
  "QA Reviewed",
  "Pending Dispute",
  "Complete",
];

const INTERACTIONS = [
  {
    id: "na-001-4e6d-4d1f-a8a8-8ca18a4601aa",
    short: "na-001…01aa",
    agent: "k.lee",
    agentName: "K. Lee",
    duration: "4m 05s",
    queue: "247client1_Web_Chat",
    lob: "Retail",
    channel: "ude",
    source: "api_pull",
    intent: "balance_inquiry",
    sentiment: "neutral",
    escalated: false,
    status: "Not Audited",
    auditMode: "none",
    score: "—",
    date: "2026-09-10",
  },
  {
    id: "na-002-91b2-4a11-9c44-77f0aa0011bb",
    short: "na-002…11bb",
    agent: "s.okonkwo",
    agentName: "S. Okonkwo",
    duration: "3m 12s",
    queue: "247client1_Web_Chat",
    lob: "Test_Lob",
    channel: "ude",
    source: "csv",
    intent: "password_reset",
    sentiment: "positive",
    escalated: false,
    status: "Not Audited",
    auditMode: "none",
    score: "—",
    date: "2026-09-09",
  },
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
    status: "LLM Audited",
    auditMode: "llm",
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
    status: "LLM Audited",
    auditMode: "llm",
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
    status: "QA Reviewed",
    auditMode: "hybrid",
    score: "84",
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
    status: "QA Reviewed",
    auditMode: "manual",
    score: "71",
    date: "2026-09-08",
  },
  {
    id: "pd-010-3344-4aa0-9b12-aabbccddee01",
    short: "pd-010…ee01",
    agent: "l.ramirez",
    agentName: "L. Ramirez",
    duration: "5m 50s",
    queue: "247client1_Web_Chat",
    lob: "Retail",
    channel: "ude",
    source: "api_pull",
    intent: "fee_waiver",
    sentiment: "negative",
    escalated: false,
    status: "Pending Dispute",
    auditMode: "hybrid",
    score: "68",
    date: "2026-09-08",
  },
  {
    id: "pd-011-3344-4aa0-9b12-aabbccddee02",
    short: "pd-011…ee02",
    agent: "h.cho",
    agentName: "H. Cho",
    duration: "4m 22s",
    queue: "UHC_Rx_Refill_Chat",
    lob: "Commercial Pharmacy",
    channel: "ude",
    source: "csv",
    intent: "rx_refill_request",
    sentiment: "neutral",
    escalated: false,
    status: "Pending Dispute",
    auditMode: "manual",
    score: "74",
    date: "2026-09-07",
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
    status: "Complete",
    auditMode: "hybrid",
    score: "95",
    date: "2026-09-07",
  },
  {
    id: "cp-020-4e6d-4d1f-a8a8-8ca18a4602ff",
    short: "cp-020…02ff",
    agent: "t.morales",
    agentName: "T. Morales",
    duration: "3m 40s",
    queue: "247client1_Web_Chat",
    lob: "Retail",
    channel: "ude",
    source: "api_pull",
    intent: "product_inquiry",
    sentiment: "positive",
    escalated: false,
    status: "Complete",
    auditMode: "manual",
    score: "90",
    date: "2026-09-06",
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
    id: "c1",
    agent: "R. Patel",
    lob: "Commercial Pharmacy",
    queue: "UHC_Rx_Refill_Chat",
    audits: 48,
    fails: 11,
    severity: "high",
    opportunity: "Disclosure completeness failing on 23% of audited chats. Focus coaching on promo / refill disclosure script.",
    theme: "Disclosures",
    sampleAudits: [
      { id: "AUD-8821", score: 62, defect: "Missing refill disclosure", date: "2026-09-09" },
      { id: "AUD-8790", score: 68, defect: "Incomplete promo wording", date: "2026-09-08" },
      { id: "AUD-8702", score: 71, defect: "Disclosure late in chat", date: "2026-09-06" },
    ],
  },
  {
    id: "c2",
    agent: "M. Chen",
    lob: "Retail",
    queue: "247client1_Web_Chat",
    audits: 36,
    fails: 6,
    severity: "med",
    opportunity: "Empathy / rapport misses on escalated fraud intents. Pair with soft-skills calibration pack.",
    theme: "Soft skills",
    sampleAudits: [
      { id: "AUD-8611", score: 74, defect: "Weak empathy opener", date: "2026-09-09" },
      { id: "AUD-8550", score: 70, defect: "Missed rapport on escalate", date: "2026-09-07" },
    ],
  },
  {
    id: "c3",
    agent: "A. Nguyen",
    lob: "Retail",
    queue: "247client1_Web_Chat",
    audits: 29,
    fails: 9,
    severity: "high",
    opportunity: "Payment arrangement closure language incomplete on 9 of 29 audits. Recommend guided close checklist.",
    theme: "Resolution",
    sampleAudits: [
      { id: "AUD-8499", score: 58, defect: "No payment confirm", date: "2026-09-08" },
      { id: "AUD-8412", score: 65, defect: "Close skipped", date: "2026-09-05" },
      { id: "AUD-8388", score: 60, defect: "Partial arrangement summary", date: "2026-09-04" },
    ],
  },
  {
    id: "c4",
    agent: "Team Cards-B",
    lob: "Cards",
    queue: "247client1_Web_Chat",
    audits: 120,
    fails: 14,
    severity: "med",
    opportunity: "Team-level hold-time empathy dips after minute 4. Share best-call examples from 247client1 Web Chat.",
    theme: "Team pattern",
    sampleAudits: [
      { id: "AUD-8301", score: 77, defect: "Hold empathy drop", date: "2026-09-09" },
      { id: "AUD-8290", score: 79, defect: "Long silent hold", date: "2026-09-08" },
    ],
  },
  {
    id: "c5",
    agent: "S. Okonkwo",
    lob: "Test_Lob",
    queue: "247client1_Web_Chat",
    audits: 22,
    fails: 2,
    severity: "low",
    opportunity: "Strong scores; nominate as calibration peer reviewer for Soft Skills section.",
    theme: "Peer coach",
    sampleAudits: [
      { id: "AUD-8200", score: 94, defect: "Minor clarity note", date: "2026-09-07" },
    ],
  },
  {
    id: "c6",
    agent: "J. Brooks",
    lob: "Medicaid Pharmacy",
    queue: "UHC_Refill_Status",
    audits: 41,
    fails: 8,
    severity: "high",
    opportunity: "Status update scripts miss next-step confirmation. Coach on closing loop with member.",
    theme: "Resolution",
    sampleAudits: [
      { id: "AUD-8122", score: 66, defect: "No next-step confirm", date: "2026-09-09" },
      { id: "AUD-8101", score: 69, defect: "Status only, no CTA", date: "2026-09-06" },
    ],
  },
  {
    id: "c7",
    agent: "L. Ramirez",
    lob: "Retail",
    queue: "247client1_Web_Chat",
    audits: 33,
    fails: 5,
    severity: "med",
    opportunity: "Authentication steps rushed; 5 audits missed secondary verification question.",
    theme: "Compliance",
    sampleAudits: [
      { id: "AUD-8055", score: 72, defect: "Skipped 2nd verify", date: "2026-09-08" },
      { id: "AUD-8010", score: 75, defect: "Partial auth", date: "2026-09-05" },
    ],
  },
  {
    id: "c8",
    agent: "K. Singh",
    lob: "Commercial Pharmacy",
    queue: "UHC_Rx_Refill_Chat",
    audits: 27,
    fails: 4,
    severity: "med",
    opportunity: "Tone shifts negative under refill delay complaints. Soft-skills refresh recommended.",
    theme: "Soft skills",
    sampleAudits: [
      { id: "AUD-7988", score: 73, defect: "Curt reply on delay", date: "2026-09-07" },
    ],
  },
  {
    id: "c9",
    agent: "P. Ellis",
    lob: "Cards",
    queue: "247client1_Web_Chat",
    audits: 19,
    fails: 7,
    severity: "high",
    opportunity: "Dispute intake misses required case number readback on 7 audits.",
    theme: "Disclosures",
    sampleAudits: [
      { id: "AUD-7901", score: 55, defect: "No case readback", date: "2026-09-09" },
      { id: "AUD-7880", score: 61, defect: "Incomplete dispute script", date: "2026-09-08" },
    ],
  },
  {
    id: "c10",
    agent: "T. Morales",
    lob: "Retail",
    queue: "247client1_Web_Chat",
    audits: 25,
    fails: 3,
    severity: "low",
    opportunity: "Minor clarity gaps on product upsell; light coaching only.",
    theme: "Clarity",
    sampleAudits: [
      { id: "AUD-7812", score: 84, defect: "Unclear product name", date: "2026-09-06" },
    ],
  },
  {
    id: "c11",
    agent: "H. Cho",
    lob: "Commercial Pharmacy",
    queue: "UHC_Rx_Refill_Chat",
    audits: 38,
    fails: 6,
    severity: "med",
    opportunity: "Transfer announcements missing on warm handoffs to specialty queue.",
    theme: "Resolution",
    sampleAudits: [
      { id: "AUD-7750", score: 70, defect: "Silent transfer", date: "2026-09-08" },
      { id: "AUD-7722", score: 73, defect: "No transfer reason", date: "2026-09-05" },
    ],
  },
  {
    id: "c12",
    agent: "Team Retail-A",
    lob: "Retail",
    queue: "247client1_Web_Chat",
    audits: 95,
    fails: 10,
    severity: "med",
    opportunity: "Team trend: greeting personalization below target. Share top-quartile examples.",
    theme: "Team pattern",
    sampleAudits: [
      { id: "AUD-7701", score: 78, defect: "Generic greeting", date: "2026-09-09" },
      { id: "AUD-7690", score: 80, defect: "No name use", date: "2026-09-07" },
    ],
  },
];

// Normalize team vs agent coaching records
COACHING.forEach((c) => {
  const isTeam = String(c.agent).startsWith("Team ");
  c.level = isTeam ? "team" : "agent";
  c.team = isTeam
    ? c.agent
    : c.lob === "Cards"
      ? "Team Cards-B"
      : c.lob.includes("Pharmacy")
        ? "Team Pharmacy"
        : c.lob === "Test_Lob"
          ? "Team Test"
          : "Team Retail-A";
  c.monitoring = c.audits; // number of monitoring forms / audits
});

// Extra team rows for Team tab coverage
COACHING.push(
  {
    id: "c13",
    agent: "Team Pharmacy",
    team: "Team Pharmacy",
    level: "team",
    lob: "Commercial Pharmacy",
    queue: "UHC_Rx_Refill_Chat",
    audits: 86,
    monitoring: 86,
    fails: 12,
    severity: "high",
    opportunity: "Team-wide disclosure misses on refill scripts. Run huddle with calibrated examples.",
    theme: "Disclosures",
    sampleAudits: [
      { id: "AUD-7601", score: 64, defect: "Team disclosure gap", date: "2026-09-09" },
      { id: "AUD-7588", score: 67, defect: "Script drift", date: "2026-09-08" },
    ],
  },
  {
    id: "c14",
    agent: "Team Test",
    team: "Team Test",
    level: "team",
    lob: "Test_Lob",
    queue: "247client1_Web_Chat",
    audits: 40,
    monitoring: 40,
    fails: 3,
    severity: "low",
    opportunity: "Stable team scores; use as control group for calibration.",
    theme: "Peer coach",
    sampleAudits: [
      { id: "AUD-7500", score: 91, defect: "Minor clarity", date: "2026-09-07" },
    ],
  }
);

// Period-wide coaching themes — generic for all agents (Overall Coaching tab)
const OVERALL_THEMES = [
  {
    id: "ot1",
    theme: "Disclosure completeness",
    priority: "high",
    period: "MTD",
    audited: 1840,
    defectRate: "18%",
    agentsImpacted: "All queues",
    coaching:
      "Org-wide coaching: reinforce refill / promo disclosure script at greeting + close. Apply to every agent this period — not role-specific.",
    actions: ["Publish updated disclosure checklist", "Add disclosure quiz to weekly huddle", "Flag missed disclosures in AutoQRA feed"],
    sampleAudits: [
      { id: "AUD-8821", queue: "UHC_Rx_Refill_Chat", score: 62, defect: "Missing refill disclosure", date: "2026-09-09" },
      { id: "AUD-8790", queue: "247client1_Web_Chat", score: 68, defect: "Incomplete promo wording", date: "2026-09-08" },
      { id: "AUD-8702", queue: "UHC_Rx_Refill_Chat", score: 71, defect: "Disclosure late in chat", date: "2026-09-06" },
    ],
  },
  {
    id: "ot2",
    theme: "Empathy on escalate",
    priority: "med",
    period: "MTD",
    audited: 1840,
    defectRate: "11%",
    agentsImpacted: "All agents",
    coaching:
      "Generic soft-skills pack for all agents: empathy opener before escalate, acknowledge frustration, confirm next step. Same pack for every LOB this period.",
    actions: ["Roll out Soft Skills calibration pack v3", "Coach-the-coach session for all TLs", "Spot-check escalate turns in sampling"],
    sampleAudits: [
      { id: "AUD-8611", queue: "247client1_Web_Chat", score: 74, defect: "Weak empathy opener", date: "2026-09-09" },
      { id: "AUD-8550", queue: "247client1_Web_Chat", score: 70, defect: "Missed rapport on escalate", date: "2026-09-07" },
    ],
  },
  {
    id: "ot3",
    theme: "Resolution close loop",
    priority: "high",
    period: "MTD",
    audited: 1840,
    defectRate: "14%",
    agentsImpacted: "All queues",
    coaching:
      "Period theme for every agent: confirm payment / refill / dispute next step before end. Use the same close checklist across teams.",
    actions: ["Mandate close checklist in monitoring form", "Share 3 gold-standard closes", "Track close-loop pass rate daily"],
    sampleAudits: [
      { id: "AUD-8499", queue: "247client1_Web_Chat", score: 58, defect: "No payment confirm", date: "2026-09-08" },
      { id: "AUD-8122", queue: "UHC_Refill_Status", score: 66, defect: "No next-step confirm", date: "2026-09-09" },
    ],
  },
  {
    id: "ot4",
    theme: "Authentication thoroughness",
    priority: "med",
    period: "MTD",
    audited: 1840,
    defectRate: "9%",
    agentsImpacted: "All agents",
    coaching:
      "Org standard: complete primary + secondary verification before account actions. Applies to every agent and queue in this period.",
    actions: ["Pin auth script in agent desktop", "Fail auto-QA if 2nd verify missing", "Weekly auth defect digest to all TLs"],
    sampleAudits: [
      { id: "AUD-8055", queue: "247client1_Web_Chat", score: 72, defect: "Skipped 2nd verify", date: "2026-09-08" },
      { id: "AUD-8010", queue: "247client1_Web_Chat", score: 75, defect: "Partial auth", date: "2026-09-05" },
    ],
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
const coachPane = document.getElementById("coachPane");
const coachPaneBody = document.getElementById("coachPaneBody");
const coachPaneTitle = document.getElementById("coachPaneTitle");
const coachPaneSub = document.getElementById("coachPaneSub");

let currentView = "interactions";
let selectedIx = null; // null = list view
let ixSideTab = "audit";
let ixInsightsOpen = true;
let dataTab = "ingest";
let samplingTab = "jobs";
let settingsTab = "admin";
let selectedCoach = null;
let coachingTab = "overall";
let overallPeriod = "MTD";
let reportFilters = { lob: "All", queue: "All", period: "MTD" };
let coachFilters = { severity: [], themes: [], agents: [], teams: [], lobs: [] };
let teamFilters = { teams: [], lobs: [], queues: [], themes: [], severity: [] };
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
    <p class="page-sub">31 capabilities across Interactions, Import and export, Jobs, Coaching, Reporting & Insights, and Admin.</p>
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


function statusClass(status) {
  if (status === "Complete" || status === "QA Reviewed") return "ok";
  if (status === "Pending Dispute") return "bad";
  if (status === "LLM Audited") return "warn";
  return "neutral";
}

function auditModeLabel(mode) {
  if (mode === "manual") return "Manual audit";
  if (mode === "hybrid") return "Hybrid audit";
  if (mode === "llm") return "LLM audit";
  return "Not audited";
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
      <td><span class="status ${statusClass(i.status)}">${i.status}</span></td>
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
      <p class="page-sub">Filter by audit status (Not Audited · LLM Audited · QA Reviewed · Pending Dispute · Complete). Select a row for the matching audit workspace.</p>
      ${tenantRow()}
      <div class="list-toolbar">
        <div class="filters-inline">
          <div class="field"><label>Date from</label><input type="date" data-ix-date="dateFrom" value="${ixFilters.dateFrom}" /></div>
          <div class="field"><label>Date to</label><input type="date" data-ix-date="dateTo" value="${ixFilters.dateTo}" /></div>
          ${msField("Queue", "queues", uniqueValues("queue"))}
          ${msField("LOB", "lobs", uniqueValues("lob"))}
          ${msField("Agent", "agents", uniqueValues("agentName"))}
          ${msField("Intent", "intents", uniqueValues("intent"))}
          ${msField("Status", "statuses", AUDIT_STATUSES)}
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

function renderAuditForm(ix) {
  const isNotAudited = ix.status === "Not Audited";
  const isLlm = ix.status === "LLM Audited";
  const isQaReviewed = ix.status === "QA Reviewed";
  const isDispute = ix.status === "Pending Dispute";
  const isComplete = ix.status === "Complete";

  const overrideDisabled = isQaReviewed || isComplete;
  const showAi = !isNotAudited;
  const showAck = isComplete;
  const showScores = !isNotAudited;

  const emptyQs = AUDIT_QUESTIONS.map(
    (q) => `
    <div class="q-card">
      <span class="priority">high</span>
      <div class="q-title">${q.q}</div>
      <div class="ai-note" style="color:var(--muted)">No AI rationale — manual scoring</div>
      <div class="choice-row">
        <button class="choice" type="button">Yes (${q.points})</button>
        <button class="choice" type="button">No</button>
        <button class="choice" type="button">NA</button>
      </div>
      <div class="field"><textarea placeholder="Enter auditor rationale…"></textarea></div>
    </div>`
  ).join("");

  const filledQs = AUDIT_QUESTIONS.map(
    (q) => `
    <div class="q-card">
      <span class="priority">high</span>
      <div class="q-title">${q.q}</div>
      ${showAi ? `<div class="ai-note">${q.ai}</div>` : ""}
      <div class="choice-row">
        <button class="choice ${q.choice === "Yes" ? "selected" : ""}" type="button" ${overrideDisabled ? "disabled" : ""}>Yes (${q.points})</button>
        <button class="choice ${q.choice === "No" ? "selected" : ""}" type="button" ${overrideDisabled ? "disabled" : ""}>No ✓</button>
        <button class="choice" type="button" ${overrideDisabled ? "disabled" : ""}>NA</button>
      </div>
      <div class="field"><textarea ${overrideDisabled ? "readonly" : ""}>${q.ai.replace(/^AI:\s*/, "")}</textarea></div>
    </div>`
  ).join("");

  const modeBadge = `<span class="chip">${auditModeLabel(ix.auditMode)}</span>`;
  const statusBanner =
    isNotAudited
      ? `<div class="callout">Not Audited — empty monitoring form for manual QA.</div>`
      : isLlm
        ? `<div class="callout">LLM Audited — AI scores present, not submitted. Human override enabled.</div>`
        : isQaReviewed
          ? `<div class="callout">QA Reviewed (${auditModeLabel(ix.auditMode)}) — human override greyed out.</div>`
          : isDispute
            ? `<div class="callout">Pending Dispute — human override enabled for ${auditModeLabel(ix.auditMode)}.</div>`
            : `<div class="callout">Complete — agent feedback acknowledged. Audit locked.</div>`;

  return `
    <div class="audit-form">
      <h3>247client1 Chat Quality Assurance Monitoring Form</h3>
      <p class="hint" style="margin:0 0 0.55rem">Status: <strong>${ix.status}</strong> · ${modeBadge}</p>
      ${statusBanner}

      ${
        showAi
          ? `<div class="genai-box">
        <strong>GenAI summary</strong>
        Member reported an unauthorized charge. Bot verified identity, apologized, and escalated to fraud review with confirmation of next steps. Soft-skills section scored 20/20; no disclosure defects on this interaction.
      </div>`
          : `<div class="genai-box" style="opacity:0.7">
        <strong>GenAI summary</strong>
        Not available until LLM or hybrid audit runs. Complete the monitoring form manually.
      </div>`
      }

      ${
        showScores
          ? `<div class="score-summary">
        <div class="score-chip"><b>${ix.score === "—" ? "…" : ix.score}</b>Overall</div>
        <div class="score-chip"><b>20/20</b>Soft skills</div>
        <div class="score-chip"><b>Pass</b>Compliance</div>
        <div class="score-chip"><b>v3</b>Form version</div>
      </div>`
          : `<div class="score-summary">
        <div class="score-chip"><b>—</b>Overall</div>
        <div class="score-chip"><b>—/20</b>Soft skills</div>
        <div class="score-chip"><b>—</b>Compliance</div>
        <div class="score-chip"><b>v3</b>Form version</div>
      </div>`
      }

      <div class="audit-meta">
        <div class="field"><label>Agent EmpId</label><input value="A10482" readonly /></div>
        <div class="field"><label>Manager Name</label><input value="S. Miles" readonly /></div>
        <div class="field"><label>Customer Name</label><input value="Jordan Lee" readonly /></div>
        <div class="field"><label>Agent Category</label><input value="Chat Tier 1" readonly /></div>
        <div class="field"><label>Evaluator</label><input value="${isNotAudited ? "" : "ci_autoqra"}" placeholder="Assign evaluator" ${isComplete ? "readonly" : ""} /></div>
        <div class="field"><label>Audit Type</label>
          <select ${isComplete || isQaReviewed ? "disabled" : ""}>
            <option ${ix.auditMode === "llm" || ix.auditMode === "hybrid" ? "selected" : ""}>Auto QA</option>
            <option ${ix.auditMode === "manual" || isNotAudited ? "selected" : ""}>Manual QA</option>
          </select>
        </div>
      </div>
      <p style="font-size:0.82rem;margin:0 0 0.55rem">AutoQRA status: <strong>${ix.status}</strong>
        <button class="btn" type="button" style="margin-left:0.5rem" ${isComplete ? "disabled" : ""}>▶ Start timer</button>
      </p>
      ${
        showAck
          ? `<div class="ack-box">
        <span class="status ok">Acknowledged</span>
        <strong>Agent acknowledgment</strong><br/>
        Agent decision: <strong>Accept</strong> · Comments: <strong>Looks Good</strong> · Feedback completed
      </div>`
          : isDispute
            ? `<div class="ack-box" style="border-color:#e0b36a;background:var(--warn-bg)">
        <span class="status warn">Dispute open</span>
        <strong>Agent dispute</strong><br/>
        Agent decision: <strong>Dispute</strong> · Comments: <strong>Score unfair on disclosure item</strong>
      </div>`
            : ""
      }
      <div class="section-block">
        <div class="section-head">
          <span>Soft Skills and Professionalism</span>
          <span>${isNotAudited ? "—/20" : "20/20"}</span>
        </div>
        ${isNotAudited ? emptyQs : filledQs}
      </div>
      <div class="btn-row">
        ${
          isNotAudited
            ? `<button class="btn primary" type="button">Save manual audit</button>
               <button class="btn" type="button">Submit for QA review</button>`
            : isLlm
              ? `<button class="btn primary" type="button">Save override</button>
                 <button class="btn" type="button">Submit QA review</button>
                 <button class="btn" type="button">Human override…</button>`
              : isQaReviewed
                ? `<button class="btn primary" type="button" disabled title="Override greyed out after QA review">Save override</button>
                   <button class="btn" type="button" disabled>Human override…</button>
                   <button class="btn" type="button">Export pack</button>`
                : isDispute
                  ? `<button class="btn primary" type="button">Save override</button>
                     <button class="btn" type="button">Human override…</button>
                     <button class="btn" type="button">Resolve dispute</button>`
                  : `<button class="btn" type="button" disabled>Save override</button>
                     <button class="btn" type="button" disabled>Human override…</button>
                     <button class="btn" type="button">View acknowledgment</button>`
        }
      </div>
    </div>`;
}

function renderInteractionDetail(ix) {
  const isNotAudited = ix.status === "Not Audited";

  const details = `
    <h3 style="margin:0 0 0.55rem;font-size:0.95rem">Conversation details</h3>
    <dl class="kv">
      <dt>Conversation ID</dt><dd>${ix.id}</dd>
      <dt>Status</dt><dd><span class="status ${statusClass(ix.status)}">${ix.status}</span></dd>
      <dt>Audit mode</dt><dd>${auditModeLabel(ix.auditMode)}</dd>
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

  const historyEvents =
    isNotAudited
      ? `<tr><td>—</td><td>No audit events yet · awaiting manual monitoring</td></tr>`
      : ix.status === "LLM Audited"
        ? `<tr><td>08:11</td><td>LLM scoring · 247client1 Chat v3</td></tr>
           <tr><td>08:12</td><td>GenAI summary generated</td></tr>
           <tr><td>08:12</td><td>Awaiting human override / submit</td></tr>`
        : ix.status === "QA Reviewed"
          ? `<tr><td>08:11</td><td>${ix.auditMode === "manual" ? "Manual audit completed" : "LLM + human hybrid review"}</td></tr>
             <tr><td>09:05</td><td>QA Reviewed · override locked</td></tr>`
          : ix.status === "Pending Dispute"
            ? `<tr><td>08:11</td><td>Audit completed (${auditModeLabel(ix.auditMode)})</td></tr>
               <tr><td>10:20</td><td>Agent opened dispute</td></tr>
               <tr><td>10:21</td><td>Human override re-enabled</td></tr>`
            : `<tr><td>08:11</td><td>Audit completed</td></tr>
               <tr><td>11:00</td><td>Agent acknowledgment · Accept</td></tr>
               <tr><td>11:01</td><td>Feedback completed · Complete</td></tr>`;

  const history = `
    <h3 style="margin:0 0 0.55rem;font-size:0.95rem">Audit Trail and Log</h3>
    <table class="table">
      <thead><tr><th>When</th><th>Event</th></tr></thead>
      <tbody>${historyEvents}</tbody>
    </table>`;

  const audit = renderAuditForm(ix);
  const sideBody = ixSideTab === "details" ? details : ixSideTab === "history" ? history : audit;

  const settingsPane = `
    <aside class="ix-insights ${ixInsightsOpen ? "open" : "collapsed"}">
      <button class="ix-insights-toggle" type="button" data-ix-insights-toggle aria-expanded="${ixInsightsOpen}">
        <span class="ix-insights-toggle-label">Advanced Settings</span>
        <span class="ix-insights-chevron">${ixInsightsOpen ? "»" : "«"}</span>
      </button>
      <div class="ix-insights-body" ${ixInsightsOpen ? "" : "hidden"}>
        <div class="ix-empty-pane">
          <p class="hint" style="margin:0">Advanced Settings — empty pane (placeholder).</p>
        </div>
      </div>
    </aside>`;

  const layoutClass = ixInsightsOpen ? "insights-open" : "insights-closed";

  return `
    <div class="ix-detail-page">
      <div class="ix-detail-toolbar">
        <button class="btn" type="button" data-ix-back>← Back to list</button>
        <div class="ix-trans-meta">${ix.short} · ${ix.status} · ${ix.queue} · ${ix.agentName} · ${ix.duration}</div>
      </div>
      <div class="ix-layout ${layoutClass}">
        <section class="ix-transcript">
          <div class="ix-trans-head">
            <div>
              <h2>Transcript</h2>
              <div class="ix-trans-meta">${ix.id}</div>
            </div>
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

        ${settingsPane}
      </div>
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
    <h1 class="page-title">Import and export</h1>
    <p class="page-sub">Ingest, pull, and export conversation data for the selected techclient tenant.</p>
    ${tenantRow()}
    ${failedBar()}
    <div class="tabs">
      <button class="tab ${dataTab === "ingest" ? "active" : ""}" type="button" data-data-tab="ingest">Ingest <span class="badge">2</span></button>
      <button class="tab ${dataTab === "export" ? "active" : ""}" type="button" data-data-tab="export">Export</button>
    </div>
    ${dataTab === "ingest" ? ingest : exportTab}`;
}

function renderDataImportTitle() {
  return `
    <h1 class="page-title">Import and export</h1>
    <p class="page-sub">Ingest, pull, and export conversation data for the selected techclient tenant.</p>`;
}

function renderSampling() {
  const jobs = `
    <div class="card">
      <h3>Jobs &amp; results — track AutoQRA scoring runs</h3>
      <p class="hint">Each job selects interactions, runs AutoQRA scoring / enrichment / evaluation, and stores results for review and coaching.</p>
      <table class="table">
        <thead><tr><th>Job ID</th><th>Purpose</th><th>Scope</th><th>Requested</th><th>Status</th><th>Scored</th><th>Updated</th></tr></thead>
        <tbody>
          <tr class="clickable">
            <td style="font-family:var(--mono);font-size:0.75rem">qaj_44a1c2…</td>
            <td>Weekly pharmacy AutoQRA batch</td>
            <td>UHC · Rx intent</td>
            <td>10</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>10 / 10</td>
            <td>2026-09-10 12:04</td>
          </tr>
          <tr class="clickable">
            <td style="font-family:var(--mono);font-size:0.75rem">qaj_91bc88…</td>
            <td>247client1 web chat QA run</td>
            <td>247client1_Web_Chat</td>
            <td>25</td>
            <td><span class="status warn">RUNNING</span></td>
            <td>12 / 25</td>
            <td>2026-09-10 12:10</td>
          </tr>
          <tr class="clickable">
            <td style="font-family:var(--mono);font-size:0.75rem">qaj_22fe01…</td>
            <td>Calibration sample pack</td>
            <td>Retail · fraud intent</td>
            <td>15</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>15 / 15</td>
            <td>2026-09-09 16:22</td>
          </tr>
          <tr class="clickable">
            <td style="font-family:var(--mono);font-size:0.75rem">qaj_77aa09…</td>
            <td>Backfill re-score (prompt v14)</td>
            <td>Cards LOB</td>
            <td>50</td>
            <td><span class="status neutral">QUEUED</span></td>
            <td>0 / 50</td>
            <td>2026-09-10 12:15</td>
          </tr>
        </tbody>
      </table>
      <div class="btn-row" style="margin-top:0.75rem">
        <button class="btn primary" type="button" data-samp-tab="new">+ New job</button>
        <button class="btn" type="button">Refresh</button>
      </div>
    </div>`;

  const newJob = `
    <div class="card">
      <h3>New job</h3>
      <p class="hint">Define which ingested interactions to score. This queues an AutoQRA job — it does not open the audit form itself. Results appear under QA jobs when complete.</p>
      <div class="grid-filters">
        <div class="field"><label>Job name</label><input value="247client1 weekly AutoQRA" /></div>
        <div class="field"><label>Job type</label><select><option>AutoQRA scoring</option><option>Calibration sample</option><option>Re-score / backfill</option></select></div>
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
        <p class="hint">After you start the job, return to <strong>Jobs &amp; results</strong> to watch progress and open scored interactions.</p>
        <button class="btn primary" type="button">Start job</button>
      </div>
    </div>`;

  return `
    <h1 class="page-title">Jobs</h1>
    <p class="page-sub">Create and monitor AutoQRA scoring jobs. Select interactions, run QA at scale, then review results.</p>
    ${tenantRow()}
    ${failedBar()}
    <div class="tabs">
      <button class="tab ${samplingTab === "jobs" ? "active" : ""}" type="button" data-samp-tab="jobs">Jobs &amp; results</button>
      <button class="tab ${samplingTab === "new" ? "active" : ""}" type="button" data-samp-tab="new">New job</button>
    </div>
    ${samplingTab === "jobs" ? jobs : newJob}`;
}

function coachingPlanHtml(c) {
  const audits = (c.sampleAudits || [])
    .map(
      (a) => `
      <tr>
        <td style="font-family:var(--mono);font-size:0.75rem">${a.id}</td>
        <td>${a.date}</td>
        <td>${a.score}</td>
        <td>${a.defect}</td>
        <td><button class="link-btn" type="button">Open audit</button></td>
      </tr>`
    )
    .join("");
  return `
    <span class="severity ${c.severity}">${c.severity.toUpperCase()}</span>
    <dl class="coach-pane-meta">
      <dt>${c.level === "team" ? "Team" : "Agent"}</dt><dd>${c.agent}</dd>
      <dt>Team</dt><dd>${c.team}</dd>
      <dt>LOB</dt><dd>${c.lob}</dd>
      <dt>Queue</dt><dd>${c.queue}</dd>
      <dt>Monitoring</dt><dd>${c.monitoring ?? c.audits}</dd>
      <dt>Defect hits</dt><dd>${c.fails}</dd>
      <dt>Theme</dt><dd>${c.theme}</dd>
      <dt>Level</dt><dd>${c.level}</dd>
    </dl>
    <p style="font-size:0.9rem;line-height:1.45;margin:0 0 0.85rem">${c.opportunity}</p>
    <h3 style="margin:0 0 0.45rem;font-size:0.95rem">Example audits leading to this plan</h3>
    <table class="table">
      <thead><tr><th>Audit</th><th>Date</th><th>Score</th><th>Defect</th><th></th></tr></thead>
      <tbody>${audits || `<tr><td colspan="5" style="color:var(--muted)">No sample audits</td></tr>`}</tbody>
    </table>
    <div class="btn-row" style="margin-top:0.85rem">
      <button class="btn primary" type="button">Open coaching plan</button>
      <button class="btn" type="button">Assign to coach</button>
      <button class="btn" type="button">Schedule session</button>
    </div>`;
}

function openCoachPane(id) {
  const c = COACHING.find((x) => x.id === id);
  if (!c || !coachPane) return;
  selectedCoach = id;
  coachPaneTitle.textContent = `Coaching plan · ${c.agent}`;
  coachPaneSub.textContent = `${c.level === "team" ? "Team" : "Agent"} coaching · ${c.monitoring ?? c.audits} monitoring · ${c.theme}`;
  coachPaneBody.innerHTML = coachingPlanHtml(c);
  coachPane.hidden = false;
}

function closeCoachPane() {
  if (coachPane) coachPane.hidden = true;
}

function filteredOverall() {
  return COACHING.filter((c) => {
    if (coachFilters.severity.length && !coachFilters.severity.includes(c.severity)) return false;
    if (coachFilters.themes.length && !coachFilters.themes.includes(c.theme)) return false;
    if (coachFilters.agents.length && !coachFilters.agents.includes(c.agent)) return false;
    return true;
  });
}

function filteredTeams() {
  return COACHING.filter((c) => c.level === "team").filter((c) => {
    if (teamFilters.teams.length && !teamFilters.teams.includes(c.team)) return false;
    if (teamFilters.lobs.length && !teamFilters.lobs.includes(c.lob)) return false;
    if (teamFilters.queues.length && !teamFilters.queues.includes(c.queue)) return false;
    if (teamFilters.themes.length && !teamFilters.themes.includes(c.theme)) return false;
    if (teamFilters.severity.length && !teamFilters.severity.includes(c.severity)) return false;
    return true;
  });
}

function agentRecords() {
  return COACHING.filter((c) => c.level === "agent").filter((c) => {
    if (coachFilters.severity.length && !coachFilters.severity.includes(c.severity)) return false;
    if (coachFilters.themes.length && !coachFilters.themes.includes(c.theme)) return false;
    if (coachFilters.agents.length && !coachFilters.agents.includes(c.agent)) return false;
    return true;
  });
}

function renderCoachingOverall() {
  const themes = OVERALL_THEMES;
  const audited = themes[0]?.audited || 0;
  const high = themes.filter((t) => t.priority === "high").length;
  const cards = themes
    .map(
      (t) => `
    <div class="card" style="margin:0">
      <div style="display:flex;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;align-items:flex-start">
        <div>
          <h3 style="margin:0">${t.theme}</h3>
          <p class="hint" style="margin:0.3rem 0 0">Applies to <strong>${t.agentsImpacted}</strong> · Period ${overallPeriod}</p>
        </div>
        <span class="severity ${t.priority}">${t.priority.toUpperCase()}</span>
      </div>
      <div class="stat-row" style="margin:0.65rem 0">
        <div class="stat"><div class="label">Audited (period)</div><div class="value">${t.audited}</div></div>
        <div class="stat"><div class="label">Defect rate</div><div class="value">${t.defectRate}</div></div>
        <div class="stat"><div class="label">Sample audits</div><div class="value">${t.sampleAudits.length}</div></div>
      </div>
      <p style="font-size:0.9rem;line-height:1.45;margin:0 0 0.55rem">${t.coaching}</p>
      <h4 style="margin:0 0 0.35rem;font-size:0.85rem">Recommended actions (all agents)</h4>
      <ul class="opt-list" style="margin-bottom:0.65rem">
        ${t.actions.map((a) => `<li>${a}</li>`).join("")}
      </ul>
      <h4 style="margin:0 0 0.35rem;font-size:0.85rem">Audited conversations illustrating this theme</h4>
      <table class="table">
        <thead><tr><th>Audit</th><th>Queue</th><th>Date</th><th>Score</th><th>Defect</th></tr></thead>
        <tbody>
          ${t.sampleAudits
            .map(
              (a) =>
                `<tr><td style="font-family:var(--mono);font-size:0.75rem">${a.id}</td><td>${a.queue}</td><td>${a.date}</td><td>${a.score}</td><td>${a.defect}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
    )
    .join("");

  return `
    <div class="card" style="margin-bottom:0.85rem">
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-end">
        <div>
          <h3 style="margin:0">Overall Coaching</h3>
          <p class="hint" style="margin:0.3rem 0 0">Generic coaching from audited conversations this period — same guidance for every agent.</p>
        </div>
        <div class="field" style="margin:0;min-width:160px">
          <label>Period</label>
          <select data-overall-period>
            <option ${overallPeriod === "MTD" ? "selected" : ""}>MTD</option>
            <option ${overallPeriod === "Last 7 days" ? "selected" : ""}>Last 7 days</option>
            <option ${overallPeriod === "Last 30 days" ? "selected" : ""}>Last 30 days</option>
            <option ${overallPeriod === "Quarter" ? "selected" : ""}>Quarter</option>
          </select>
        </div>
      </div>
      <div class="stat-row" style="margin:0.75rem 0 0">
        <div class="stat"><div class="label">Audited conversations</div><div class="value">${audited}</div></div>
        <div class="stat"><div class="label">Org themes</div><div class="value">${themes.length}</div></div>
        <div class="stat"><div class="label">High priority</div><div class="value">${high}</div></div>
        <div class="stat"><div class="label">Audience</div><div class="value" style="font-size:0.95rem">All agents</div></div>
      </div>
    </div>
    <div class="grid-2" style="gap:0.85rem">${cards}</div>`;
}

function renderCoachingTeam() {
  const teams = filteredTeams();
  const teamNames = [...new Set(COACHING.filter((c) => c.level === "team").map((c) => c.team))];
  const lobs = [...new Set(COACHING.filter((c) => c.level === "team").map((c) => c.lob))];
  const queues = [...new Set(COACHING.filter((c) => c.level === "team").map((c) => c.queue))];
  const themes = [...new Set(COACHING.filter((c) => c.level === "team").map((c) => c.theme))];
  const sevs = [...new Set(COACHING.filter((c) => c.level === "team").map((c) => c.severity))];

  const rows = teams
    .map(
      (c) => `
    <tr>
      <td><span class="severity ${c.severity}">${c.severity.toUpperCase()}</span></td>
      <td><strong>${c.team}</strong></td>
      <td>${c.lob}</td>
      <td>${c.queue}</td>
      <td>${c.theme}</td>
      <td>${c.monitoring ?? c.audits}</td>
      <td>${c.fails}</td>
      <td style="max-width:220px;font-size:0.82rem">${c.opportunity}</td>
      <td><button class="btn primary" type="button" data-view-coach="${c.id}">View coaching</button></td>
    </tr>`
    )
    .join("");

  return `
    <div class="card">
      <h3>Team / Queue coaching</h3>
      <p class="hint">Coaching specific to a team or queue — not org-wide. Filter by team, LOB, or queue, then open the coaching pane.</p>
      <div class="filters-inline" style="margin-bottom:0.75rem">
        <div class="field"><label>Team</label>
          <select data-team-filter="teams" multiple size="3" style="min-height:64px">
            ${teamNames.map((s) => `<option value="${s}" ${teamFilters.teams.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Queue</label>
          <select data-team-filter="queues" multiple size="3" style="min-height:64px">
            ${queues.map((s) => `<option value="${s}" ${teamFilters.queues.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>LOB</label>
          <select data-team-filter="lobs" multiple size="3" style="min-height:64px">
            ${lobs.map((s) => `<option value="${s}" ${teamFilters.lobs.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Theme</label>
          <select data-team-filter="themes" multiple size="3" style="min-height:64px">
            ${themes.map((s) => `<option value="${s}" ${teamFilters.themes.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Severity</label>
          <select data-team-filter="severity" multiple size="3" style="min-height:64px">
            ${sevs.map((s) => `<option value="${s}" ${teamFilters.severity.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn primary" type="button" data-team-apply>Apply filters</button>
          <button class="btn" type="button" data-team-clear>Clear</button>
        </div>
      </div>
      <p class="hint" style="margin:0 0 0.45rem">Showing ${teams.length} team / queue coaching plans.</p>
      <div class="ix-table-wrap" style="border:none">
        <table class="table">
          <thead>
            <tr><th>Priority</th><th>Team</th><th>LOB</th><th>Queue</th><th>Theme</th><th>Monitoring</th><th>Fails</th><th>Opportunity</th><th></th></tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="9" style="text-align:center;color:var(--muted)">No teams / queues match filters.</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
}

function renderCoachingAgent() {
  // Former Overall screen — agent-level opportunities list + filters + detail
  const list = agentRecords();
  const agents = [...new Set(COACHING.filter((c) => c.level === "agent").map((c) => c.agent))];
  const themes = [...new Set(COACHING.filter((c) => c.level === "agent").map((c) => c.theme))];
  const sevs = [...new Set(COACHING.filter((c) => c.level === "agent").map((c) => c.severity))];
  const selected = list.find((c) => c.id === selectedCoach) || null;

  const rows = list
    .map(
      (c) => `
    <tr class="clickable ${selectedCoach === c.id ? "selected" : ""}" data-agent-coach="${c.id}">
      <td><span class="severity ${c.severity}">${c.severity.toUpperCase()}</span></td>
      <td><strong>${c.agent}</strong><div style="font-size:0.72rem;color:var(--muted)">${c.team}</div></td>
      <td>${c.lob}</td>
      <td>${c.queue}</td>
      <td>${c.theme}</td>
      <td><strong>${c.monitoring ?? c.audits}</strong></td>
      <td>${c.fails}</td>
      <td style="max-width:220px;font-size:0.82rem">${c.opportunity}</td>
      <td><button class="btn primary" type="button" data-view-coach="${c.id}">View coaching</button></td>
    </tr>`
    )
    .join("");

  const detail = selected
    ? `
    <div class="card" style="margin-top:0.85rem">
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start">
        <div>
          <h3 style="margin:0">Agent coaching · ${selected.agent}</h3>
          <p class="hint" style="margin:0.35rem 0 0">${selected.monitoring ?? selected.audits} monitoring · ${selected.fails} defect hits · ${selected.team} · ${selected.queue}</p>
        </div>
        <div class="btn-row">
          <button class="btn primary" type="button" data-view-coach="${selected.id}">Open coaching pane</button>
        </div>
      </div>
      <div class="stat-row" style="margin:0.75rem 0">
        <div class="stat"><div class="label">Monitoring</div><div class="value">${selected.monitoring ?? selected.audits}</div></div>
        <div class="stat"><div class="label">Defect hits</div><div class="value">${selected.fails}</div></div>
        <div class="stat"><div class="label">Avg focus score</div><div class="value">${Math.round((selected.sampleAudits || []).reduce((s, a) => s + a.score, 0) / Math.max(1, (selected.sampleAudits || []).length)) || "—"}</div></div>
        <div class="stat"><div class="label">Priority</div><div class="value" style="font-size:1rem">${selected.severity.toUpperCase()}</div></div>
      </div>
      <p style="font-size:0.9rem;line-height:1.45">${selected.opportunity}</p>
      <h3 style="margin:0.75rem 0 0.45rem;font-size:0.95rem">Monitoring examples</h3>
      <table class="table">
        <thead><tr><th>Audit</th><th>Date</th><th>Score</th><th>Defect</th></tr></thead>
        <tbody>
          ${(selected.sampleAudits || [])
            .map((a) => `<tr><td style="font-family:var(--mono);font-size:0.75rem">${a.id}</td><td>${a.date}</td><td>${a.score}</td><td>${a.defect}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>`
    : `<div class="card" style="margin-top:0.85rem"><p class="hint">Select an agent row to see coaching details and monitoring count.</p></div>`;

  return `
    <div class="stat-row">
      <div class="stat"><div class="label">Agent opportunities</div><div class="value">${list.length}</div></div>
      <div class="stat"><div class="label">High priority</div><div class="value">${list.filter((c) => c.severity === "high").length}</div></div>
      <div class="stat"><div class="label">Monitoring total</div><div class="value">${list.reduce((s, c) => s + (c.monitoring || c.audits), 0)}</div></div>
      <div class="stat"><div class="label">Defect hits</div><div class="value">${list.reduce((s, c) => s + c.fails, 0)}</div></div>
    </div>
    <div class="card">
      <h3>Agent-level coaching</h3>
      <p class="hint">Per-agent opportunities from AutoQRA monitoring (moved from Overall). Filter, select a row, or open the coaching pane.</p>
      <div class="filters-inline" style="margin-bottom:0.75rem">
        <div class="field"><label>Agent</label>
          <select data-coach-filter="agents" multiple size="3" style="min-height:64px">
            ${agents.map((s) => `<option value="${s}" ${coachFilters.agents.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Theme</label>
          <select data-coach-filter="themes" multiple size="3" style="min-height:64px">
            ${themes.map((s) => `<option value="${s}" ${coachFilters.themes.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Severity</label>
          <select data-coach-filter="severity" multiple size="3" style="min-height:64px">
            ${sevs.map((s) => `<option value="${s}" ${coachFilters.severity.includes(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn primary" type="button" data-coach-apply>Apply filters</button>
          <button class="btn" type="button" data-coach-clear>Clear</button>
        </div>
      </div>
      <p class="hint" style="margin:0 0 0.45rem">${list.length} agent coaching plans.</p>
      <div class="ix-table-wrap" style="border:none">
        <table class="table">
          <thead>
            <tr><th>Priority</th><th>Agent</th><th>LOB</th><th>Queue</th><th>Theme</th><th>Monitoring</th><th>Fails</th><th>Opportunity</th><th></th></tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="9" style="text-align:center;color:var(--muted)">No agents match filters.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    ${detail}`;
}

function renderCoaching() {
  const body =
    coachingTab === "team"
      ? renderCoachingTeam()
      : coachingTab === "agent"
        ? renderCoachingAgent()
        : renderCoachingOverall();

  return `
    <h1 class="page-title">Coaching*</h1>
    <p class="page-sub">Not available now (marked with *). Overall = period themes for all agents · Team = team/queue · Agent = per-agent plans.</p>
    <div class="callout">Coaching* is unavailable in this release.</div>
    ${tenantRow()}
    <div class="tabs">
      <button class="tab ${coachingTab === "overall" ? "active" : ""}" type="button" data-coach-tab="overall">Overall Coaching</button>
      <button class="tab ${coachingTab === "team" ? "active" : ""}" type="button" data-coach-tab="team">Team</button>
      <button class="tab ${coachingTab === "agent" ? "active" : ""}" type="button" data-coach-tab="agent">Agent level coaching</button>
    </div>
    <div class="unavailable-preview">${body}</div>`;
}

function renderReporting() {
  const topAgents = [
    { rank: 1, agent: "S. Okonkwo", lob: "Test_Lob", audits: 22, score: 94.2, pass: "96%" },
    { rank: 2, agent: "T. Morales", lob: "Retail", audits: 25, score: 91.8, pass: "94%" },
    { rank: 3, agent: "M. Chen", lob: "Retail", audits: 36, score: 89.1, pass: "91%" },
    { rank: 4, agent: "H. Cho", lob: "Commercial Pharmacy", audits: 38, score: 88.4, pass: "90%" },
    { rank: 5, agent: "K. Singh", lob: "Commercial Pharmacy", audits: 27, score: 87.0, pass: "88%" },
    { rank: 6, agent: "L. Ramirez", lob: "Retail", audits: 33, score: 85.2, pass: "86%" },
    { rank: 7, agent: "J. Brooks", lob: "Medicaid Pharmacy", audits: 41, score: 82.6, pass: "83%" },
    { rank: 8, agent: "R. Patel", lob: "Commercial Pharmacy", audits: 48, score: 78.4, pass: "77%" },
  ];
  const lobBoard = [
    { lob: "Pharmacy", score: 90.2, audits: 4200, agreement: "93%", trend: "+1.2" },
    { lob: "Retail", score: 88.1, audits: 6100, agreement: "92%", trend: "+0.4" },
    { lob: "Test_Lob", score: 86.9, audits: 980, agreement: "91%", trend: "0.0" },
    { lob: "Cards", score: 81.4, audits: 5100, agreement: "89%", trend: "-1.8" },
  ];

  const filteredAgents =
    reportFilters.lob === "All"
      ? topAgents
      : topAgents.filter((a) => a.lob === reportFilters.lob || (reportFilters.lob === "Pharmacy" && a.lob.includes("Pharmacy")));

  return `
    <h1 class="page-title">Reporting &amp; Insights*</h1>
    <p class="page-sub">Not available now (marked with *). Preview of planned Superset-backed insights.</p>
    <div class="callout">Reporting &amp; Insights* is unavailable in this release.</div>
    ${tenantRow()}
    <div class="card" style="padding:0.75rem 1rem;margin-bottom:0.85rem">
      <div class="filters-inline">
        <div class="field"><label>Period</label>
          <select data-report-filter="period">
            <option ${reportFilters.period === "MTD" ? "selected" : ""}>MTD</option>
            <option ${reportFilters.period === "Last 7 days" ? "selected" : ""}>Last 7 days</option>
            <option ${reportFilters.period === "Last 30 days" ? "selected" : ""}>Last 30 days</option>
            <option ${reportFilters.period === "Quarter" ? "selected" : ""}>Quarter</option>
          </select>
        </div>
        <div class="field"><label>LOB</label>
          <select data-report-filter="lob">
            <option>All</option>
            <option ${reportFilters.lob === "Retail" ? "selected" : ""}>Retail</option>
            <option ${reportFilters.lob === "Cards" ? "selected" : ""}>Cards</option>
            <option ${reportFilters.lob === "Pharmacy" ? "selected" : ""}>Pharmacy</option>
            <option ${reportFilters.lob === "Test_Lob" ? "selected" : ""}>Test_Lob</option>
          </select>
        </div>
        <div class="field"><label>Queue</label>
          <select data-report-filter="queue">
            <option>All</option>
            <option ${reportFilters.queue === "247client1_Web_Chat" ? "selected" : ""}>247client1_Web_Chat</option>
            <option ${reportFilters.queue === "UHC_Rx_Refill_Chat" ? "selected" : ""}>UHC_Rx_Refill_Chat</option>
            <option ${reportFilters.queue === "UHC_Refill_Status" ? "selected" : ""}>UHC_Refill_Status</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn primary" type="button" data-report-apply>Apply filters</button>
        </div>
      </div>
      <p class="hint" style="margin:0.5rem 0 0">Active: <strong>${reportFilters.period}</strong> · LOB <strong>${reportFilters.lob}</strong> · Queue <strong>${reportFilters.queue}</strong></p>
    </div>
    <div class="embed-frame">
      <div class="embed-chrome">
        <span class="dot"></span>
        <span>Superset · AutoQRA Executive Dashboard</span>
        <span style="margin-left:auto;font-family:var(--mono);font-size:0.72rem">/superset/dashboard/autoqra-exec/</span>
        <button class="btn" type="button">Open in Superset ↗</button>
      </div>
      <div class="embed-body">
        <div class="stat-row" style="margin:0">
          <div class="stat"><div class="label">Audits ${reportFilters.period}</div><div class="value">18.4k</div></div>
          <div class="stat"><div class="label">Avg score</div><div class="value">86.4</div></div>
          <div class="stat"><div class="label">Agreement</div><div class="value">92%</div></div>
          <div class="stat"><div class="label">Override rate</div><div class="value">4.8%</div></div>
        </div>
        <div class="superset-mock">
          <div class="chart-box">
            <h4>Top agents</h4>
            <table class="table">
              <thead><tr><th>#</th><th>Agent</th><th>LOB</th><th>Audits</th><th>Avg score</th><th>Pass%</th></tr></thead>
              <tbody>
                ${filteredAgents
                  .map(
                    (a) =>
                      `<tr><td>${a.rank}</td><td>${a.agent}</td><td>${a.lob}</td><td>${a.audits}</td><td><strong>${a.score}</strong></td><td>${a.pass}</td></tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="chart-box">
            <h4>LOB leaderboard</h4>
            <table class="table">
              <thead><tr><th>LOB</th><th>Avg score</th><th>Audits</th><th>Agreement</th><th>Trend</th></tr></thead>
              <tbody>
                ${lobBoard
                  .map(
                    (l) =>
                      `<tr><td><strong>${l.lob}</strong></td><td>${l.score}</td><td>${l.audits.toLocaleString()}</td><td>${l.agreement}</td><td>${l.trend}</td></tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="chart-box">
            <h4>Audit volume by day</h4>
            <div class="bar-chart">
              <span style="height:40%"></span><span style="height:55%"></span><span style="height:70%"></span>
              <span style="height:48%"></span><span style="height:82%"></span><span style="height:66%"></span>
              <span style="height:90%"></span>
            </div>
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
    </div>`;
}

function renderAdminTenantBody() {
  return `
    <p class="page-sub" style="margin-top:0">Tenant configuration, CRM / KB integration, ingestion, RBAC, and monitoring forms.</p>
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
          <dt>Page size</dt><dd>100</dd>
          <dt>Overlap</dt><dd>300 seconds</dd>
        </dl>
      </div>
      <div class="card">
        <h3>SFTP / Cloud bucket</h3>
        <dl class="kv">
          <dt>SFTP</dt><dd>Disabled · pattern *.csv</dd>
          <dt>Bucket ingest</dt><dd>Enabled · *.csv</dd>
          <dt>Path prefix</dt><dd>—</dd>
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
        <ul style="margin:0;padding-left:1.1rem;font-size:0.9rem;line-height:1.55">
          <li>247client1 Chat QA form v3 — published (scoring + GenAI summary)</li>
          <li>Queue <code>247client1_Web_Chat</code> → scorecard v3</li>
          <li>Queue <code>UHC_Rx_Refill_Chat</code> → Pharmacy form v1.4</li>
        </ul>
        <div class="btn-row" style="margin-top:0.65rem">
          <button class="btn primary" type="button">Modify monitoring form</button>
          <button class="btn" type="button">Map queue</button>
        </div>
      </div>
    </div>`;
}

function renderAdminCalibrationBody() {
  return `
    <p class="page-sub" style="margin-top:0">Align human and AI scoring, tune thresholds, and optimize prompts / models from disagreement patterns.</p>
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
        <ul class="opt-list">
          <li><strong>Prompt v14 drift</strong> — Soft skills agreement dipped 3pts. Recommend A/B vs v13.</li>
          <li><strong>Routing threshold</strong> — Cards chat human-route share 24% (target 17%).</li>
          <li><strong>Hallucination watch</strong> — Unsupported rationale 2.1% (under 5% gate).</li>
          <li><strong>Scorecard gap</strong> — New promo disclosure not in 247client1 form v3.</li>
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

function renderAdminAdvancedBody() {
  return `
    <div class="card">
      <h3>Advanced Settings</h3>
      <p class="hint" style="margin:0">Empty pane — placeholder for future advanced settings.</p>
    </div>`;
}

function renderAdmin() {
  const body =
    settingsTab === "calibration"
      ? renderAdminCalibrationBody()
      : settingsTab === "advanced"
        ? renderAdminAdvancedBody()
        : renderAdminTenantBody();

  return `
    <h1 class="page-title">Settings*</h1>
    <p class="page-sub">Not available now (marked with *). Preview of Admin / Calibration / Advanced Settings tabs.</p>
    <div class="callout">Settings* is unavailable in this release.</div>
    ${tenantRow()}
    <div class="tabs">
      <button class="tab ${settingsTab === "admin" ? "active" : ""}" type="button" data-settings-tab="admin">Admin</button>
      <button class="tab ${settingsTab === "calibration" ? "active" : ""}" type="button" data-settings-tab="calibration">Calibration &amp; AI Opt</button>
      <button class="tab ${settingsTab === "advanced" ? "active" : ""}" type="button" data-settings-tab="advanced">Advanced Settings</button>
    </div>
    <div class="unavailable-preview">${body}</div>`;
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
  if (view !== "coaching") closeCoachPane();
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

  if (e.target.closest("[data-ix-insights-toggle]")) {
    ixInsightsOpen = !ixInsightsOpen;
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

  const settingsTabBtn = e.target.closest("[data-settings-tab]");
  if (settingsTabBtn) {
    settingsTab = settingsTabBtn.dataset.settingsTab;
    render("admin");
    return;
  }

  const coachTabBtn = e.target.closest("[data-coach-tab]");
  if (coachTabBtn) {
    coachingTab = coachTabBtn.dataset.coachTab;
    selectedCoach = null;
    render("coaching");
    return;
  }

  const viewCoach = e.target.closest("[data-view-coach]");
  if (viewCoach) {
    openCoachPane(viewCoach.dataset.viewCoach);
    return;
  }

  const agentCoach = e.target.closest("[data-agent-coach]");
  if (agentCoach) {
    selectedCoach = agentCoach.dataset.agentCoach;
    render("coaching");
    return;
  }

  if (e.target.closest("[data-team-apply]")) {
    workspace.querySelectorAll("[data-team-filter]").forEach((sel) => {
      teamFilters[sel.dataset.teamFilter] = [...sel.selectedOptions].map((o) => o.value);
    });
    render("coaching");
    return;
  }

  if (e.target.closest("[data-team-clear]")) {
    teamFilters.teams = [];
    teamFilters.lobs = [];
    teamFilters.queues = [];
    teamFilters.themes = [];
    teamFilters.severity = [];
    render("coaching");
    return;
  }

  const coachRow = e.target.closest("[data-coach]");
  if (coachRow) {
    selectedCoach = coachRow.dataset.coach;
    render("coaching");
    return;
  }

  if (e.target.closest("[data-coach-apply]")) {
    workspace.querySelectorAll("[data-coach-filter]").forEach((sel) => {
      const key = sel.dataset.coachFilter;
      coachFilters[key] = [...sel.selectedOptions].map((o) => o.value);
    });
    selectedCoach = null;
    render("coaching");
    return;
  }

  if (e.target.closest("[data-coach-clear]")) {
    coachFilters.severity = [];
    coachFilters.themes = [];
    coachFilters.agents = [];
    selectedCoach = null;
    render("coaching");
    return;
  }

  if (e.target.closest("[data-report-apply]")) {
    workspace.querySelectorAll("[data-report-filter]").forEach((sel) => {
      reportFilters[sel.dataset.reportFilter] = sel.value;
    });
    render("reporting");
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
  const overallPeriodSel = e.target.closest("[data-overall-period]");
  if (overallPeriodSel) {
    overallPeriod = overallPeriodSel.value;
    render("coaching");
    return;
  }
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

coachPane.addEventListener("click", (e) => {
  if (e.target.closest("[data-close-coach-pane]")) closeCoachPane();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (coachPane && !coachPane.hidden) closeCoachPane();
    else if (!crmPane.hidden) closeCrmPane();
  }
});

render("interactions");
