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
  "QA Direct",
  "QA Reviewed",
  "Pending Dispute",
  "Complete",
];

const FORM_VERSIONS = [
  { id: "llm", name: "LLM form" },
  { id: "qra", name: "QRA form" },
  { id: "short-call", name: "Short call monitoring" },
  { id: "supervisor", name: "Supervisor monitoring" },
];

const JOB_FORM_VERSIONS = [
  { id: "llm", name: "LLM form" },
  { id: "short-form", name: "Short form monitoring" },
  { id: "custom", name: "Custom form" },
];

const RUBRIC_AREAS = [
  "Soft skills",
  "Compliance",
  "Disclosures",
  "Resolution",
  "Empathy",
  "Product knowledge - Client defined",
  "CRM usage",
  "Custom area of coaching",
];

const INTERACTIONS = [
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
    id: "qd-014-77c1-4b20-a901-qa-direct-0014",
    short: "qd-014…0014",
    agent: "j.brooks",
    agentName: "J. Brooks",
    duration: "1m 40s",
    queue: "UHC_Refill_Status",
    lob: "Medicaid Pharmacy",
    channel: "ude",
    source: "api_pull",
    intent: "rx_refill_request",
    sentiment: "neutral",
    escalated: false,
    status: "QA Direct",
    auditMode: "qa-direct",
    formVersion: "short-call",
    score: "91",
    date: "2026-09-10",
    llmExcluded: true,
  },
  {
    id: "qd-015-88d2-4c31-b012-qa-direct-0015",
    short: "qd-015…0015",
    agent: "p.ellis",
    agentName: "P. Ellis",
    duration: "6m 05s",
    queue: "247client1_Web_Chat",
    lob: "Cards",
    channel: "ude",
    source: "csv",
    intent: "fee_waiver",
    sentiment: "negative",
    escalated: false,
    status: "QA Direct",
    auditMode: "qa-direct",
    formVersion: "supervisor",
    score: "78",
    date: "2026-09-09",
    llmExcluded: true,
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

const SHORT_CALL_QUESTIONS = [
  { q: "SC1 Greeting and identification completed", choice: "No", points: "-10" },
  { q: "SC2 Issue resolved or next step stated", choice: "No", points: "-10" },
  { q: "SC3 Required compliance statement delivered", choice: "No", points: "-15" },
];

const SUPERVISOR_QUESTIONS = [
  { q: "SV1 Observed behavior matches policy", choice: "No", points: "-10" },
  { q: "SV2 Customer outcome acceptable", choice: "No", points: "-10" },
  { q: "SV3 Coaching note captured for the agent", choice: "No", points: "-5" },
];

function formName(id) {
  return FORM_VERSIONS.find((f) => f.id === id)?.name || JOB_FORM_VERSIONS.find((f) => f.id === id)?.name || "QRA form";
}

function isPartialForm(id) {
  return id === "short-call" || id === "supervisor";
}

function questionsForForm(id) {
  if (id === "short-call") return SHORT_CALL_QUESTIONS;
  if (id === "supervisor") return SUPERVISOR_QUESTIONS;
  return AUDIT_QUESTIONS;
}

function sectionTitleForForm(id) {
  if (id === "short-call") return "Short call checks";
  if (id === "supervisor") return "Supervisor observation";
  return "Soft Skills and Professionalism";
}

INTERACTIONS.forEach((i) => {
  if (i.formVersion) return;
  if (i.auditMode === "llm" || i.auditMode === "hybrid") i.formVersion = "llm";
  else if (i.auditMode === "manual") i.formVersion = "qra";
  else i.formVersion = "";
});

const COACHING = [
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
  if (c.level === "agent") {
    c.assignedBy = ["c1", "c3", "c6", "c9"].includes(c.id) ? "human" : "llm";
    c.defectRate = `${Math.round((c.fails / c.audits) * 100)}%`;
    const actionPack = {
      Disclosures: ["Review the disclosure script before the next chat", "Complete the disclosure quiz", "Compare one gold-standard refill call"],
      "Soft skills": ["Use the empathy opener before escalating", "Replay two escalate turns", "Confirm the soft-skills checklist with your coach"],
      Resolution: ["Close every chat with the next-step checklist", "Practice the payment or refill confirm", "Mark one recent chat that missed the close"],
      Compliance: ["Complete primary and secondary verification", "Pin the auth script on the desktop", "Review the five missed-verification audits"],
      "Peer coach": ["Keep the current approach", "Share one example in the team huddle", "Stay available as a calibration peer"],
      Clarity: ["Name the product before the upsell", "Slow the close by one beat", "Check the last three product chats"],
    };
    c.actions = actionPack[c.theme] || ["Review recent audits", "Practice the focus behavior", "Confirm the plan with your coach"];
  }
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


const CLOUD_CONNECTIONS = [
  {
    id: "aws-s3",
    name: "Amazon S3",
    provider: "AWS",
    status: "Connected",
    region: "us-east-1",
    bucket: "247client1-autoqra-ingest",
    path: "inbound/qra/",
    direction: "Ingest + Export",
  },
  {
    id: "azure-blob",
    name: "Azure Blob Storage",
    provider: "Azure",
    status: "Available",
    region: "eastus",
    bucket: "autoqra-container",
    path: "imports/",
    direction: "Ingest",
  },
  {
    id: "gcp-gcs",
    name: "Google Cloud Storage",
    provider: "GCP",
    status: "Available",
    region: "us-central1",
    bucket: "247client1-gcs-qra",
    path: "autoqra/",
    direction: "Export",
  },
  {
    id: "aws-s3-export",
    name: "Amazon S3 (export)",
    provider: "AWS",
    status: "Connected",
    region: "us-west-2",
    bucket: "247client1-autoqra-export",
    path: "outbound/results/",
    direction: "Export / Push",
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
const userChip = document.getElementById("userChip");
const roleButtons = [...document.querySelectorAll("[data-role]")];

if (!workspace) {
  document.body.innerHTML =
    "<pre style='padding:1.5rem;font:14px/1.4 system-ui'>AutoQRA wireframe: #workspace not found.\n\nServe from the autoqra-wireframe folder:\n  cd autoqra-wireframe && python3 -m http.server 8765\nThen open http://127.0.0.1:8765/</pre>";
  throw new Error("Missing #workspace — open via local http.server from autoqra-wireframe/");
}

let currentView = "interactions";
let selectedIx = null; // null = list view
let ixSideTab = "audit";
let currentRole = "qa";
const AGENT_NAME = "R. Patel";
const AGENT_PERFORMANCE_TARGET = 85;
const AGENT_PERFORMANCE_WEEKS = [
  { week: "Aug 17–23", monitored: 11, scores: { "Soft skills": 78, Compliance: 84, Disclosures: 63, Resolution: 76, Empathy: 79, "Product knowledge - Client defined": 70, "CRM usage": 74, "Custom area of coaching": 68 } },
  { week: "Aug 24–30", monitored: 11, scores: { "Soft skills": 80, Compliance: 85, Disclosures: 68, Resolution: 78, Empathy: 81, "Product knowledge - Client defined": 73, "CRM usage": 76, "Custom area of coaching": 71 } },
  { week: "Aug 31–Sep 6", monitored: 11, scores: { "Soft skills": 82, Compliance: 87, Disclosures: 74, Resolution: 80, Empathy: 83, "Product knowledge - Client defined": 76, "CRM usage": 79, "Custom area of coaching": 74 } },
  { week: "Sep 7–13", monitored: 11, scores: { "Soft skills": 84, Compliance: 89, Disclosures: 78, Resolution: 82, Empathy: 86, "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 77 } },
];
const PATEL_MONITORING_SCORES = [
  { "Soft skills": 82, Compliance: 88, Disclosures: 74, Resolution: 80, Empathy: 84, "Product knowledge - Client defined": 78, "CRM usage": 81, "Custom area of coaching": 74 },
  { "Soft skills": 83, Compliance: 89, Disclosures: 76, Resolution: 81, Empathy: 85, "Product knowledge - Client defined": 79, "CRM usage": 82, "Custom area of coaching": 75 },
  { "Soft skills": 84, Compliance: 90, Disclosures: 78, Resolution: 82, Empathy: 86, "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 77 },
  { "Soft skills": 85, Compliance: 91, Disclosures: 80, Resolution: 83, Empathy: 87, "Product knowledge - Client defined": 81, "CRM usage": 84, "Custom area of coaching": 78 },
  { "Soft skills": 84, Compliance: 89, Disclosures: 77, Resolution: 82, Empathy: 86, "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 76 },
  { "Soft skills": 86, Compliance: 92, Disclosures: 81, Resolution: 84, Empathy: 88, "Product knowledge - Client defined": 82, "CRM usage": 85, "Custom area of coaching": 79 },
  { "Soft skills": 83, Compliance: 88, Disclosures: 75, Resolution: 81, Empathy: 85, "Product knowledge - Client defined": 79, "CRM usage": 82, "Custom area of coaching": 75 },
  { "Soft skills": 85, Compliance: 90, Disclosures: 79, Resolution: 83, Empathy: 87, "Product knowledge - Client defined": 81, "CRM usage": 84, "Custom area of coaching": 77 },
  { "Soft skills": 84, Compliance: 89, Disclosures: 78, Resolution: 82, Empathy: 86, "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 77 },
  { "Soft skills": 84, Compliance: 87, Disclosures: 76, Resolution: 80, Empathy: 85, "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 76 },
  { "Soft skills": 84, Compliance: 86, Disclosures: 84, Resolution: 84, Empathy: 87, "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 83 },
];
const PATEL_MONITORING_DATES = ["2026-09-07", "2026-09-07", "2026-09-08", "2026-09-08", "2026-09-08", "2026-09-09", "2026-09-09", "2026-09-09", "2026-09-10", "2026-09-10", "2026-09-10"];
const PATEL_MONITORING_QUEUES = [
  ["UHC_Rx_Refill_Chat", "Commercial Pharmacy", "rx_refill_request"],
  ["UHC_Refill_Status", "Commercial Pharmacy", "rx_refill_request"],
  ["247client1_Web_Chat", "Retail", "balance_inquiry"],
];

function seedPatelInteractions() {
  PATEL_MONITORING_SCORES.forEach((scores, index) => {
    const [queue, lob, intent] = PATEL_MONITORING_QUEUES[index % PATEL_MONITORING_QUEUES.length];
    const overall = Math.round(RUBRIC_AREAS.reduce((sum, area) => sum + scores[area], 0) / RUBRIC_AREAS.length);
    const awaiting = index < 8;
    INTERACTIONS.push({
      id: `patel-mon-${String(index + 1).padStart(2, "0")}`,
      short: `mon-${String(index + 1).padStart(2, "0")}`,
      agent: "r.patel",
      agentName: AGENT_NAME,
      duration: `${2 + (index % 4)}m ${String(10 + index * 3).padStart(2, "0")}s`,
      queue,
      lob,
      channel: "ude",
      source: index % 2 ? "csv" : "api_pull",
      intent,
      sentiment: scores.Disclosures < 78 ? "neutral" : "positive",
      escalated: false,
      status: awaiting ? "QA Reviewed" : "Complete",
      auditMode: "hybrid",
      formVersion: "llm",
      score: String(overall),
      rubricScores: scores,
      date: PATEL_MONITORING_DATES[index],
      agentDecision: awaiting ? null : "accepted",
    });
  });
}
seedPatelInteractions();
const AGENT_TRAINING_MODULES = [
  { id: "tm1", name: "Disclosure script essentials", rubric: "Disclosures", assignedBy: "Supervisor", status: "Completed", helpRequested: false },
  { id: "tm2", name: "Empathy during escalation", rubric: "Empathy", assignedBy: "LLM", status: "Completed", helpRequested: false },
  { id: "tm3", name: "Closing the resolution loop", rubric: "Resolution", assignedBy: "Supervisor", status: "Assigned", helpRequested: false },
  { id: "tm4", name: "Clear and confident communication", rubric: "Soft skills", assignedBy: "LLM", status: "Assigned", helpRequested: false },
];
const TEAM_TRAINING_MODULES = [
  { agent: "M. Chen", name: "Empathy opener practice", rubric: "Soft skills", status: "Completed", helpRequested: false },
  { agent: "A. Nguyen", name: "Payment close checklist", rubric: "Resolution", status: "Assigned", helpRequested: true },
  { agent: "J. Brooks", name: "Verification refresher", rubric: "Compliance", status: "Completed", helpRequested: false },
  { agent: "P. Ellis", name: "Client-defined product scenarios", rubric: "Product knowledge - Client defined", status: "Assigned", helpRequested: false },
];
let dataTab = "ingest";
let selectedCloud = "aws-s3";
let samplingTab = "jobs";
let settingsTab = "admin";
let selectedCoach = null;
let coachingTab = "overall";
let overallPeriod = "MTD";
let reportFilters = { lob: "All", queue: "All", period: "MTD", section: "Soft skills", rank: "Top 10" };
let selectedAgentView = "R. Patel";
let agentPeriod = "MTD";
let jobName = "247client1 weekly AutoQRA";
let jobType = "AutoQRA scoring";
let jobDateFrom = "2026-09-01";
let jobDateTo = "2026-09-10";
let jobOpenEnded = false;
let jobFormVersion = "llm";
let jobRubrics = ["Disclosures"];
let jobRequested = "10";
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

let openTeamMsKey = null;

function teamMsField(label, key, options) {
  const selected = teamFilters[key] || [];
  const chips = selected.length
    ? selected.map((value) => `<span class="chip">${value} <button type="button" data-team-ms-remove="${key}|${value}">×</button></span>`).join("")
    : `<span class="placeholder">All</span>`;
  const opts = options
    .map(
      (option) => `
      <label class="ms-option">
        <input type="checkbox" data-team-ms-toggle="${key}|${option}" ${selected.includes(option) ? "checked" : ""} />
        <span>${option}</span>
      </label>`
    )
    .join("");
  return `
    <div class="field ms-wrap">
      <label>${label}</label>
      <button class="ms-trigger" type="button" data-team-ms-open="${key}">${chips}</button>
      <div class="ms-dropdown" ${openTeamMsKey === key ? "" : "hidden"}>${opts}</div>
    </div>`;
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

function futureCallout(message) {
  return `
    <div class="future-callout">
      <span class="future-badge">Future development · Post-MVP</span>
      <span>${message}</span>
    </div>`;
}

function renderOverview() {
  // Kept for compatibility; Feature Map lives under Settings → About
  return renderAboutBody();
}

function displayScore(ix) {
  if (!ix || ix.score === "—" || ix.score == null || ix.score === "") return "—";
  return ix.rubricScores ? `${ix.score}%` : ix.score;
}

function rubricScoreChips(ix) {
  if (!ix.rubricScores) return "";
  return RUBRIC_AREAS.map((area) => `<div class="score-chip"><b>${ix.rubricScores[area]}%</b>${area}</div>`).join("");
}

function patelCoachingPlans() {
  const current = AGENT_PERFORMANCE_WEEKS[AGENT_PERFORMANCE_WEEKS.length - 1];
  const first = AGENT_PERFORMANCE_WEEKS[0];
  return AGENT_TRAINING_MODULES.map((module) => {
    const score = current.scores[module.rubric];
    const severity = score < 80 ? "high" : score < 85 ? "med" : "low";
    return {
      id: module.id,
      agent: AGENT_NAME,
      team: "Team Pharmacy",
      lob: "Commercial Pharmacy",
      queue: "UHC_Rx_Refill_Chat",
      level: "agent",
      theme: module.name,
      rubric: module.rubric,
      audits: current.monitored,
      monitoring: current.monitored,
      fails: Math.round(((100 - score) / 100) * current.monitored),
      severity,
      defectRate: `${100 - score}%`,
      assignedBy: module.assignedBy === "Supervisor" ? "human" : "llm",
      moduleStatus: module.status,
      opportunity: `${module.rubric} is ${score}% for ${current.week} across ${current.monitored} randomly monitored conversations, compared with ${first.scores[module.rubric]}% in ${first.week}.`,
      actions: module.status === "Completed"
        ? ["Module completed", "Scores update on the next monitoring week"]
        : ["Complete the assigned training module", "Apply the behavior on the next monitored conversations"],
      sampleAudits: AGENT_PERFORMANCE_WEEKS.map((week) => ({
        id: week.week,
        date: week.week,
        score: `${week.scores[module.rubric]}%`,
        defect: `${module.rubric} ${week.scores[module.rubric]}%`,
      })),
    };
  });
}

function statusClass(status) {
  if (status === "Complete" || status === "QA Reviewed") return "ok";
  if (status === "Pending Dispute") return "bad";
  if (status === "LLM Audited") return "warn";
  if (status === "QA Direct") return "direct";
  return "neutral";
}

function auditModeLabel(mode) {
  if (mode === "manual") return "Manual audit";
  if (mode === "hybrid") return "Hybrid audit";
  if (mode === "llm") return "LLM audit";
  if (mode === "qa-direct") return "QA Direct";
  return "Not audited";
}

function interactionFormForJob(jobForm) {
  if (jobForm === "llm") return "llm";
  if (jobForm === "short-form" || jobForm === "short-call") return "short-call";
  return "qra";
}

function activeFormId(ix) {
  if (ix.formVersion) return ix.formVersion;
  if (ix.auditMode === "llm" || ix.auditMode === "hybrid") return "llm";
  return interactionFormForJob(jobFormVersion);
}

const TRANSCRIPT_SCENARIOS = {
  balance_inquiry: {
    request: "I need to confirm my available balance before I make a payment.",
    handoff: "I can help route your balance question. A specialist will join now.",
    greeting: "Hi, I’m {agent}. I can check that for you. Before I access the account, please confirm your full name and the last four digits of your member number.",
    verification: "It’s Jordan Lee, and the last four digits are 4912.",
    action: "Thank you, Jordan. I know it is important to have the right figure before making a payment. Your available balance is $428.16, with no pending holds.",
    confirmation: "Great, so $428.16 is available to use today?",
    close: "That’s correct. The balance can change if a pending transaction arrives. Is there anything else I can clarify before we close the chat?",
  },
  password_reset: {
    request: "I’m locked out and the password reset link is not working.",
    handoff: "I’ll connect you with an account-access specialist.",
    greeting: "Hi, I’m {agent}. I’m sorry you have been blocked from signing in. Before we reset access, please confirm your name and the last four digits of your member number.",
    verification: "Sam Okonkwo, last four 3084.",
    action: "Thanks, Sam. I verified the account and sent a new one-time reset link to the email ending in @example.com. It expires in 15 minutes.",
    confirmation: "I received it and the new link opened.",
    close: "Perfect. Please create a unique password and do not share the one-time link. You can sign in immediately after saving it. Is there anything else you need?",
  },
  rx_refill_request: {
    request: "I need to refill my prescription and want to know when it will be ready.",
    handoff: "I’ll bring in a refill specialist to review the request.",
    greeting: "Hi, I’m {agent}. I’ll help with the refill. For privacy, please confirm your full name, date of birth, and the last four digits of your member number.",
    verification: "Taylor Morgan, May 12, 1984, and 7721.",
    action: "Thank you. I found the prescription and submitted the refill to your pharmacy. I understand you need it soon; the estimated ready time is tomorrow after 2 PM.",
    confirmation: "Will the pharmacy message me when it is ready?",
    close: "Yes. The pharmacy will send a pickup notification. Timing can change if the pharmacist needs prescriber approval, and they will contact you if that happens. Anything else I can help with?",
  },
  fee_waiver: {
    request: "I was charged a late fee even though I paid as soon as I noticed the balance.",
    handoff: "I’ll connect you with a billing specialist who can review the fee.",
    greeting: "Hi, I’m {agent}. I’m sorry the fee was unexpected. Before I review billing details, please confirm your name and the last four digits of the account.",
    verification: "Pat Ellis, account ending 6408.",
    action: "Thank you, Pat. I reviewed the payment history and submitted a one-time $25 fee waiver. I understand why you wanted this checked.",
    confirmation: "Does that mean the $25 comes off today?",
    close: "The credit is approved and should appear within two business days. Future fees depend on payment timing under the account terms. Is there anything else I can review?",
  },
  "fraud-unauthorized-charges": {
    request: "I see a charge I did not make on my account.",
    handoff: "I’m connecting you with a fraud specialist. Please do not share a password or one-time code in chat.",
    greeting: "Hi, I’m {agent}. I’m sorry you are dealing with an unfamiliar charge. To protect the account, please confirm your full name and the last four digits of your member number.",
    verification: "Jordan Lee, and the last four digits are 4912.",
    action: "Thank you, Jordan. I verified the account, restricted the card, and opened fraud case 88214 for the $74.20 charge. You will not be responsible while the review is active.",
    confirmation: "Will I receive confirmation and a replacement card?",
    close: "Yes. Confirmation will arrive by email today, and the replacement card should arrive in five to seven business days. Please review recent activity and contact us if you see another charge.",
  },
  address_update: {
    request: "I moved and need to update the mailing address on my account.",
    handoff: "I’ll connect you with an account-maintenance specialist.",
    greeting: "Hi, I’m {agent}. I can update the address. For security, please confirm your full name and the last four digits of your member number.",
    verification: "Morgan Chen, last four 2219.",
    action: "Thank you, Morgan. I verified the account and updated the mailing address to the one you provided. I know receiving documents at the correct address is important.",
    confirmation: "Will new statements go there immediately?",
    close: "Yes, future statements will use the new address. A statement already in production may still go to the previous address. Is there anything else to update?",
  },
  payment_arrangement: {
    request: "I cannot pay the full balance today and need to discuss a payment plan.",
    handoff: "I’ll connect you with a payment-support specialist.",
    greeting: "Hi, I’m {agent}. I understand this can be stressful, and I’ll review the available options. First, please confirm your name and the last four account digits.",
    verification: "Alex Nguyen, account ending 8450.",
    action: "Thank you, Alex. You qualify for two payments of $120, due September 15 and September 30. No additional arrangement fee applies.",
    confirmation: "That works. What happens if a payment is late?",
    close: "A missed installment may cancel the arrangement and standard fees could apply. I have scheduled both dates and sent written confirmation. Is there anything else you would like me to explain?",
  },
  product_inquiry: {
    request: "Can you explain the difference between the standard and premium plans?",
    handoff: "I’ll connect you with a product specialist.",
    greeting: "Hi, I’m {agent}. I can compare those plans. Before viewing account-specific eligibility, please confirm your name and the last four digits of your member number.",
    verification: "Taylor Morales, last four 9317.",
    action: "Thank you. The standard plan covers core support, while premium adds priority support and expanded protection for $12 per month. Based on your account, both are available.",
    confirmation: "Can I try premium and cancel later?",
    close: "Yes. You may cancel before the next billing cycle, but charges already posted are not prorated. I can send the full terms before you decide. Anything else you want to compare?",
  },
};

function transcriptTurns(ix) {
  const scenario = TRANSCRIPT_SCENARIOS[ix.intent] || {
    request: "I need help with an issue on my account.",
    handoff: "I’ll connect you with a specialist who can review the request.",
    greeting: "Hi, I’m {agent}. I’ll be glad to help. Before accessing the account, please confirm your name and the last four digits of your member number.",
    verification: "Jordan Lee, last four 4912.",
    action: "Thank you. I verified the account, reviewed the request, and completed the available next step. I understand why resolving this matters.",
    confirmation: "Can you confirm what happens next?",
    close: "The update is complete, and confirmation will arrive today. Standard account terms still apply. Is there anything else I can clarify?",
  };
  const withAgent = (text) => text.replace("{agent}", ix.agentName);
  return [
    { role: "bot", speaker: "Bot", time: "11:45 AM", text: "Welcome to 247client1 support. Briefly describe what you need help with today." },
    { role: "visitor", speaker: "Visitor", time: "11:45 AM", text: scenario.request },
    { role: "bot", speaker: "Bot", time: "11:46 AM", text: scenario.handoff },
    { role: "agent", speaker: `${ix.agentName} · Agent`, time: "11:47 AM", text: withAgent(scenario.greeting) },
    { role: "visitor", speaker: "Visitor", time: "11:48 AM", text: scenario.verification },
    { role: "agent", speaker: `${ix.agentName} · Agent`, time: "11:49 AM", text: withAgent(scenario.action) },
    { role: "visitor", speaker: "Visitor", time: "11:50 AM", text: scenario.confirmation },
    { role: "agent", speaker: `${ix.agentName} · Agent`, time: "11:51 AM", text: withAgent(scenario.close) },
  ];
}

function renderTranscript(ix) {
  return transcriptTurns(ix)
    .map(
      (turn) => `
        <div class="bubble ${turn.role}">
          <div class="who">${turn.speaker} · ${turn.time}</div>
          ${turn.text}
        </div>`
    )
    .join("");
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
      <td>${displayScore(i)}</td>
      <td>${i.duration}</td>
    </tr>`
    )
    .join("");

  const empty = rowsData.length
    ? ""
    : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:1.25rem">No transaction reviews match the selected filters.</td></tr>`;

  return `
    <div class="ix-list-page">
      <h1 class="page-title">Transaction Review</h1>
      <p class="page-sub">Filter by audit status (Not Audited · LLM Audited · QA Direct · QA Reviewed · Pending Dispute · Complete). QA Direct is scored by a person with no LLM review.</p>
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
      <p class="hint" style="margin-top:0.65rem;color:var(--muted);font-size:0.85rem">${rowsData.length} of ${INTERACTIONS.length} transaction reviews · multi-select filters · click a row to open detail</p>
    </div>`;
}

function sampleAverages(rows) {
  const scored = rows.filter((i) => i.rubricScores);
  const scores = {};
  RUBRIC_AREAS.forEach((area) => {
    scores[area] = scored.length ? Math.round(scored.reduce((sum, i) => sum + i.rubricScores[area], 0) / scored.length) : 0;
  });
  return { count: scored.length, scores, overall: scored.length ? weeklyOverall({ scores }) : 0 };
}

function renderAgentInteractionsList() {
  const rowsData = INTERACTIONS.filter((i) => i.agentName === AGENT_NAME);
  const sample = sampleAverages(rowsData);
  const pending = rowsData.filter((i) => ["LLM Audited", "QA Direct", "QA Reviewed"].includes(i.status)).length;
  const disputes = rowsData.filter((i) => i.status === "Pending Dispute").length;
  const rows = rowsData
    .map(
      (i) => `
    <tr class="clickable" data-open-ix="${i.id}">
      <td>${i.short}</td>
      <td>${i.date}</td>
      <td>${i.queue}</td>
      <td>${i.intent}</td>
      <td><span class="status ${statusClass(i.status)}">${i.status}</span></td>
      <td>${displayScore(i)}</td>
      <td>${i.duration}</td>
    </tr>`
    )
    .join("");

  return `
    <div class="ix-list-page agent-interactions">
      <h1 class="page-title">Transaction Review <span class="future-badge">Future development · Post-MVP</span></h1>
      <p class="page-sub">Welcome, ${AGENT_NAME}. Review your conversations and respond to completed QA feedback.</p>
      ${futureCallout("Agent view is a future-development preview and is not included in the MVP.")}
      <div class="unavailable-preview">
        <div class="stat-row">
          <div class="stat"><div class="label">My conversations</div><div class="value">${rowsData.length}</div></div>
          <div class="stat"><div class="label">Monitored this week</div><div class="value">${sample.count}</div></div>
          <div class="stat"><div class="label">Overall score</div><div class="value">${sample.overall}%</div></div>
          <div class="stat"><div class="label">Awaiting my response</div><div class="value">${pending}</div></div>
          <div class="stat"><div class="label">Open disputes</div><div class="value">${disputes}</div></div>
        </div>
        <div class="callout">This week’s random monitoring sample is ${sample.count} conversations. Overall ${sample.overall}% · ${RUBRIC_AREAS.map((area) => `${area} ${sample.scores[area]}%`).join(" · ")}.</div>
        <div class="ix-table-wrap">
          <table class="table">
            <thead>
              <tr><th>Conversation</th><th>Date</th><th>Queue</th><th>Intent</th><th>Status</th><th>Score</th><th>Duration</th></tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:1.25rem">No conversations are assigned to this agent.</td></tr>`}</tbody>
          </table>
        </div>
        <p class="hint" style="margin-top:0.65rem;color:var(--muted);font-size:0.85rem">Select a conversation to view its transcript, audit, details, and history.</p>
      </div>
    </div>`;
}

function agentAuditEvidence(ix, questionIndex) {
  const agentTurns = transcriptTurns(ix).filter((turn) => turn.role === "agent");
  const greeting = agentTurns[0]?.text || "";
  const action = agentTurns[1]?.text || "";
  const close = agentTurns[2]?.text || "";
  const evidence = [
    `${ix.agentName} greeted the visitor and completed the required verification before accessing account details: “${greeting}”`,
    `${ix.agentName} used a proportionate empathy statement and did not repeat apologies unnecessarily.`,
    `${ix.agentName} acknowledged the visitor’s concern and paired empathy with a concrete action: “${action}”`,
    `${ix.agentName} explained the outcome, set expectations, and offered further assistance: “${close}”`,
    `${ix.agentName} maintained a calm, clear tone through verification, action, and resolution.`,
  ];
  return evidence[questionIndex] || evidence[3];
}

function interactionSummary(ix) {
  const agentTurns = transcriptTurns(ix).filter((turn) => turn.role === "agent");
  return `The bot collected the intent and handed the conversation to ${ix.agentName}. The agent verified the visitor, responded with empathy, completed the requested action, explained relevant conditions, and confirmed the next step. Closing evidence: “${agentTurns[2]?.text || ""}”`;
}

function renderAgentAudit(ix) {
  const isNotAudited = ix.status === "Not Audited";
  const isComplete = ix.status === "Complete";
  const isDispute = ix.status === "Pending Dispute";
  const formId = activeFormId(ix);
  const questions = questionsForForm(formId);

  if (isNotAudited) {
    return `
      <div class="audit-form">
        <h3>QA review</h3>
        <div class="callout">This conversation has not been audited yet. A score and monitoring form will appear here after QA completes its review.</div>
      </div>`;
  }

  const questionCards = questions
    .map(
      (q, index) => `
      <div class="q-card">
        <div class="q-title">${q.q}</div>
        <div class="ai-note">${agentAuditEvidence(ix, index)}</div>
        <div class="choice-row">
          <button class="choice ${q.choice === "Yes" ? "selected" : ""}" type="button" disabled>Yes (${q.points})</button>
          <button class="choice ${q.choice !== "Yes" ? "selected" : ""}" type="button" disabled>No${q.choice !== "Yes" ? " ✓" : ""}</button>
          <button class="choice" type="button" disabled>NA</button>
        </div>
      </div>`
    )
    .join("");

  const response =
    isComplete
      ? `<div class="ack-box"><span class="status ok">Acknowledged</span><strong>Your response</strong><br/>You accepted this audit. Feedback is complete.</div>`
      : isDispute
        ? `<div class="ack-box" style="border-color:#e0b36a;background:var(--warn-bg)"><span class="status warn">Dispute open</span><strong>Your response</strong><br/>Your dispute was sent to QA for review.</div>`
        : `<div class="callout">Review this read-only audit, then acknowledge the feedback or raise a dispute.</div>
           <div class="btn-row">
             <button class="btn primary" type="button" data-agent-accept>Accept &amp; acknowledge</button>
             <button class="btn" type="button" data-agent-dispute>Dispute score</button>
           </div>`;

  return `
    <div class="audit-form">
      <h3>My QA feedback</h3>
      <p class="hint" style="margin:0 0 0.55rem">Status: <strong>${ix.status}</strong> · <span class="chip">${formName(formId)}</span></p>
      <div class="score-summary">
        ${ix.rubricScores
          ? `<div class="score-chip"><b>${displayScore(ix)}</b>Overall</div>${rubricScoreChips(ix)}`
          : `<div class="score-chip"><b>${ix.score}</b>Overall</div>
             <div class="score-chip"><b>20/20</b>Soft skills</div>
             <div class="score-chip"><b>Pass</b>Compliance</div>`}
      </div>
      <div class="section-block">
        <div class="section-head"><span>${sectionTitleForForm(formId)}</span><span>Read only</span></div>
        ${questionCards}
      </div>
      ${response}
    </div>`;
}

function renderAuditForm(ix) {
  const isNotAudited = ix.status === "Not Audited";
  const isLlm = ix.status === "LLM Audited";
  const isQaDirect = ix.status === "QA Direct";
  const isQaReviewed = ix.status === "QA Reviewed";
  const isDispute = ix.status === "Pending Dispute";
  const isComplete = ix.status === "Complete";
  const formId = activeFormId(ix);
  const formLocked = isQaDirect || isQaReviewed || isComplete;
  const questions = questionsForForm(formId);
  const partial = isPartialForm(formId);

  const overrideDisabled = isQaReviewed || isComplete || isQaDirect;
  const showAi = formId === "llm" && !isNotAudited && !isQaDirect;
  const showAck = isComplete;
  const showScores = !isNotAudited;

  const questionCards = questions.map((q, index) => {
    const selected = isNotAudited ? "" : q.choice || "No";
    const evidence = agentAuditEvidence(ix, index);
    const note = showAi
      ? `<div class="ai-note">AI: ${evidence}</div>`
      : `<div class="ai-note" style="color:var(--muted)">${isQaDirect ? "Human rationale — no LLM review on this conversation" : "No AI rationale — manual scoring"}</div>`;
    const rationale = isNotAudited ? "" : evidence;
    return `
    <div class="q-card">
      <span class="priority">${partial ? "partial" : "high"}</span>
      <div class="q-title">${q.q}</div>
      ${note}
      <div class="choice-row">
        <button class="choice ${selected === "Yes" ? "selected" : ""}" type="button" ${overrideDisabled ? "disabled" : ""}>Yes (${q.points})</button>
        <button class="choice ${selected === "No" ? "selected" : ""}" type="button" ${overrideDisabled ? "disabled" : ""}>No${selected === "No" ? " ✓" : ""}</button>
        <button class="choice" type="button" ${overrideDisabled ? "disabled" : ""}>NA</button>
      </div>
      <div class="field"><textarea ${overrideDisabled ? "readonly" : ""} placeholder="Enter auditor rationale…">${rationale}</textarea></div>
    </div>`;
  }).join("");

  const formOptions = FORM_VERSIONS.map(
    (f) => `<option value="${f.id}" ${formId === f.id ? "selected" : ""}>${f.name}</option>`
  ).join("");
  const modeBadge = `<span class="chip">${auditModeLabel(ix.auditMode)}</span>`;
  const formBadge = `<span class="chip">${formName(formId)}${partial ? " · partial" : ""}</span>`;
  const statusBanner = isNotAudited
    ? `<div class="callout">Not Audited — pick a form and score this conversation directly. Submitting creates a QA Direct audit. The LLM will not review it, and the ratings feed LLM improvement.</div>`
    : isQaDirect
      ? `<div class="callout">QA Direct — a person scored this conversation with no LLM review. Later scoring jobs skip it. These ratings are queued as feedback to improve the LLM.</div>`
      : isLlm
        ? `<div class="callout">LLM Audited — AI scores present, not submitted. Human override enabled. Switch the form if this should be scored on a partial monitoring form.</div>`
        : isQaReviewed
          ? `<div class="callout">QA Reviewed (${auditModeLabel(ix.auditMode)}) — review after an LLM audit. Human override greyed out.</div>`
          : isDispute
            ? `<div class="callout">Pending Dispute — human override enabled for ${auditModeLabel(ix.auditMode)}.</div>`
            : `<div class="callout">Complete — agent feedback acknowledged. Audit locked.</div>`;

  const sectionScore = isNotAudited ? "—" : partial ? `${questions.length}/${questions.length}` : "20/20";

  return `
    <div class="audit-form">
      <h3>247client1 Chat Quality Assurance Monitoring Form</h3>
      <p class="hint" style="margin:0 0 0.55rem">Status: <strong>${ix.status}</strong> · ${modeBadge} · ${formBadge}</p>
      ${statusBanner}

      ${
        showAi
          ? `<div class="genai-box">
        <strong>GenAI summary</strong>
        ${interactionSummary(ix)} ${ix.rubricScores ? `This monitored conversation scored ${displayScore(ix)} overall, with Disclosures at ${ix.rubricScores.Disclosures}%.` : "The scoring evidence comes from the human-agent turns, not the bot handoff."}
      </div>`
          : isQaDirect
            ? `<div class="ack-box">
        <span class="status direct">LLM excluded</span>
        <strong>QA feedback loop</strong><br/>
        Ratings on ${formName(formId)} are queued to improve the LLM. This conversation is excluded from later scoring jobs.
      </div>`
            : `<div class="genai-box" style="opacity:0.7">
        <strong>GenAI summary</strong>
        Not used on this form. ${partial ? "Partial form — only the short monitoring items are scored." : "Complete the monitoring form manually."}
      </div>`
      }

      <div class="score-summary">
        ${ix.rubricScores && showScores
          ? `<div class="score-chip"><b>${displayScore(ix)}</b>Overall</div>${rubricScoreChips(ix)}`
          : `<div class="score-chip"><b>${showScores && ix.score !== "—" ? ix.score : "—"}</b>Overall</div>
             <div class="score-chip"><b>${sectionScore}</b>${partial ? "Items" : "Soft skills"}</div>
             <div class="score-chip"><b>${showScores ? "Pass" : "—"}</b>Compliance</div>
             <div class="score-chip"><b>${formName(formId)}</b>Form</div>`}
      </div>

      <div class="audit-meta">
        <div class="field"><label>Agent EmpId</label><input value="A10482" readonly /></div>
        <div class="field"><label>Manager Name</label><input value="S. Miles" readonly /></div>
        <div class="field"><label>Customer Name</label><input value="Jordan Lee" readonly /></div>
        <div class="field"><label>Agent Category</label><input value="Chat Tier 1" readonly /></div>
        <div class="field"><label>Evaluator</label><input value="${isNotAudited ? "" : isQaDirect ? "QA Analyst" : "ci_autoqra"}" placeholder="Assign evaluator" ${isComplete || isQaDirect ? "readonly" : ""} /></div>
        <div class="field"><label>Form version</label>
          <select data-ix-form ${formLocked ? "disabled" : ""}>
            ${formOptions}
          </select>
        </div>
      </div>
      <p class="hint" style="margin:0 0 0.55rem">Job default is <strong>${formName(jobFormVersion)}</strong>. The form selected here overrides that default for this conversation.</p>
      <p style="font-size:0.82rem;margin:0 0 0.55rem">AutoQRA status: <strong>${ix.status}</strong>
        <button class="btn" type="button" style="margin-left:0.5rem" ${isComplete || isQaDirect ? "disabled" : ""}>▶ Start timer</button>
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
          <span>${sectionTitleForForm(formId)}</span>
          <span>${sectionScore}</span>
        </div>
        ${questionCards}
      </div>
      <div class="btn-row">
        ${
          isNotAudited
            ? `<button class="btn primary" type="button" data-qa-direct-submit>Submit QA Direct audit</button>
               <button class="btn" type="button">Save draft</button>`
            : isQaDirect
              ? `<button class="btn" type="button" disabled title="LLM will not review a QA Direct conversation">Send to LLM</button>
                 <button class="btn" type="button">View feedback record</button>`
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
  const isQaDirect = ix.status === "QA Direct";

  const details = `
    <h3 style="margin:0 0 0.55rem;font-size:0.95rem">Conversation details</h3>
    <dl class="kv">
      <dt>Conversation ID</dt><dd>${ix.id}</dd>
      <dt>Status</dt><dd><span class="status ${statusClass(ix.status)}">${ix.status}</span></dd>
      <dt>Audit mode</dt><dd>${auditModeLabel(ix.auditMode)}</dd>
      <dt>Form</dt><dd>${ix.formVersion ? formName(ix.formVersion) : "Not selected"}</dd>
      ${currentRole === "qa" ? `<dt>LLM review</dt><dd>${isQaDirect ? '<span class="status direct">Excluded</span>' : isNotAudited ? "Not run" : "Eligible"}</dd>` : ""}
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
      ? `<tr><td>—</td><td>No audit events yet · QA can score this conversation directly</td></tr>`
      : isQaDirect
        ? `<tr><td>09:40</td><td>QA Direct audit submitted · ${formName(ix.formVersion)}</td></tr>
           <tr><td>09:40</td><td>LLM review skipped — conversation excluded from scoring jobs</td></tr>
           <tr><td>09:41</td><td>Ratings queued for the LLM improvement feedback loop</td></tr>`
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

  const audit = currentRole === "agent" ? renderAgentAudit(ix) : renderAuditForm(ix);
  const sideBody = ixSideTab === "details" ? details : ixSideTab === "history" ? history : audit;
  const agentPreview = currentRole === "agent";

  return `
    <div class="ix-detail-page">
      ${agentPreview ? `<h1 class="page-title">Interaction <span class="future-badge">Future development · Post-MVP</span></h1>${futureCallout("Agent view is a future-development preview and is not included in the MVP.")}` : ""}
      <div class="${agentPreview ? "unavailable-preview" : ""}">
      <div class="ix-detail-toolbar">
        <button class="btn" type="button" data-ix-back>← Back to Transaction Review</button>
        <div class="ix-trans-meta">${ix.short} · ${ix.status} · ${ix.queue} · ${ix.agentName} · ${ix.duration}</div>
      </div>
      <div class="ix-layout">
        <section class="ix-transcript">
          <div class="ix-trans-head">
            <div>
              <h2>Transcript</h2>
              <div class="ix-trans-meta">${ix.id}</div>
            </div>
          </div>
          <div class="search-row"><input placeholder="Search transcript..." /></div>
          <div class="transcript-body">${renderTranscript(ix)}</div>
        </section>

        <section class="ix-side">
          <div class="ix-side-tabs">
            <button class="tab ${ixSideTab === "details" ? "active" : ""}" type="button" data-ix-tab="details">Details</button>
            <button class="tab ${ixSideTab === "audit" ? "active" : ""}" type="button" data-ix-tab="audit">Audit</button>
            <button class="tab ${ixSideTab === "history" ? "active" : ""}" type="button" data-ix-tab="history">History</button>
          </div>
          <div class="ix-side-body">${sideBody}</div>
        </section>
      </div>
      </div>
    </div>`;
}


function renderInteractions() {
  if (!selectedIx) return currentRole === "agent" ? renderAgentInteractionsList() : renderInteractionsList();
  const ix = INTERACTIONS.find((i) => i.id === selectedIx) || INTERACTIONS[0];
  return renderInteractionDetail(ix);
}

function renderDataImport() {
  const ingest = `
    <p class="hint" style="margin:0 0 0.75rem">Upload CSV or ingest from a connected cloud bucket. SFTP pull is shown as a post-MVP preview.</p>
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
      <div class="card future-card" style="margin:0">
        <h3>SFTP pull (ingest) <span class="future-badge">Future development</span></h3>
        <p class="hint">Post-MVP preview: pull files from a remote SFTP folder on a schedule or on demand.</p>
        <div class="grid-filters">
          <div class="field"><label>Host</label><input value="sftp.247client1.com" disabled /></div>
          <div class="field"><label>Port</label><input value="22" disabled /></div>
          <div class="field"><label>Remote path</label><input value="/outbound/qra/" disabled /></div>
          <div class="field"><label>File pattern</label><input value="*.csv" disabled /></div>
        </div>
        <div class="footer-actions">
          <span class="hint">Not included in MVP</span>
          <button class="btn primary" type="button" disabled>Run SFTP pull</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:0.85rem">
      <h3 style="margin:0 0 0.45rem">Cloud bucket ingest</h3>
      <p class="hint" style="margin:0 0 0.65rem">Ingest from a connected cloud. Manage connections under Settings → Cloud connections.</p>
      <div class="grid-filters">
        <div class="field"><label>Cloud</label>
          <select>
            <option>Amazon S3 · 247client1-autoqra-ingest</option>
            <option>Azure Blob · autoqra-container</option>
            <option>Google Cloud Storage · 247client1-gcs-qra</option>
          </select>
        </div>
        <div class="field"><label>Path prefix</label><input value="inbound/qra/" /></div>
        <div class="field"><label>Pattern</label><input value="*.csv" /></div>
      </div>
      <div class="footer-actions"><span class="hint">Uses credentials from Settings → Cloud connections</span><button class="btn primary" type="button">Run cloud ingest</button></div>
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
          <tr class="clickable" data-job="ing_sftp_4412">
            <td style="font-family:var(--mono);font-size:0.75rem">ing_sftp_4412…</td>
            <td><span class="chip">sftp</span></td>
            <td>/outbound/qra/batch_0910.csv</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>420/420</td>
            <td>2026-09-10 06:02:18</td>
          </tr>
          <tr class="clickable" data-job="ing_s3_8821">
            <td style="font-family:var(--mono);font-size:0.75rem">ing_s3_8821…</td>
            <td><span class="chip">aws_s3</span></td>
            <td>s3://…/inbound/qra/day=2026-09-09/</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>1102/1102</td>
            <td>2026-09-09 22:15:03</td>
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
    <p class="hint" style="margin:0 0 0.75rem">Export completed AutoQRA as QRA-Output CSV. SFTP push and cloud destinations are configured under Settings.</p>
    <div class="grid-2">
      <div class="card" style="margin:0">
        <h3>Export AutoQRA (download)</h3>
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
    </div>
    <div class="card" style="margin-top:0.85rem">
      <h3 style="margin:0 0 0.45rem">Recent export jobs</h3>
      <table class="table">
        <thead><tr><th>Job</th><th>Destination</th><th>Status</th><th>Rows</th><th>Updated</th></tr></thead>
        <tbody>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">exp_csv_2201…</td>
            <td><span class="chip">download</span></td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>860</td>
            <td>2026-09-10 10:12</td>
          </tr>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">exp_sftp_1188…</td>
            <td><span class="chip">sftp_push</span></td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>860</td>
            <td>2026-09-10 10:14</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  const body =
    dataTab === "export"
      ? exportTab
      : dataTab === "jobs"
        ? renderJobsPanel()
        : ingest;

  return `
    <h1 class="page-title">Import and export</h1>
    <p class="page-sub">CSV and cloud ingest, AutoQRA export, scoring jobs, and a post-MVP preview for SFTP pull.</p>
    ${tenantRow()}
    <div class="tabs">
      <button class="tab ${dataTab === "ingest" ? "active" : ""}" type="button" data-data-tab="ingest">Ingest <span class="badge">4</span></button>
      <button class="tab ${dataTab === "export" ? "active" : ""}" type="button" data-data-tab="export">Export</button>
      <button class="tab ${dataTab === "jobs" ? "active" : ""}" type="button" data-data-tab="jobs">Jobs</button>
    </div>
    ${body}`;
}

function renderSftpPush() {
  return `
    ${futureCallout("SFTP Push is a future-development preview and is not included in the MVP.")}
    <p class="hint" style="margin:0 0 0.75rem">Post-MVP: push AutoQRA export files to a remote SFTP server after scoring completes.</p>
    <div class="grid-2">
      <div class="card future-card" style="margin:0">
        <h3>SFTP Push configuration <span class="future-badge">Future development</span></h3>
        <div class="grid-filters">
          <div class="field"><label>Host</label><input value="sftp.partner-bank.com" disabled /></div>
          <div class="field"><label>Port</label><input value="22" disabled /></div>
          <div class="field"><label>Username</label><input value="autoqra_push" disabled /></div>
          <div class="field"><label>Auth</label>
            <select disabled><option>SSH private key</option><option>Password</option></select>
          </div>
          <div class="field"><label>Remote path</label><input value="/inbound/autoqra/results/" disabled /></div>
          <div class="field"><label>File name pattern</label><input value="qra_output_{date}.csv" disabled /></div>
          <div class="field"><label>Schedule</label>
            <select disabled><option>After each QA job completes</option><option>Daily 02:00 UTC</option><option>Manual only</option></select>
          </div>
          <div class="field"><label>Compression</label>
            <select disabled><option>None</option><option>gzip</option><option>zip</option></select>
          </div>
        </div>
        <div class="footer-actions">
          <button class="btn" type="button" disabled>Test connection</button>
          <button class="btn primary" type="button" disabled>Save &amp; enable push</button>
        </div>
      </div>
      <div class="card" style="margin:0">
        <h3>Push status <span class="status ok">Enabled</span></h3>
        <dl class="kv">
          <dt>Last push</dt><dd>2026-09-10 10:14:22 UTC</dd>
          <dt>Last file</dt><dd>qra_output_20260910.csv</dd>
          <dt>Bytes</dt><dd>1.4 MB · 860 rows</dd>
          <dt>Result</dt><dd><span class="status ok">OK</span></dd>
          <dt>Next run</dt><dd>On next QA job complete</dd>
        </dl>
        <div class="footer-actions" style="margin-top:0.75rem">
          <span></span>
          <button class="btn primary" type="button" disabled>Push now</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:0.85rem">
      <h3 style="margin:0 0 0.45rem">Recent SFTP push jobs</h3>
      <table class="table">
        <thead><tr><th>Job</th><th>Host / path</th><th>File</th><th>Status</th><th>Rows</th><th>Updated</th></tr></thead>
        <tbody>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">push_1188…</td>
            <td>sftp.partner-bank.com:/inbound/autoqra/results/</td>
            <td>qra_output_20260910.csv</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>860</td>
            <td>2026-09-10 10:14</td>
          </tr>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">push_1044…</td>
            <td>sftp.partner-bank.com:/inbound/autoqra/results/</td>
            <td>qra_output_20260909.csv</td>
            <td><span class="status ok">COMPLETED</span></td>
            <td>742</td>
            <td>2026-09-09 10:11</td>
          </tr>
          <tr>
            <td style="font-family:var(--mono);font-size:0.75rem">push_0991…</td>
            <td>sftp.partner-bank.com:/inbound/autoqra/results/</td>
            <td>qra_output_20260908.csv</td>
            <td><span class="status bad">FAILED</span></td>
            <td>—</td>
            <td>2026-09-08 10:09</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

function renderCloudConnections() {
  const cloud = CLOUD_CONNECTIONS.find((c) => c.id === selectedCloud) || CLOUD_CONNECTIONS[0];
  const cloudCards = CLOUD_CONNECTIONS.map(
    (c) => `
    <button class="cloud-card ${c.id === selectedCloud ? "selected" : ""}" type="button" data-select-cloud="${c.id}">
      <div class="cloud-card-top">
        <strong>${c.name}</strong>
        <span class="status ${c.status === "Connected" ? "ok" : "neutral"}">${c.status}</span>
      </div>
      <div class="hint">${c.provider} · ${c.region}</div>
      <div class="hint" style="margin-top:0.25rem">${c.bucket}</div>
      <div class="chip" style="margin-top:0.45rem">${c.direction}</div>
    </button>`
  ).join("");

  const cloudsTab = `
    <p class="hint" style="margin:0 0 0.75rem">Connect AutoQRA to cloud object stores for ingest and export / push. Select a provider to configure.</p>
    <div class="cloud-grid">${cloudCards}</div>
    <div class="card" style="margin-top:0.85rem">
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start">
        <div>
          <h3 style="margin:0">${cloud.name}</h3>
          <p class="hint" style="margin:0.3rem 0 0">${cloud.provider} · ${cloud.status} · ${cloud.direction}</p>
        </div>
        <div class="btn-row">
          <button class="btn" type="button">Test connection</button>
          <button class="btn primary" type="button">${cloud.status === "Connected" ? "Save config" : "Connect"}</button>
        </div>
      </div>
      <div class="grid-filters" style="margin-top:0.75rem">
        <div class="field"><label>Region</label><input value="${cloud.region}" /></div>
        <div class="field"><label>Bucket / container</label><input value="${cloud.bucket}" /></div>
        <div class="field"><label>Path prefix</label><input value="${cloud.path}" /></div>
        <div class="field"><label>Direction</label>
          <select>
            <option ${cloud.direction.includes("Ingest") && cloud.direction.includes("Export") ? "selected" : ""}>Ingest + Export</option>
            <option ${cloud.direction === "Ingest" ? "selected" : ""}>Ingest only</option>
            <option ${cloud.direction.includes("Export") && !cloud.direction.includes("Ingest") ? "selected" : ""}>Export / Push only</option>
          </select>
        </div>
        <div class="field"><label>Auth</label>
          <select>
            <option>${cloud.provider === "AWS" ? "IAM role / access key" : cloud.provider === "Azure" ? "Service principal / SAS" : "Service account JSON"}</option>
            <option>Workload identity</option>
          </select>
        </div>
        <div class="field"><label>Encryption</label>
          <select><option>SSE (provider managed)</option><option>Customer managed key (CMK)</option><option>None</option></select>
        </div>
      </div>
      <p class="hint" style="margin:0.75rem 0 0">Wireframe only — credentials are not stored. Use Cloud connections here, then pick the destination under Import and export.</p>
    </div>
    <div class="card" style="margin-top:0.85rem">
      <h3 style="margin:0 0 0.45rem">Add another cloud</h3>
      <div class="btn-row">
        <button class="btn" type="button">+ Amazon S3</button>
        <button class="btn" type="button">+ Azure Blob</button>
        <button class="btn" type="button">+ Google Cloud Storage</button>
        <button class="btn" type="button">+ Other (S3-compatible)</button>
      </div>
    </div>`;
  return cloudsTab;
}

function renderDataImportTitle() {
  return `
    <h1 class="page-title">Import and export</h1>
    <p class="page-sub">Ingest, pull, and export conversation data for the selected techclient tenant.</p>`;
}

const SCORING_JOBS = [
  {
    id: "qaj_44a1c2",
    purpose: "Weekly pharmacy AutoQRA batch",
    scope: "UHC · Rx intent",
    from: "2026-09-01",
    to: "2026-09-10",
    openEnded: false,
    form: "llm",
    rubrics: [],
    requested: 10,
    status: "COMPLETED",
    scored: "10 / 10",
    updated: "2026-09-10 12:04",
  },
  {
    id: "qaj_91bc88",
    purpose: "247client1 web chat custom deep dive",
    scope: "247client1_Web_Chat",
    from: "2026-09-03",
    to: "",
    openEnded: true,
    form: "custom",
    rubrics: ["Soft skills", "Empathy"],
    requested: 25,
    status: "RUNNING",
    scored: "12 / 25",
    updated: "2026-09-10 12:10",
  },
  {
    id: "qaj_22fe01",
    purpose: "Short form monitoring batch",
    scope: "Retail · fraud intent",
    from: "2026-09-01",
    to: "2026-09-09",
    openEnded: false,
    form: "short-form",
    rubrics: [],
    requested: 15,
    status: "COMPLETED",
    scored: "15 / 15",
    updated: "2026-09-09 16:22",
  },
  {
    id: "qaj_77aa09",
    purpose: "Disclosure concern deep dive",
    scope: "Cards LOB",
    from: "2026-08-01",
    to: "",
    openEnded: true,
    form: "custom",
    rubrics: ["Disclosures", "Compliance"],
    requested: 50,
    status: "QUEUED",
    scored: "0 / 50",
    updated: "2026-09-10 12:15",
  },
];

function jobStatusClass(status) {
  if (status === "COMPLETED") return "ok";
  if (status === "RUNNING") return "warn";
  return "neutral";
}

function jobDateScope(job) {
  return job.openEnded || !job.to ? `${job.from} → ongoing` : `${job.from} → ${job.to}`;
}

function renderJobsPanel() {
  const rows = SCORING_JOBS.map(
    (job) => `
    <tr>
      <td style="font-family:var(--mono);font-size:0.75rem">${job.id}…</td>
      <td>${job.purpose}</td>
      <td>${job.scope}</td>
      <td>${jobDateScope(job)}</td>
      <td>${formName(job.form)}${job.form !== "llm" ? ' <span class="future-badge">Future</span>' : ""}</td>
      <td>${job.form === "custom" && job.rubrics.length ? `${job.rubrics.join(", ")} <span class="future-badge">Future</span>` : "—"}</td>
      <td>${job.requested}</td>
      <td><span class="status ${jobStatusClass(job.status)}">${job.status}</span></td>
      <td>${job.scored}</td>
      <td>${job.updated}</td>
    </tr>`
  ).join("");

  const jobs = `
    <div class="card">
      <h3>Jobs &amp; results — track AutoQRA scoring runs</h3>
      <p class="hint">Each job selects interactions, runs AutoQRA scoring, and stores results. QA Direct conversations are skipped. Their ratings stay in the LLM feedback loop.</p>
      <div style="overflow-x:auto">
      <table class="table">
        <thead><tr><th>Job ID</th><th>Purpose</th><th>Scope</th><th>Dates</th><th>Form</th><th>Rubric</th><th>Requested</th><th>Status</th><th>Scored</th><th>Updated</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </div>
      <div class="btn-row" style="margin-top:0.75rem">
        <button class="btn primary" type="button" data-samp-tab="new">+ New job</button>
        <button class="btn" type="button">Refresh</button>
      </div>
    </div>`;

  const rubricPills = RUBRIC_AREAS.map(
    (area) => `<button class="pill ${jobRubrics.includes(area) ? "active" : ""}" type="button" data-job-rubric="${area}">${area}</button>`
  ).join("");
  const formOptions = JOB_FORM_VERSIONS.map(
    (f) => `<option value="${f.id}" ${jobFormVersion === f.id ? "selected" : ""}>${f.name}${f.id === "llm" ? " · MVP" : " · Future development"}</option>`
  ).join("");
  const rubricField = jobFormVersion === "custom"
    ? `<div class="field future-card" style="padding:0.65rem;border:1px solid #e6cf92;border-radius:8px"><label>Rubric area <span class="future-badge">Future development</span></label>
          <div class="pill-filters" data-job-rubrics>${rubricPills}</div>
          <p class="hint" style="margin:0.35rem 0 0">Post-MVP: use rubric areas for a deep dive after a concern is identified. ${jobRubrics.length ? jobRubrics.join(", ") : "None selected"}.</p>
        </div>`
    : "";
  const futureFormNotice = jobFormVersion === "llm"
    ? ""
    : futureCallout(`${formName(jobFormVersion)} is shown as a clickable preview. It is not included in the MVP.`);

  const newJob = `
    <div class="card">
      <h3>New job</h3>
      <p class="hint">Define which ingested interactions to score. Leave the end date empty to include every interaction from the start date. QA Direct conversations are excluded and used as LLM feedback.</p>
      ${futureFormNotice}
      <div class="grid-filters">
        <div class="field"><label>Job name</label><input data-job-name value="${jobName}" /></div>
        <div class="field"><label>Job type</label>
          <select data-job-type>
            <option ${jobType === "AutoQRA scoring" ? "selected" : ""}>AutoQRA scoring</option>
            <option ${jobType === "Calibration sample" ? "selected" : ""}>Calibration sample</option>
            <option ${jobType === "Re-score / backfill" ? "selected" : ""}>Re-score / backfill</option>
          </select>
        </div>
        <div class="field"><label>Date from</label><input type="date" data-job-from value="${jobDateFrom}" /></div>
        <div class="field"><label>Date to</label><input type="date" data-job-to value="${jobOpenEnded ? "" : jobDateTo}" ${jobOpenEnded ? "disabled" : ""} /></div>
        <div class="field" style="grid-column: 1 / -1">
          <label class="ms-option" style="padding-left:0">
            <input type="checkbox" data-job-open-ended ${jobOpenEnded ? "checked" : ""} />
            <span>No end date — all interactions from the start date</span>
          </label>
        </div>
        <div class="field"><label>Form version</label>
          <select data-job-form>${formOptions}</select>
        </div>
        ${rubricField}
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
        <div class="field"><label>Requested count</label><input type="number" data-job-count value="${jobRequested}" /></div>
      </div>
      <div class="footer-actions">
        <p class="hint">LLM form is included in MVP. Short form monitoring, Custom form, and custom rubric areas are future development. QA Direct rows are not selected.</p>
        <button class="btn primary" type="button" data-start-job>Start job</button>
      </div>
    </div>`;

  return `
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
    ${
      c.level === "agent"
        ? ""
        : `<h3 style="margin:0 0 0.45rem;font-size:0.95rem">Example audits leading to this plan</h3>
    <table class="table">
      <thead><tr><th>Audit</th><th>Date</th><th>Score</th><th>Defect</th><th></th></tr></thead>
      <tbody>${audits || `<tr><td colspan="5" style="color:var(--muted)">No sample audits</td></tr>`}</tbody>
    </table>`
    }
    <div class="btn-row" style="margin-top:0.85rem">
      <button class="btn primary" type="button">Open coaching plan</button>
      ${
        c.level === "agent"
          ? `<button class="btn" type="button">Need help from Supervisor</button>`
          : `<button class="btn" type="button">Assign to coach</button>
             <button class="btn" type="button">Schedule session</button>`
      }
    </div>`;
}

function openCoachPane(id) {
  const c = COACHING.find((x) => x.id === id) || patelCoachingPlans().find((x) => x.id === id);
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
      </div>
      <p style="font-size:0.9rem;line-height:1.45;margin:0 0 0.55rem">${t.coaching}</p>
      <h4 style="margin:0 0 0.35rem;font-size:0.85rem">Recommended actions (all agents)</h4>
      <ul class="opt-list" style="margin-bottom:0">
        ${t.actions.map((a) => `<li>${a}</li>`).join("")}
      </ul>
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
    </tr>`
    )
    .join("");

  return `
    <div class="card">
      <h3>Team / Queue coaching</h3>
      <p class="hint">Coaching specific to a team or queue — not org-wide. Filter by team, queue, LOB, or severity.</p>
      <div class="team-filters">
        ${teamMsField("Team", "teams", teamNames)}
        ${teamMsField("Queue", "queues", queues)}
        ${teamMsField("LOB", "lobs", lobs)}
        ${teamMsField("Severity", "severity", sevs)}
        <div class="filter-actions">
          <button class="btn primary" type="button" data-team-apply>Apply</button>
          <button class="btn" type="button" data-team-clear>Clear</button>
        </div>
      </div>
      <p class="hint" style="margin:0 0 0.45rem">Showing ${teams.length} team / queue coaching plans.</p>
      <div class="ix-table-wrap" style="border:none">
        <table class="table">
          <thead>
            <tr><th>Priority</th><th>Team</th><th>LOB</th><th>Queue</th><th>Theme</th><th>Monitoring</th><th>Fails</th><th>Opportunity</th></tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="8" style="text-align:center;color:var(--muted)">No teams / queues match filters.</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
}

function renderCoachingAgent() {
  const agents = [...new Set([...SECTION_AGENTS.map((agent) => agent.agent), AGENT_NAME])].filter((name) => name !== "QA Bot Handoff").sort();
  if (currentRole === "agent") selectedAgentView = AGENT_NAME;
  else if (!agents.includes(selectedAgentView)) selectedAgentView = AGENT_NAME;

  return `
    <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-end;margin-bottom:0.85rem">
      <div>
        <h3 style="margin:0">Agent Coaching · ${selectedAgentView}</h3>
        <p class="hint" style="margin:0.3rem 0 0">Overall score, rubric performance, four-week trend, and training modules.</p>
      </div>
      ${currentRole === "agent" ? "" : `<div class="field" style="margin:0;min-width:180px">
        <label>Agent</label>
        <select data-agent-view>
          ${agents.map((name) => `<option ${name === selectedAgentView ? "selected" : ""}>${name}</option>`).join("")}
        </select>
      </div>`}
    </div>
    ${agentCoachingBody(selectedAgentView)}`;
}

function renderCoaching() {
  if (currentRole === "agent") {
    selectedAgentView = AGENT_NAME;
    coachingTab = "agent";
    return `
      <h1 class="page-title">Agent coaching <span class="future-badge">Future development · Post-MVP</span></h1>
      <p class="page-sub">Clickable preview of coaching assigned to ${AGENT_NAME}.</p>
      ${futureCallout("Coaching is not part of the MVP. This screen is retained only as a future-development preview.")}
      ${tenantRow()}
      <div class="unavailable-preview">${renderCoachingAgent()}</div>`;
  }

  const body =
    coachingTab === "team"
      ? renderCoachingTeam()
      : coachingTab === "agent"
        ? renderCoachingAgent()
        : renderCoachingOverall();

  return `
    <h1 class="page-title">Coaching <span class="future-badge">Future development · Post-MVP</span></h1>
    <p class="page-sub">Clickable preview of planned overall, team, and agent coaching experiences.</p>
    ${futureCallout("Coaching is not part of the MVP. This screen is retained only as a future-development preview.")}
    ${tenantRow()}
    <div class="tabs">
      <button class="tab ${coachingTab === "overall" ? "active" : ""}" type="button" data-coach-tab="overall">Overall Coaching</button>
      <button class="tab ${coachingTab === "team" ? "active" : ""}" type="button" data-coach-tab="team">Team</button>
      <button class="tab ${coachingTab === "agent" ? "active" : ""}" type="button" data-coach-tab="agent">Agent Coaching</button>
    </div>
    <div class="unavailable-preview">${body}</div>`;
}

function weeklyOverall(week) {
  const values = RUBRIC_AREAS.map((area) => week.scores[area]);
  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
}

function performanceWeeksFor(agentName) {
  if (agentName === AGENT_NAME) return AGENT_PERFORMANCE_WEEKS;
  const row = SECTION_AGENTS.find((agent) => agent.agent === agentName);
  if (!row) return [];
  const offsets = [12, 8, 4, 0];
  return AGENT_PERFORMANCE_WEEKS.map((week, index) => ({
    week: week.week,
    monitored: 11,
    scores: Object.fromEntries(
      RUBRIC_AREAS.map((area) => [area, Math.max(50, Math.round((row.sections[area] ?? 80) - offsets[index]))])
    ),
  }));
}

function trainingModulesFor(agentName) {
  if (agentName === AGENT_NAME) return AGENT_TRAINING_MODULES;
  return TEAM_TRAINING_MODULES.filter((module) => module.agent === agentName);
}

function agentCoachingBody(agentName) {
  const weeks = performanceWeeksFor(agentName);
  const modules = trainingModulesFor(agentName);
  const currentWeek = weeks[weeks.length - 1];
  const firstWeek = weeks[0];
  if (!currentWeek) {
    return `<div class="card"><p class="hint" style="margin:0">No weekly monitoring sample is available for ${agentName}.</p></div>`;
  }
  const overall = weeklyOverall(currentWeek);
  const completed = modules.filter((module) => module.status === "Completed").length;
  const improvementAreas = RUBRIC_AREAS.filter((area) => currentWeek.scores[area] < 80);
  const weeklyRows = weeks.map(
    (week, index) => `
      <tr>
        <td><strong>${week.week}</strong>${index === weeks.length - 1 ? ' <span class="chip">Current</span>' : ""}</td>
        <td>${week.monitored}</td>
        <td><strong>${weeklyOverall(week)}%</strong></td>
        ${RUBRIC_AREAS.map((area) => `<td>${week.scores[area]}%</td>`).join("")}
      </tr>`
  ).join("");
  const rubricCards = RUBRIC_AREAS.map((area) => {
    const score = currentWeek.scores[area];
    const change = score - firstWeek.scores[area];
    return `
      <div class="stat">
        <div class="label">${area}</div>
        <div class="value">${score}%</div>
        <div class="hint">${change >= 0 ? "+" : ""}${change} pts over four weeks${score < 80 ? " · Improvement area" : ""}</div>
      </div>`;
  }).join("");
  const moduleRows = modules.map(
    (module) => `
      <tr>
        <td><strong>${module.name}</strong></td>
        <td>${module.rubric}</td>
        <td><span class="status ${module.status === "Completed" ? "ok" : "warn"}">${module.status}</span></td>
        <td>${
          module.helpRequested
            ? '<span class="status warn">Help requested</span>'
            : module.id
              ? `<button class="btn" type="button" data-request-help="${module.id}">Request help from supervisor</button>`
              : "—"
        }</td>
      </tr>`
  ).join("");

  return `
      <div class="callout">Scores use a random sample of monitored conversations, not every conversation. Target overall score: ${AGENT_PERFORMANCE_TARGET}%.</div>
      <div class="stat-row">
        <div class="stat"><div class="label">Overall score</div><div class="value">${overall}%</div><div class="hint">${overall < AGENT_PERFORMANCE_TARGET ? `${AGENT_PERFORMANCE_TARGET - overall} ${AGENT_PERFORMANCE_TARGET - overall === 1 ? "point" : "points"} below target` : "On target"}</div></div>
        <div class="stat"><div class="label">Monitored this week</div><div class="value">${currentWeek.monitored}</div><div class="hint">Randomly selected</div></div>
        <div class="stat"><div class="label">Modules assigned</div><div class="value">${modules.length}</div><div class="hint">All training modules</div></div>
        <div class="stat"><div class="label">Modules completed</div><div class="value">${completed}</div><div class="hint">${completed} of ${modules.length}</div></div>
      </div>

      <div class="card" style="margin-top:0.85rem">
        <h3>Current rubric performance</h3>
        <p class="hint">Percentages for ${currentWeek.week}. Areas below 80% are highlighted as improvement opportunities.</p>
        <div class="stat-row">${rubricCards}</div>
        <div class="callout" style="margin-bottom:0">
          <strong>Improvement focus:</strong>
          ${improvementAreas.length ? improvementAreas.join(", ") : "No rubric area is below 80% this week."}
        </div>
      </div>

      <div class="card" style="margin-top:0.85rem">
        <h3>Four-week score trend</h3>
        <p class="hint">Overall is calculated from all rubric-area percentages for each week. Each week uses the same monitored sample size.</p>
        <div class="ix-table-wrap" style="border:none">
          <table class="table">
            <thead><tr><th>Week</th><th>Monitored</th><th>Overall</th>${RUBRIC_AREAS.map((area) => `<th>${area}</th>`).join("")}</tr></thead>
            <tbody>${weeklyRows}</tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:0.85rem">
        <h3>Training modules</h3>
        <p class="hint">Training is assigned to improvement areas. Score impact appears in the next weekly monitoring sample.</p>
        <div class="ix-table-wrap" style="border:none">
          <table class="table">
            <thead><tr><th>Module</th><th>Rubric area</th><th>Status</th><th>Supervisor help</th></tr></thead>
            <tbody>${moduleRows || `<tr><td colspan="4" style="text-align:center;color:var(--muted)">No training modules assigned.</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
}

function renderAgentPerformance() {
  return `
    <h1 class="page-title">Agent Coaching <span class="future-badge">Future development · Post-MVP</span></h1>
    <p class="page-sub">${AGENT_NAME} · Overall and rubric-area performance from randomly monitored conversations.</p>
    ${futureCallout("Agent Coaching is a future-development preview and is not included in the MVP.")}
    <div class="unavailable-preview">
      ${agentCoachingBody(AGENT_NAME)}
    </div>`;
}

const REPORT_SECTIONS = [
  "Soft skills",
  "Compliance",
  "Disclosures",
  "Resolution",
  "Empathy",
  "Product knowledge - Client defined",
  "CRM usage",
  "Custom area of coaching",
];

const SECTION_AGENTS = [
  { agent: "S. Okonkwo", lob: "Test_Lob", audits: 22, sections: { "Soft skills": 96.2, Compliance: 94.1, Disclosures: 90.4, Resolution: 93.0 } },
  { agent: "T. Morales", lob: "Retail", audits: 25, sections: { "Soft skills": 94.0, Compliance: 91.2, Disclosures: 88.6, Resolution: 92.4 } },
  { agent: "M. Chen", lob: "Retail", audits: 36, sections: { "Soft skills": 91.5, Compliance: 89.0, Disclosures: 86.2, Resolution: 90.1 } },
  { agent: "H. Cho", lob: "Commercial Pharmacy", audits: 38, sections: { "Soft skills": 90.2, Compliance: 88.4, Disclosures: 84.0, Resolution: 87.5 } },
  { agent: "K. Singh", lob: "Commercial Pharmacy", audits: 27, sections: { "Soft skills": 88.7, Compliance: 86.1, Disclosures: 82.4, Resolution: 85.0 } },
  { agent: "L. Ramirez", lob: "Retail", audits: 33, sections: { "Soft skills": 86.4, Compliance: 80.2, Disclosures: 83.1, Resolution: 84.6 } },
  { agent: "J. Brooks", lob: "Medicaid Pharmacy", audits: 41, sections: { "Soft skills": 84.1, Compliance: 85.5, Disclosures: 79.8, Resolution: 76.2 } },
  { agent: "R. Patel", lob: "Commercial Pharmacy", audits: 11, sections: { "Soft skills": 84, Compliance: 89, Disclosures: 78, Resolution: 82 } },
  { agent: "A. Nguyen", lob: "Retail", audits: 29, sections: { "Soft skills": 79.6, Compliance: 82.0, Disclosures: 77.4, Resolution: 68.5 } },
  { agent: "P. Ellis", lob: "Cards", audits: 19, sections: { "Soft skills": 77.2, Compliance: 74.8, Disclosures: 69.1, Resolution: 73.4 } },
  { agent: "K. Lee", lob: "Retail", audits: 18, sections: { "Soft skills": 75.4, Compliance: 78.6, Disclosures: 80.2, Resolution: 81.0 } },
  { agent: "QA Bot Handoff", lob: "Test_Lob", audits: 12, sections: { "Soft skills": 72.8, Compliance: 76.0, Disclosures: 74.4, Resolution: 70.1 } },
];

const EXTRA_SECTION_SCORES = {
  "S. Okonkwo": { "Product knowledge - Client defined": 94.0, "CRM usage": 91.2, "Custom area of coaching": 88.4, Empathy: 93.1 },
  "T. Morales": { "Product knowledge - Client defined": 90.2, "CRM usage": 88.5, "Custom area of coaching": 86.0, Empathy: 91.4 },
  "M. Chen": { "Product knowledge - Client defined": 87.6, "CRM usage": 85.2, "Custom area of coaching": 83.8, Empathy: 88.0 },
  "H. Cho": { "Product knowledge - Client defined": 86.1, "CRM usage": 84.4, "Custom area of coaching": 82.0, Empathy: 86.8 },
  "K. Singh": { "Product knowledge - Client defined": 84.2, "CRM usage": 81.6, "Custom area of coaching": 79.4, Empathy: 83.5 },
  "L. Ramirez": { "Product knowledge - Client defined": 82.8, "CRM usage": 80.1, "Custom area of coaching": 77.6, Empathy: 81.9 },
  "J. Brooks": { "Product knowledge - Client defined": 80.4, "CRM usage": 78.2, "Custom area of coaching": 74.8, Empathy: 79.1 },
  "R. Patel": { "Product knowledge - Client defined": 80, "CRM usage": 83, "Custom area of coaching": 77, Empathy: 86 },
  "A. Nguyen": { "Product knowledge - Client defined": 76.5, "CRM usage": 74.2, "Custom area of coaching": 71.8, Empathy: 75.4 },
  "P. Ellis": { "Product knowledge - Client defined": 73.6, "CRM usage": 71.0, "Custom area of coaching": 69.4, Empathy: 72.8 },
  "K. Lee": { "Product knowledge - Client defined": 78.1, "CRM usage": 76.4, "Custom area of coaching": 74.0, Empathy: 77.2 },
  "QA Bot Handoff": { "Product knowledge - Client defined": 71.5, "CRM usage": 69.8, "Custom area of coaching": 68.2, Empathy: 70.4 },
};
SECTION_AGENTS.forEach((agent) => Object.assign(agent.sections, EXTRA_SECTION_SCORES[agent.agent] || {}));

function renderReporting() {
  const lobBoard = [
    { lob: "Pharmacy", score: 90.2, audits: 4200, agreement: "93%", trend: "+1.2" },
    { lob: "Retail", score: 88.1, audits: 6100, agreement: "92%", trend: "+0.4" },
    { lob: "Test_Lob", score: 86.9, audits: 980, agreement: "91%", trend: "0.0" },
    { lob: "Cards", score: 81.4, audits: 5100, agreement: "89%", trend: "-1.8" },
  ];

  const section = REPORT_SECTIONS.includes(reportFilters.section) ? reportFilters.section : "Soft skills";
  const bottom = reportFilters.rank === "Bottom 10";
  const rankedAgents = SECTION_AGENTS
    .filter((a) => reportFilters.lob === "All" || a.lob === reportFilters.lob || (reportFilters.lob === "Pharmacy" && a.lob.includes("Pharmacy")))
    .map((a) => ({ ...a, score: a.sections[section] }))
    .sort((a, b) => (bottom ? a.score - b.score : b.score - a.score))
    .slice(0, 10)
    .map((a, index) => ({ ...a, rank: index + 1 }));

  const trainingRows = [
    ...AGENT_TRAINING_MODULES.map((module) => ({ agent: AGENT_NAME, ...module })),
    ...TEAM_TRAINING_MODULES,
  ]
    .map(
      (module) => `
        <tr>
          <td>${module.agent}</td>
          <td><strong>${module.name}</strong></td>
          <td>${module.rubric}</td>
          <td><span class="status ${module.status === "Completed" ? "ok" : "warn"}">${module.status}</span></td>
          <td>${module.helpRequested ? '<span class="status warn">Help requested</span>' : "—"}</td>
        </tr>`
    )
    .join("");

  return `
    <h1 class="page-title">Team Insights <span class="future-badge">Future development · Post-MVP</span></h1>
    <p class="page-sub">Clickable preview of planned team reporting and training follow-up.</p>
    ${futureCallout("Team Insights is not part of the MVP. This dashboard is retained only as a future-development preview.")}
    ${tenantRow()}
    <div class="card" style="padding:0.75rem 1rem;margin-bottom:0.85rem">
      <div class="grid-filters">
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
        <div class="field"><label>Section</label>
          <select data-report-filter="section">
            ${REPORT_SECTIONS.map((name) => `<option ${section === name ? "selected" : ""}>${name}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Rank</label>
          <select data-report-filter="rank">
            <option ${reportFilters.rank !== "Bottom 10" ? "selected" : ""}>Top 10</option>
            <option ${reportFilters.rank === "Bottom 10" ? "selected" : ""}>Bottom 10</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn primary" type="button" data-report-apply>Apply filters</button>
        </div>
      </div>
      <p class="hint" style="margin:0.5rem 0 0">Active: <strong>${reportFilters.period}</strong> · LOB <strong>${reportFilters.lob}</strong> · Queue <strong>${reportFilters.queue}</strong> · <strong>${bottom ? "Bottom 10" : "Top 10"}</strong> in <strong>${section}</strong></p>
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
            <h4>${bottom ? "Bottom 10" : "Top 10"} agents · ${section}</h4>
            <table class="table">
              <thead><tr><th>#</th><th>Agent</th><th>LOB</th><th>Audits</th><th>Section score</th></tr></thead>
              <tbody>
                ${rankedAgents
                  .map(
                    (a) =>
                      `<tr><td>${a.rank}</td><td>${a.agent}</td><td>${a.lob}</td><td>${a.audits}</td><td><strong>${a.score.toFixed(1)}</strong></td></tr>`
                  )
                  .join("") || `<tr><td colspan="5" style="color:var(--muted)">No agents in this filter.</td></tr>`}
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
    </div>
    <div class="card" style="margin-top:0.85rem">
      <h3>Training modules</h3>
      <p class="hint">Requests and completions across the team. R. Patel’s modules match Agent Coaching, including supervisor help requests.</p>
      <div class="ix-table-wrap" style="border:none">
        <table class="table">
          <thead><tr><th>Agent</th><th>Module</th><th>Rubric area</th><th>Status</th><th>Supervisor help</th></tr></thead>
          <tbody>${trainingRows}</tbody>
        </table>
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

function renderAboutBody() {
  const rows = FEATURES.map(
    (f, idx) => `
    <tr class="clickable" data-goto="${f.view}">
      <td style="color:var(--muted);width:2.5rem">${idx + 1}</td>
      <td><strong>${f.name}</strong></td>
      <td><span class="chip">${f.tier}</span></td>
      <td style="color:var(--muted);font-size:0.82rem">${f.view}</td>
    </tr>`
  ).join("");

  const core = FEATURES.filter((f) => f.tier === "core").length;
  const advanced = FEATURES.filter((f) => f.tier === "advanced").length;
  const insight = FEATURES.filter((f) => f.tier === "insight").length;

  return `
    <div class="card">
      <h3 style="margin:0 0 0.35rem">About · AutoQRA feature list</h3>
      <p class="hint" style="margin:0 0 0.75rem">Former Feature Map. ${FEATURES.length} capabilities (Core ${core} · Advanced ${advanced} · Insights ${insight}). Click a row to open the related screen.</p>
      <div class="ix-table-wrap" style="border:none">
        <table class="table">
          <thead>
            <tr><th>#</th><th>Feature</th><th>Tier</th><th>Screen</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderAdminAdvancedBody() {
  return `
    <div class="card">
      <h3>Advanced Settings</h3>
      <p class="hint" style="margin:0">Empty pane — placeholder for future advanced settings.</p>
    </div>`;
}

const SCHEDULED_PULLS = [
  {
    id: "sch-nightly",
    name: "Nightly chat transcripts",
    source: "Amazon S3",
    path: "s3://247client1-autoqra-ingest/inbound/transcripts/",
    frequency: "Daily",
    time: "02:00 UTC",
    enabled: true,
    last: "2026-09-10 02:04 UTC",
    next: "2026-09-11 02:00 UTC",
  },
  {
    id: "sch-pharmacy",
    name: "Pharmacy SFTP drop",
    source: "SFTP",
    path: "sftp.247client1.com:/outbound/transcripts/",
    frequency: "Hourly",
    time: "Every hour at :15",
    enabled: true,
    last: "2026-09-10 11:15 UTC",
    next: "2026-09-10 12:15 UTC",
  },
  {
    id: "sch-azure",
    name: "Azure weekly archive",
    source: "Azure Blob",
    path: "autoqra-container/transcripts/",
    frequency: "Weekly",
    time: "Mon 06:00 UTC",
    enabled: false,
    last: "2026-09-01 06:02 UTC",
    next: "Paused",
  },
];

const SCHEDULE_SOURCES = ["SFTP", "Amazon S3", "Azure Blob", "Google Cloud Storage", "API"];
let scheduleName = "Daily transcript pull";
let scheduleSource = "SFTP";
let schedulePath = "/outbound/transcripts/";
let scheduleFrequency = "Daily";
let scheduleTime = "02:00";

function renderScheduledPull() {
  const rows = SCHEDULED_PULLS.map(
    (s) => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.source}</td>
      <td style="font-family:var(--mono);font-size:0.75rem">${s.path}</td>
      <td>${s.frequency}</td>
      <td>${s.time}</td>
      <td><span class="status ${s.enabled ? "ok" : "neutral"}">${s.enabled ? "Enabled" : "Paused"}</span></td>
      <td>${s.last}</td>
      <td>${s.next}</td>
      <td><button class="btn" type="button" data-schedule-toggle="${s.id}">${s.enabled ? "Pause" : "Enable"}</button></td>
    </tr>`
  ).join("");

  return `
    ${futureCallout("Scheduled transcript pulls are planned for a post-MVP Settings release.")}
    <p class="page-sub" style="margin-top:0">Automated pull of transcripts from client locations. Each schedule uses a connected SFTP, cloud, or API source.</p>
    <div class="card">
      <h3>New scheduled pull</h3>
      <p class="hint">Save a schedule to pull transcripts without a manual ingest. Credentials stay on the Cloud connections and SFTP settings.</p>
      <div class="grid-filters">
        <div class="field"><label>Name</label><input data-schedule-name value="${scheduleName}" /></div>
        <div class="field"><label>Source</label>
          <select data-schedule-source>
            ${SCHEDULE_SOURCES.map((src) => `<option ${scheduleSource === src ? "selected" : ""}>${src}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Client path</label><input data-schedule-path value="${schedulePath}" /></div>
        <div class="field"><label>Frequency</label>
          <select data-schedule-frequency>
            ${["Hourly", "Daily", "Weekly"].map((f) => `<option ${scheduleFrequency === f ? "selected" : ""}>${f}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Time (UTC)</label><input data-schedule-time value="${scheduleTime}" /></div>
      </div>
      <div class="footer-actions">
        <p class="hint">Each run appears under Ingest as an ingest job. QA Direct status is unchanged by a pull.</p>
        <button class="btn primary" type="button" data-schedule-save>Save schedule</button>
      </div>
    </div>
    <div class="card">
      <h3>Saved schedules</h3>
      <div style="overflow-x:auto">
      <table class="table">
        <thead><tr><th>Name</th><th>Source</th><th>Path</th><th>Frequency</th><th>Time</th><th>State</th><th>Last run</th><th>Next run</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </div>
    </div>`;
}

function renderAdmin() {
  const body =
    settingsTab === "schedule"
      ? renderScheduledPull()
      : settingsTab === "sftp-push"
        ? renderSftpPush()
        : settingsTab === "clouds"
          ? renderCloudConnections()
          : settingsTab === "advanced"
            ? renderAdminAdvancedBody()
            : settingsTab === "about"
              ? renderAboutBody()
              : renderAdminTenantBody();

  return `
    <h1 class="page-title">Settings <span class="future-badge">Future development · Post-MVP</span></h1>
    <p class="page-sub">Clickable preview of planned administration, scheduled pull, SFTP push, cloud connections, and advanced settings.</p>
    ${futureCallout("Settings is not part of the MVP. All controls on this screen are future-development previews.")}
    ${tenantRow()}
    <div class="tabs">
      <button class="tab ${settingsTab === "admin" ? "active" : ""}" type="button" data-settings-tab="admin">Admin</button>
      <button class="tab ${settingsTab === "schedule" ? "active" : ""}" type="button" data-settings-tab="schedule">Scheduled pull</button>
      <button class="tab ${settingsTab === "sftp-push" ? "active" : ""}" type="button" data-settings-tab="sftp-push">SFTP Push <span class="future-badge">Future</span></button>
      <button class="tab ${settingsTab === "clouds" ? "active" : ""}" type="button" data-settings-tab="clouds">Cloud connections</button>
      <button class="tab ${settingsTab === "advanced" ? "active" : ""}" type="button" data-settings-tab="advanced">Advanced Settings</button>
      <button class="tab ${settingsTab === "about" ? "active" : ""}" type="button" data-settings-tab="about">About</button>
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
  interactions: renderInteractions,
  "data-import": renderDataImport,
  coaching: renderCoaching,
  performance: renderAgentPerformance,
  reporting: renderReporting,
  admin: renderAdmin,
};

function setNav(view) {
  document.querySelectorAll(".side-item").forEach((btn) => {
    const qaOnly = btn.hasAttribute("data-qa-only");
    const agentOnly = btn.hasAttribute("data-agent-only");
    btn.hidden = (currentRole === "agent" && qaOnly) || (currentRole !== "agent" && agentOnly);
    btn.classList.toggle("active", btn.dataset.view === view && !btn.hidden);
  });
  quotaBox.hidden = currentRole === "agent" || view !== "data-import";
  roleButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.role === currentRole));
  if (userChip) userChip.textContent = currentRole === "agent" ? AGENT_NAME : "QA User";
}

function render(view) {
  if (currentRole === "agent" && !["interactions", "performance"].includes(view)) view = "interactions";
  if (currentRole !== "agent" && view === "performance") view = "interactions";
  // Feature Map removed from nav — open Settings → About instead
  if (view === "overview") {
    settingsTab = "about";
    view = "admin";
  }
  if (view === "sampling") {
    dataTab = "jobs";
    view = "data-import";
  }
  currentView = view;
  if (view !== "interactions") selectedIx = null;
  if (view !== "coaching") closeCoachPane();
  setNav(view);
  const renderer = RENDERERS[view];
  if (!renderer) {
    workspace.innerHTML = `<div class="card"><h3>Unknown view</h3><p class="hint">No renderer for <code>${view}</code>.</p></div>`;
    return;
  }
  workspace.innerHTML = renderer();
  sideNav.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.querySelectorAll(".side-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedIx = null;
    render(btn.dataset.view);
  });
});

const collapseBtn = document.getElementById("collapseNav");
if (collapseBtn) {
  collapseBtn.addEventListener("click", () => {
    sideNav.classList.toggle("collapsed");
  });
}

roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentRole = btn.dataset.role;
    selectedIx = null;
    ixSideTab = "audit";
    openMsKey = null;
    render("interactions");
  });
});

function readJobForm() {
  const name = workspace.querySelector("[data-job-name]");
  if (!name) return;
  jobName = name.value;
  const type = workspace.querySelector("[data-job-type]");
  if (type) jobType = type.value;
  const from = workspace.querySelector("[data-job-from]");
  if (from && from.value) jobDateFrom = from.value;
  const to = workspace.querySelector("[data-job-to]");
  if (to && !jobOpenEnded) jobDateTo = to.value;
  const form = workspace.querySelector("[data-job-form]");
  if (form) jobFormVersion = form.value;
  const count = workspace.querySelector("[data-job-count]");
  if (count) jobRequested = count.value;
}

function readScheduleForm() {
  const name = workspace.querySelector("[data-schedule-name]");
  if (!name) return;
  scheduleName = name.value;
  const source = workspace.querySelector("[data-schedule-source]");
  if (source) scheduleSource = source.value;
  const path = workspace.querySelector("[data-schedule-path]");
  if (path) schedulePath = path.value;
  const frequency = workspace.querySelector("[data-schedule-frequency]");
  if (frequency) scheduleFrequency = frequency.value;
  const time = workspace.querySelector("[data-schedule-time]");
  if (time) scheduleTime = time.value;
}

workspace.addEventListener("click", (e) => {
  const help = e.target.closest("[data-request-help]");
  if (help) {
    const module = AGENT_TRAINING_MODULES.find((item) => item.id === help.dataset.requestHelp);
    if (module) module.helpRequested = true;
    if (currentRole === "agent") render("performance");
    else {
      coachingTab = "agent";
      render("coaching");
    }
    return;
  }

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

  if (e.target.closest("[data-qa-direct-submit]")) {
    const ix = INTERACTIONS.find((i) => i.id === selectedIx);
    if (ix && ix.status === "Not Audited") {
      const formSel = workspace.querySelector("[data-ix-form]");
      ix.formVersion = formSel ? formSel.value : activeFormId(ix);
      ix.status = "QA Direct";
      ix.auditMode = "qa-direct";
      ix.llmExcluded = true;
      ix.score = isPartialForm(ix.formVersion) ? "90" : "86";
      render("interactions");
    }
    return;
  }

  if (e.target.closest("[data-agent-accept]")) {
    const ix = INTERACTIONS.find((i) => i.id === selectedIx && i.agentName === AGENT_NAME);
    if (ix && ix.status !== "Not Audited") {
      ix.status = "Complete";
      ix.agentDecision = "accepted";
      render("interactions");
    }
    return;
  }

  if (e.target.closest("[data-agent-dispute]")) {
    const ix = INTERACTIONS.find((i) => i.id === selectedIx && i.agentName === AGENT_NAME);
    if (ix && ix.status !== "Not Audited") {
      ix.status = "Pending Dispute";
      ix.agentDecision = "disputed";
      render("interactions");
    }
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

  const teamRemove = e.target.closest("[data-team-ms-remove]");
  if (teamRemove) {
    e.preventDefault();
    e.stopPropagation();
    const [key, value] = teamRemove.dataset.teamMsRemove.split("|");
    const selected = teamFilters[key];
    const idx = selected.indexOf(value);
    if (idx >= 0) selected.splice(idx, 1);
    openTeamMsKey = key;
    coachingTab = "team";
    render("coaching");
    return;
  }

  const teamOpen = e.target.closest("[data-team-ms-open]");
  if (teamOpen) {
    e.preventDefault();
    e.stopPropagation();
    const key = teamOpen.dataset.teamMsOpen;
    openTeamMsKey = openTeamMsKey === key ? null : key;
    coachingTab = "team";
    render("coaching");
    return;
  }

  if (openTeamMsKey && !e.target.closest(".ms-wrap") && !e.target.closest("button, a, select")) {
    openTeamMsKey = null;
    coachingTab = "team";
    render("coaching");
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
    if (dataTab === "jobs" && samplingTab === "new") readJobForm();
    dataTab = dTab.dataset.dataTab;
    render("data-import");
    return;
  }

  const cloudSel = e.target.closest("[data-select-cloud]");
  if (cloudSel) {
    selectedCloud = cloudSel.dataset.selectCloud;
    settingsTab = "clouds";
    render("admin");
    return;
  }

  const sTab = e.target.closest("[data-samp-tab]");
  if (sTab) {
    if (samplingTab === "new") readJobForm();
    samplingTab = sTab.dataset.sampTab;
    dataTab = "jobs";
    render("data-import");
    return;
  }

  const rubric = e.target.closest("[data-job-rubric]");
  if (rubric) {
    readJobForm();
    const area = rubric.dataset.jobRubric;
    jobRubrics = jobRubrics.includes(area) ? jobRubrics.filter((item) => item !== area) : [...jobRubrics, area];
    dataTab = "jobs";
    render("data-import");
    return;
  }

  if (e.target.closest("[data-start-job]")) {
    readJobForm();
    const requested = Number(jobRequested) || 0;
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    SCORING_JOBS.unshift({
      id: `qaj_${Math.random().toString(16).slice(2, 8)}`,
      purpose: jobName || "New AutoQRA job",
      scope: jobType,
      from: jobDateFrom,
      to: jobOpenEnded ? "" : jobDateTo,
      openEnded: jobOpenEnded,
      form: jobFormVersion,
      rubrics: jobFormVersion === "custom" ? (jobRubrics.length ? [...jobRubrics] : ["Soft skills"]) : [],
      requested,
      status: "QUEUED",
      scored: `0 / ${requested}`,
      updated: stamp,
    });
    samplingTab = "jobs";
    dataTab = "jobs";
    render("data-import");
    return;
  }

  const settingsTabBtn = e.target.closest("[data-settings-tab]");
  if (settingsTabBtn) {
    if (settingsTab === "schedule") readScheduleForm();
    settingsTab = settingsTabBtn.dataset.settingsTab;
    render("admin");
    return;
  }

  const scheduleToggle = e.target.closest("[data-schedule-toggle]");
  if (scheduleToggle) {
    const row = SCHEDULED_PULLS.find((item) => item.id === scheduleToggle.dataset.scheduleToggle);
    if (row) {
      row.enabled = !row.enabled;
      row.next = row.enabled ? "Next window" : "Paused";
    }
    settingsTab = "schedule";
    render("admin");
    return;
  }

  if (e.target.closest("[data-schedule-save]")) {
    readScheduleForm();
    const when = scheduleTime.includes("UTC") ? scheduleTime : `${scheduleTime} UTC`;
    SCHEDULED_PULLS.unshift({
      id: `sch-${Math.random().toString(16).slice(2, 6)}`,
      name: scheduleName || "Scheduled pull",
      source: scheduleSource,
      path: schedulePath,
      frequency: scheduleFrequency,
      time: when,
      enabled: true,
      last: "Not run yet",
      next: "On next window",
    });
    settingsTab = "schedule";
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
    openTeamMsKey = null;
    coachingTab = "team";
    render("coaching");
    return;
  }

  if (e.target.closest("[data-team-clear]")) {
    teamFilters.teams = [];
    teamFilters.lobs = [];
    teamFilters.queues = [];
    teamFilters.severity = [];
    openTeamMsKey = null;
    coachingTab = "team";
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

  const agentView = e.target.closest("[data-agent-view]");
  if (agentView) {
    selectedAgentView = agentView.value;
    render("coaching");
    return;
  }

  const agentPeriodSel = e.target.closest("[data-agent-period]");
  if (agentPeriodSel) {
    agentPeriod = agentPeriodSel.value;
    render("coaching");
    return;
  }

  const ixForm = e.target.closest("[data-ix-form]");
  if (ixForm) {
    const ix = INTERACTIONS.find((item) => item.id === selectedIx);
    if (ix && !["QA Direct", "QA Reviewed", "Complete"].includes(ix.status)) ix.formVersion = ixForm.value;
    render("interactions");
    return;
  }

  if (e.target.closest("[data-job-open-ended]")) {
    readJobForm();
    jobOpenEnded = e.target.checked;
    if (jobOpenEnded) jobDateTo = "";
    else if (!jobDateTo) jobDateTo = jobDateFrom;
    dataTab = "jobs";
    render("data-import");
    return;
  }

  if (e.target.closest("[data-job-form], [data-job-type]")) {
    readJobForm();
    dataTab = "jobs";
    render("data-import");
    return;
  }
  const dateInput = e.target.closest("[data-ix-date]");
  if (dateInput) {
    ixFilters[dateInput.dataset.ixDate] = dateInput.value;
    return;
  }
  const teamToggle = e.target.closest("[data-team-ms-toggle]");
  if (teamToggle) {
    const [key, value] = teamToggle.dataset.teamMsToggle.split("|");
    const selected = teamFilters[key];
    const idx = selected.indexOf(value);
    if (teamToggle.checked && idx < 0) selected.push(value);
    if (!teamToggle.checked && idx >= 0) selected.splice(idx, 1);
    openTeamMsKey = key;
    coachingTab = "team";
    render("coaching");
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
    else if (crmPane && !crmPane.hidden) closeCrmPane();
  }
});

try {
  render("interactions");
} catch (err) {
  console.error(err);
  workspace.innerHTML = `<div class="card"><h3>Wireframe failed to load</h3><p class="hint">${String(err && err.message ? err.message : err)}</p><p class="hint">From repo root: <code>git checkout cursor/autoqra-feature-wireframe-a131 && cd autoqra-wireframe && python3 -m http.server 8765</code></p></div>`;
}
