const interactions = [
  {
    id: "INT-1001",
    queue: "Retail Banking",
    channel: "Voice",
    status: "Pending",
    autoQraStatus: "Scored",
    agent: "Asha N",
    customer: "Ravi K",
    hasAudio: true,
    hasVideo: false,
    createdAt: "2026-05-25T09:12:00Z",
    aiHighlights: ["KYC verification step skipped", "Empathy score: High"],
    transcript: [
      { time: "00:00:03", speaker: "Agent", text: "Welcome to customer support. How may I help?" },
      { time: "00:00:09", speaker: "Customer", text: "I need help updating my address for my savings account." },
      { time: "00:00:21", speaker: "Agent", text: "Sure, I can help. May I confirm your registered phone number?" },
      { time: "00:00:32", speaker: "Customer", text: "It is 98XXXXXX12." },
    ],
    autoQraSuggestion: {
      overallScore: 82,
      confidence: 0.86,
      rationale: "Strong greeting and issue handling, but mandatory verification checklist is incomplete.",
      attributeScores: {
        greeting: 10,
        verification: 5,
        resolution: 8,
        compliance: 6,
      },
    },
  },
  {
    id: "INT-1002",
    queue: "Credit Cards",
    channel: "Chat",
    status: "Completed",
    autoQraStatus: "Pending",
    agent: "Kiran P",
    customer: "Neha S",
    hasAudio: false,
    hasVideo: false,
    createdAt: "2026-05-24T14:35:00Z",
    aiHighlights: ["Late response on chargeback policy"],
    transcript: [
      { time: "14:35:05", speaker: "Customer", text: "I want to dispute a transaction from last week." },
      { time: "14:35:21", speaker: "Agent", text: "I will help with this. Let me gather your card details." },
      { time: "14:36:01", speaker: "Customer", text: "Okay." },
      { time: "14:36:33", speaker: "Agent", text: "Please complete dispute form in the app and we will process in 48 hours." },
    ],
    autoQraSuggestion: {
      overallScore: 74,
      confidence: 0.79,
      rationale: "Issue resolved but response time and empathy markers can improve.",
      attributeScores: {
        greeting: 8,
        verification: 9,
        resolution: 7,
        compliance: 7,
      },
    },
  },
  {
    id: "INT-1003",
    queue: "Loans",
    channel: "Voice",
    status: "Pending",
    autoQraStatus: "Scored",
    agent: "Meera D",
    customer: "Amit R",
    hasAudio: true,
    hasVideo: false,
    createdAt: "2026-05-23T07:47:00Z",
    aiHighlights: ["Potential compliance risk: missing consent script"],
    transcript: [
      { time: "00:00:04", speaker: "Agent", text: "Thanks for calling loans support." },
      { time: "00:00:13", speaker: "Customer", text: "I need foreclosure details on my personal loan." },
      { time: "00:00:26", speaker: "Agent", text: "I can provide that. Let me verify your account details first." },
    ],
    autoQraSuggestion: {
      overallScore: 69,
      confidence: 0.83,
      rationale: "Good resolution flow, but consent and script adherence were partial.",
      attributeScores: {
        greeting: 7,
        verification: 8,
        resolution: 8,
        compliance: 4,
      },
    },
  },
];

const formsByQueue = {
  "Retail Banking": {
    queue: "Retail Banking",
    overallThreshold: 75,
    sections: [
      {
        name: "Opening & Verification",
        attributes: [
          { key: "greeting", label: "Professional Greeting", weightage: 20, fatal: false },
          { key: "verification", label: "Customer Verification", weightage: 30, fatal: true },
        ],
      },
      {
        name: "Resolution & Compliance",
        attributes: [
          { key: "resolution", label: "Resolution Accuracy", weightage: 30, fatal: false },
          { key: "compliance", label: "Compliance Adherence", weightage: 20, fatal: true },
        ],
      },
    ],
  },
  "Credit Cards": {
    queue: "Credit Cards",
    overallThreshold: 80,
    sections: [
      {
        name: "Interaction Quality",
        attributes: [
          { key: "greeting", label: "Greeting & Tone", weightage: 25, fatal: false },
          { key: "verification", label: "Cardholder Validation", weightage: 25, fatal: true },
          { key: "resolution", label: "Issue Resolution", weightage: 30, fatal: false },
          { key: "compliance", label: "Chargeback Policy Accuracy", weightage: 20, fatal: true },
        ],
      },
    ],
  },
  Loans: {
    queue: "Loans",
    overallThreshold: 78,
    sections: [
      {
        name: "Loan Servicing Quality",
        attributes: [
          { key: "greeting", label: "Call Opening", weightage: 20, fatal: false },
          { key: "verification", label: "Identity Verification", weightage: 25, fatal: true },
          { key: "resolution", label: "Policy Explanation", weightage: 35, fatal: false },
          { key: "compliance", label: "Consent & Compliance", weightage: 20, fatal: true },
        ],
      },
    ],
  },
};

