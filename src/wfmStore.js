/**
 * In-memory WFM domain store with demo data for digital + voice channels.
 * Live databases can override/enrich via the connector when configured.
 */

const CHANNELS = ["voice", "chat", "email", "tickets"];

function hoursBack(n) {
  const d = new Date();
  d.setHours(d.getHours() - n, 0, 0, 0);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function buildHistoricalVolumes() {
  const rows = [];
  for (let day = 27; day >= 0; day -= 1) {
    for (const channel of CHANNELS) {
      const base =
        channel === "voice" ? 420 : channel === "chat" ? 310 : channel === "email" ? 180 : 95;
      const weekday = new Date();
      weekday.setDate(weekday.getDate() - day);
      const dow = weekday.getDay();
      const seasonality = dow === 0 || dow === 6 ? 0.72 : 1 + (dow === 1 ? 0.12 : 0);
      const trend = 1 + (28 - day) * 0.004;
      const noise = 0.92 + ((day * 17 + channel.length * 3) % 17) / 100;
      const volume = Math.round(base * seasonality * trend * noise);
      rows.push({
        date: daysFromNow(-day),
        channel,
        volume,
        ahtSeconds: channel === "voice" ? 312 : channel === "chat" ? 480 : 620,
      });
    }
  }
  return rows;
}

function buildForecast() {
  const events = [
    { date: daysFromNow(3), name: "Product launch promo", upliftPct: 18 },
    { date: daysFromNow(10), name: "Billing cycle peak", upliftPct: 12 },
  ];
  const rows = [];
  for (let day = 0; day < 14; day += 1) {
    const date = daysFromNow(day);
    const event = events.find((e) => e.date === date);
    for (const channel of CHANNELS) {
      const base =
        channel === "voice" ? 445 : channel === "chat" ? 330 : channel === "email" ? 190 : 100;
      const dow = new Date(date).getDay();
      const seasonality = dow === 0 || dow === 6 ? 0.7 : 1.05;
      const uplift = event ? 1 + event.upliftPct / 100 : 1;
      rows.push({
        date,
        channel,
        forecastVolume: Math.round(base * seasonality * uplift),
        lowerBound: Math.round(base * seasonality * uplift * 0.9),
        upperBound: Math.round(base * seasonality * uplift * 1.12),
        specialEvent: event ? event.name : null,
      });
    }
  }
  return { horizonDays: 14, events, rows };
}

const agents = [
  {
    id: "A1001",
    name: "Priya Nair",
    skills: ["EN", "billing", "tier2"],
    channels: ["voice", "chat"],
    status: "available",
    team: "Billing",
  },
  {
    id: "A1002",
    name: "Marcus Lee",
    skills: ["EN", "ES", "tech", "tier1"],
    channels: ["voice"],
    status: "on-call",
    team: "Tech Support",
  },
  {
    id: "A1003",
    name: "Aisha Rahman",
    skills: ["EN", "AR", "sales", "tier1"],
    channels: ["chat", "email"],
    status: "break",
    team: "Sales",
  },
  {
    id: "A1004",
    name: "Jordan Blake",
    skills: ["EN", "tech", "tier2"],
    channels: ["voice", "tickets"],
    status: "available",
    team: "Tech Support",
  },
  {
    id: "A1005",
    name: "Sofia Mendes",
    skills: ["EN", "PT", "billing", "tier1"],
    channels: ["voice", "chat"],
    status: "training",
    team: "Billing",
  },
  {
    id: "A1006",
    name: "Chen Wei",
    skills: ["EN", "ZH", "tech", "tier1"],
    channels: ["chat", "email"],
    status: "available",
    team: "Tech Support",
  },
  {
    id: "A1007",
    name: "Elena Petrova",
    skills: ["EN", "RU", "sales", "tier2"],
    channels: ["voice"],
    status: "on-call",
    team: "Sales",
  },
  {
    id: "A1008",
    name: "Devon Brooks",
    skills: ["EN", "billing", "tier1"],
    channels: ["email", "tickets"],
    status: "offline",
    team: "Billing",
  },
];

const queues = [
  { id: "Q-VOICE-BILL", name: "Voice Billing", channel: "voice", requiredSkills: ["billing", "EN"], slaTarget: 80 },
  { id: "Q-VOICE-TECH", name: "Voice Tech", channel: "voice", requiredSkills: ["tech", "EN"], slaTarget: 80 },
  { id: "Q-CHAT-GEN", name: "Chat General", channel: "chat", requiredSkills: ["EN", "tier1"], slaTarget: 85 },
  { id: "Q-EMAIL-BILL", name: "Email Billing", channel: "email", requiredSkills: ["billing"], slaTarget: 90 },
  { id: "Q-TICKET-TECH", name: "Ticket Tech", channel: "tickets", requiredSkills: ["tech", "tier2"], slaTarget: 85 },
];

function buildCapacityPlan() {
  const forecast = buildForecast();
  const shrinkage = {
    breaks: 0.08,
    training: 0.05,
    leave: 0.04,
    absenteeism: 0.03,
    other: 0.02,
  };
  const totalShrinkage = Object.values(shrinkage).reduce((a, b) => a + b, 0);
  const ahtHours = { voice: 312 / 3600, chat: 480 / 3600, email: 620 / 3600, tickets: 900 / 3600 };
  const occupancyTarget = 0.85;

  const byDate = {};
  forecast.rows.forEach((row) => {
    if (!byDate[row.date]) byDate[row.date] = { date: row.date, channels: {}, requiredFte: 0 };
    const workloadHours = row.forecastVolume * ahtHours[row.channel];
    const productiveFte = workloadHours / (8 * occupancyTarget);
    const requiredFte = +(productiveFte / (1 - totalShrinkage)).toFixed(2);
    byDate[row.date].channels[row.channel] = {
      forecastVolume: row.forecastVolume,
      workloadHours: +workloadHours.toFixed(1),
      requiredFte,
    };
    byDate[row.date].requiredFte = +(byDate[row.date].requiredFte + requiredFte).toFixed(2);
  });

  return {
    shrinkage,
    totalShrinkagePct: +(totalShrinkage * 100).toFixed(1),
    occupancyTargetPct: occupancyTarget * 100,
    days: Object.values(byDate),
  };
}

function buildSchedules() {
  const shifts = ["06:00-14:00", "08:00-16:00", "10:00-18:00", "14:00-22:00"];
  const today = daysFromNow(0);
  return agents.map((agent, idx) => {
    const shift = shifts[idx % shifts.length];
    const [start] = shift.split("-");
    const lunchStart = `${String(Number(start.slice(0, 2)) + 4).padStart(2, "0")}:00`;
    return {
      agentId: agent.id,
      agentName: agent.name,
      date: today,
      shift,
      channelFocus: agent.channels[0],
      breaks: [
        { type: "break", start: `${String(Number(start.slice(0, 2)) + 2).padStart(2, "0")}:00`, durationMin: 15 },
        { type: "lunch", start: lunchStart, durationMin: 30 },
        { type: "break", start: `${String(Number(start.slice(0, 2)) + 6).padStart(2, "0")}:00`, durationMin: 15 },
      ],
      offPhoneBlocks: agent.status === "training" ? [{ start: "13:00", end: "15:00", reason: "Product training" }] : [],
    };
  });
}

function buildRealtime() {
  return {
    asOf: new Date().toISOString(),
    channels: CHANNELS.map((channel, idx) => {
      const forecast = 55 + idx * 8;
      const actual = forecast + ((idx % 2 === 0 ? 1 : -1) * (4 + idx));
      const staffed = 12 - idx;
      const required = 11 - Math.floor(idx / 2);
      return {
        channel,
        forecastVolumeHour: forecast,
        actualVolumeHour: actual,
        variancePct: +(((actual - forecast) / forecast) * 100).toFixed(1),
        serviceLevelPct: 78 + idx * 2,
        asaSeconds: 28 - idx * 3,
        staffed,
        required,
        gap: staffed - required,
        occupancyPct: 72 + idx * 3,
      };
    }),
    adjustments: [
      {
        id: "ADJ-1",
        type: "reallocate",
        detail: "Move 2 Billing agents from email to voice billing queue",
        impact: "+4% SL voice",
        status: "recommended",
      },
      {
        id: "ADJ-2",
        type: "pull-from-non-phone",
        detail: "Pull 1 Tech agent from QA sampling to live chat",
        impact: "-90s ASA chat",
        status: "recommended",
      },
      {
        id: "ADJ-3",
        type: "overtime",
        detail: "Offer 2h OT on Voice Tech for evening peak",
        impact: "Close -2 FTE gap 18:00-20:00",
        status: "pending-approval",
      },
    ],
  };
}

function buildSkillsRouting() {
  return {
    queues: queues.map((queue) => {
      const matched = agents.filter(
        (a) =>
          a.channels.includes(queue.channel) &&
          queue.requiredSkills.every((s) => a.skills.includes(s))
      );
      return {
        ...queue,
        eligibleAgents: matched.map((a) => ({ id: a.id, name: a.name, status: a.status })),
        coverage: matched.filter((a) => a.status === "available" || a.status === "on-call").length,
      };
    }),
    unmatchedWork: [
      { queueId: "Q-VOICE-TECH", waiting: 4, reason: "tier2 tech shortage" },
      { queueId: "Q-TICKET-TECH", waiting: 7, reason: "backlog from overnight" },
    ],
  };
}

function buildTimeAttendance() {
  return agents.map((agent, idx) => {
    const scheduled = 8;
    const actual = [7.9, 8.1, 6.5, 8.0, 4.0, 8.0, 8.2, 0][idx];
    const exceptions = [];
    if (actual === 0) exceptions.push({ type: "absent", minutes: 480 });
    if (actual === 6.5) exceptions.push({ type: "early-leave", minutes: 90 });
    if (actual === 4.0) exceptions.push({ type: "training-partial", minutes: 240 });
    if (idx === 1) exceptions.push({ type: "late", minutes: 12 });
    return {
      agentId: agent.id,
      agentName: agent.name,
      date: daysFromNow(0),
      scheduledHours: scheduled,
      actualHours: actual,
      adherencePct: scheduled ? Math.min(100, Math.round((actual / scheduled) * 100)) : 0,
      exceptions,
    };
  });
}

function buildAdherence() {
  return {
    summary: {
      overallAdherencePct: 91.4,
      overallConformancePct: 88.2,
      agentsOutOfAdherence: 2,
      openFlags: 3,
    },
    flags: [
      {
        id: "ADH-101",
        agentId: "A1003",
        agentName: "Aisha Rahman",
        expected: "available",
        actual: "break",
        durationMin: 18,
        severity: "medium",
        status: "open",
      },
      {
        id: "ADH-102",
        agentId: "A1008",
        agentName: "Devon Brooks",
        expected: "email",
        actual: "offline",
        durationMin: 45,
        severity: "high",
        status: "open",
      },
      {
        id: "ADH-103",
        agentId: "A1002",
        agentName: "Marcus Lee",
        expected: "voice",
        actual: "aux-other",
        durationMin: 8,
        severity: "low",
        status: "acknowledged",
      },
    ],
  };
}

function buildPerformance() {
  return {
    kpis: {
      serviceLevelPct: 82.4,
      occupancyPct: 76.8,
      utilizationPct: 84.1,
      ahtSeconds: 348,
      shrinkageRatePct: 22.0,
      forecastAccuracyPct: 93.2,
      abandonRatePct: 3.1,
    },
    byChannel: CHANNELS.map((channel, idx) => ({
      channel,
      serviceLevelPct: 80 + idx,
      occupancyPct: 74 + idx * 2,
      ahtSeconds: 300 + idx * 40,
      volume: 1200 - idx * 180,
      forecastAccuracyPct: 94 - idx,
    })),
    forecastPostMortem: [
      { week: "W-3", mapePct: 7.2, biasPct: -1.4 },
      { week: "W-2", mapePct: 6.1, biasPct: 0.8 },
      { week: "W-1", mapePct: 5.4, biasPct: -0.3 },
    ],
  };
}

const leaveRequests = [
  {
    id: "LV-2001",
    agentId: "A1005",
    agentName: "Sofia Mendes",
    type: "vacation",
    start: daysFromNow(5),
    end: daysFromNow(9),
    status: "pending",
    staffingImpact: "Billing voice coverage -1 FTE midweek",
  },
  {
    id: "LV-2002",
    agentId: "A1001",
    agentName: "Priya Nair",
    type: "sick",
    start: daysFromNow(0),
    end: daysFromNow(0),
    status: "approved",
    staffingImpact: "Covered by overtime offer",
  },
  {
    id: "LV-2003",
    agentId: "A1007",
    agentName: "Elena Petrova",
    type: "vacation",
    start: daysFromNow(12),
    end: daysFromNow(16),
    status: "pending",
    staffingImpact: "Sales voice peak week — recommend deny or backfill",
  },
];

function buildBudget() {
  return {
    period: "FY2026 Q3",
    laborBudgetUsd: 1_250_000,
    projectedSpendUsd: 1_187_400,
    varianceUsd: 62_600,
    overtimeUsd: 48_200,
    overtimeBudgetUsd: 55_000,
    recommendations: [
      { type: "overtime", detail: "Approve evening OT for Voice Tech (cheaper than new hire ramp)", costUsd: 6200 },
      { type: "hiring", detail: "Hire 3 tier-2 tech agents — attrition + volume trend", costUsd: 21000, fte: 3 },
      { type: "training", detail: "Cross-train 4 billing agents onto chat to reduce agency spend", costUsd: 4800 },
    ],
  };
}

function buildLongTermPlan() {
  return {
    horizonMonths: 6,
    hiringPlan: [
      { month: "Aug", hires: 4, attrition: 2, netFte: 2, focus: "Tech tier-2" },
      { month: "Sep", hires: 3, attrition: 2, netFte: 1, focus: "Billing bilingual" },
      { month: "Oct", hires: 5, attrition: 3, netFte: 2, focus: "Chat general" },
      { month: "Nov", hires: 2, attrition: 2, netFte: 0, focus: "Seasonal buffer" },
      { month: "Dec", hires: 6, attrition: 3, netFte: 3, focus: "Holiday peak" },
      { month: "Jan", hires: 2, attrition: 2, netFte: 0, focus: "Stabilize" },
    ],
    trainingCalendar: [
      { week: daysFromNow(7), topic: "New billing portal", seats: 8, capacityImpactFte: -2 },
      { week: daysFromNow(21), topic: "Tier-2 tech escalation", seats: 6, capacityImpactFte: -1.5 },
      { week: daysFromNow(35), topic: "Chat soft skills refresh", seats: 12, capacityImpactFte: -3 },
    ],
    riskFlags: [
      "Oct training week overlaps with product release volume spike",
      "Dec hiring ramp must complete by Nov 15 to avoid holiday gap",
    ],
  };
}

const coordinationItems = [
  {
    id: "XF-01",
    team: "Training",
    topic: "Portal training seats vs. midweek staffing",
    owner: "WFM + L&D",
    status: "open",
    due: daysFromNow(2),
  },
  {
    id: "XF-02",
    team: "IT",
    topic: "CRM outage window — expected handle-time spike",
    owner: "WFM + IT Ops",
    status: "monitoring",
    due: daysFromNow(1),
  },
  {
    id: "XF-03",
    team: "QA",
    topic: "Pull agents from QA sampling during voice surge",
    owner: "WFM + QA Lead",
    status: "agreed",
    due: daysFromNow(0),
  },
  {
    id: "XF-04",
    team: "Operations Leadership",
    topic: "OT budget approval for evening tech peak",
    owner: "WFM + Ops Director",
    status: "pending",
    due: daysFromNow(0),
  },
];

const connections = [
  {
    id: "CONN-DEMO",
    name: "Demo in-memory store",
    type: "demo",
    environment: "local",
    status: "connected",
    auth: "n/a",
  },
  {
    id: "CONN-CH-CLOUD",
    name: "ClickHouse Cloud (analytics)",
    type: "clickhouse",
    environment: "cloud",
    status: "configured",
    auth: "service-account",
  },
  {
    id: "CONN-PG-ONPREM",
    name: "Postgres WFM (on-prem)",
    type: "postgres",
    environment: "physical",
    status: "configured",
    auth: "service-account",
  },
  {
    id: "CONN-MYSQL-CLOUD",
    name: "MySQL HRIS mirror",
    type: "mysql",
    environment: "cloud",
    status: "configured",
    auth: "service-account",
  },
  {
    id: "CONN-MSSQL-ONPREM",
    name: "SQL Server ACD history",
    type: "mssql",
    environment: "physical",
    status: "configured",
    auth: "service-account",
  },
];

function getDashboard() {
  const realtime = buildRealtime();
  const performance = buildPerformance();
  const adherence = buildAdherence();
  const capacity = buildCapacityPlan();
  const todayRequired = capacity.days[0]?.requiredFte || 0;

  return {
    brand: "PulseWFM",
    tagline: "Workforce command for voice and digital",
    asOf: new Date().toISOString(),
    kpis: [
      { key: "serviceLevel", label: "Service level", value: `${performance.kpis.serviceLevelPct}%`, tone: "good" },
      { key: "occupancy", label: "Occupancy", value: `${performance.kpis.occupancyPct}%`, tone: "neutral" },
      { key: "adherence", label: "Adherence", value: `${adherence.summary.overallAdherencePct}%`, tone: "good" },
      { key: "forecastAccuracy", label: "Forecast accuracy", value: `${performance.kpis.forecastAccuracyPct}%`, tone: "good" },
      { key: "requiredFte", label: "Today required FTE", value: String(todayRequired), tone: "neutral" },
      { key: "openFlags", label: "Adherence flags", value: String(adherence.summary.openFlags), tone: "warn" },
    ],
    channelPulse: realtime.channels,
    modules: [
      { id: "forecast", name: "Demand forecasting", blurb: "Volumes, seasonality, events" },
      { id: "capacity", name: "Capacity planning", blurb: "FTE from demand + shrinkage" },
      { id: "scheduling", name: "Scheduling", blurb: "Shifts, breaks, off-phone" },
      { id: "realtime", name: "Real-time management", blurb: "Intraday vs forecast" },
      { id: "skills", name: "Skills routing", blurb: "Queue-to-skill matching" },
      { id: "attendance", name: "Time & attendance", blurb: "Hours and exceptions" },
      { id: "adherence", name: "Adherence", blurb: "Schedule conformance" },
      { id: "performance", name: "Performance analytics", blurb: "KPIs and post-mortems" },
      { id: "leave", name: "Leave management", blurb: "PTO vs staffing needs" },
      { id: "budget", name: "Budget & cost", blurb: "Labor spend and OT" },
      { id: "longterm", name: "Long-term planning", blurb: "Hiring and training" },
      { id: "coordination", name: "Cross-functional sync", blurb: "Training, IT, QA, ops" },
      { id: "connections", name: "Data connections", blurb: "Cloud & physical DBs" },
    ],
  };
}

function updateLeaveStatus(id, status) {
  const item = leaveRequests.find((l) => l.id === id);
  if (!item) return null;
  item.status = status;
  return item;
}

function acknowledgeAdherenceFlag(id) {
  const flag = buildAdherence().flags.find((f) => f.id === id);
  // mutate via regenerating is awkward; keep mutable copy
  return flag;
}

const adherenceState = buildAdherence();

function setAdherenceStatus(id, status) {
  const flag = adherenceState.flags.find((f) => f.id === id);
  if (!flag) return null;
  flag.status = status;
  adherenceState.summary.openFlags = adherenceState.flags.filter((f) => f.status === "open").length;
  return flag;
}

function getAdherence() {
  return adherenceState;
}

module.exports = {
  CHANNELS,
  agents,
  queues,
  connections,
  leaveRequests,
  getDashboard,
  getHistoricalVolumes: buildHistoricalVolumes,
  getForecast: buildForecast,
  getCapacityPlan: buildCapacityPlan,
  getSchedules: buildSchedules,
  getRealtime: buildRealtime,
  getSkillsRouting: buildSkillsRouting,
  getTimeAttendance: buildTimeAttendance,
  getAdherence,
  setAdherenceStatus,
  getPerformance: buildPerformance,
  getBudget: buildBudget,
  getLongTermPlan: buildLongTermPlan,
  getCoordination: () => coordinationItems,
  updateLeaveStatus,
  hoursBack,
};