const ingestionSources = [
  {
    id: "SRC-1",
    name: "Core Voice Platform API",
    type: "Internal API",
    location: "https://voice.internal.local/interactions",
    schedule: "Real-time",
    status: "Active",
  },
];

const ingestionBatches = [];
const audits = [];

const workflowSteps = [
  "Interaction Selection",
  "Dynamic Form Rendering",
  "Transcript/Media Monitoring",
  "Auto QRA (Optional)",
  "Form Completion",
  "Submission",
  "Agent Notification",
  "Acknowledgement",
  "Dispute (Optional)",
  "Closure",
];

function getDashboardSummary() {
  const completedCount = interactions.filter((item) => item.status === "Completed").length;
  const pendingCount = interactions.filter((item) => item.status === "Pending").length;
  const autoQraScored = interactions.filter((item) => item.autoQraStatus === "Scored").length;
  const averageAutoScore =
    interactions.reduce((sum, item) => sum + item.autoQraSuggestion.overallScore, 0) / interactions.length;

  return {
    kpis: [
      { label: "Total Interactions", value: interactions.length },
      { label: "Pending Audits", value: pendingCount },
      { label: "Completed Audits", value: completedCount },
      { label: "Auto QRA Coverage", value: `${Math.round((autoQraScored / interactions.length) * 100)}%` },
      { label: "Average Auto Score", value: `${Math.round(averageAutoScore)}%` },
      { label: "Configured Sources", value: ingestionSources.length },
    ],
    roadmapPhases: [
      "Phase 1 - Foundation",
      "Phase 2 - Enterprise Readiness",
      "Phase 3 - AI Enablement",
      "Phase 4 - Full Automation",
      "Phase 5 - Advanced Intelligence",
    ],
  };
}

function getReports() {
  const scoreSummary =
    audits.length > 0
      ? audits.reduce((sum, audit) => sum + audit.finalScore, 0) / audits.length
      : interactions.reduce((sum, item) => sum + item.autoQraSuggestion.overallScore, 0) / interactions.length;

  return {
    qaSummary: {
      auditCompletionRate: `${Math.round((audits.length / interactions.length) * 100)}%`,
      passRatio: `${Math.round((audits.filter((audit) => audit.result === "Pass").length / Math.max(audits.length, 1)) * 100)}%`,
      averageScore: `${Math.round(scoreSummary)}%`,
      queuePerformance: [
        { queue: "Retail Banking", averageScore: 82 },
        { queue: "Credit Cards", averageScore: 76 },
        { queue: "Loans", averageScore: 71 },
      ],
    },
    productivity: {
      auditsCompleted: audits.length,
      averageAuditMinutes: audits.length
        ? Math.round(audits.reduce((sum, audit) => sum + audit.durationMinutes, 0) / audits.length)
        : 14,
      throughputTrend: [
        { week: "Week 1", audits: 15 },
        { week: "Week 2", audits: 22 },
        { week: "Week 3", audits: 19 },
      ],
    },
    calibration: {
      variance: "8%",
      alignmentStatus: "Within Target",
    },
  };
}

module.exports = {
  interactions,
  formsByQueue,
  ingestionSources,
  ingestionBatches,
  audits,
  workflowSteps,
  getDashboardSummary,
  getReports,
};
