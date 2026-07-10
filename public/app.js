const state = {
  dashboard: null,
  cache: {},
  currentModule: "home",
};

const MODULE_META = {
  forecast: {
    title: "Demand forecasting",
    subtitle: "Historical volumes with seasonality, trend, and special-event uplift",
    endpoint: "/api/wfm/forecast",
  },
  capacity: {
    title: "Capacity planning",
    subtitle: "Translate forecasted demand into required headcount with shrinkage",
    endpoint: "/api/wfm/capacity",
  },
  scheduling: {
    title: "Scheduling",
    subtitle: "Shift plans matched to availability, breaks, and off-phone blocks",
    endpoint: "/api/wfm/schedules",
  },
  realtime: {
    title: "Real-time management",
    subtitle: "Intraday performance vs forecast with recommended adjustments",
    endpoint: "/api/wfm/realtime",
  },
  skills: {
    title: "Skills-based routing",
    subtitle: "Match language, product, and tier skills to work queues",
    endpoint: "/api/wfm/skills",
  },
  attendance: {
    title: "Time and attendance",
    subtitle: "Actual hours, schedule adherence, and exceptions",
    endpoint: "/api/wfm/attendance",
  },
  adherence: {
    title: "Adherence and conformance",
    subtitle: "Flag deviations from assigned schedule for correction",
    endpoint: "/api/wfm/adherence",
  },
  performance: {
    title: "Performance reporting",
    subtitle: "Service level, occupancy, AHT, shrinkage, and forecast accuracy",
    endpoint: "/api/wfm/performance",
  },
  leave: {
    title: "Leave and time-off",
    subtitle: "Vacation and sick leave balanced against staffing needs",
    endpoint: "/api/wfm/leave",
  },
  budget: {
    title: "Budgeting and cost control",
    subtitle: "Labor spend, overtime, and hiring recommendations",
    endpoint: "/api/wfm/budget",
  },
  longterm: {
    title: "Long-term workforce planning",
    subtitle: "Hiring, attrition, and training schedules to avoid capacity gaps",
    endpoint: "/api/wfm/longterm",
  },
  coordination: {
    title: "Cross-functional coordination",
    subtitle: "Sync with training, IT, QA, and operations on staffing impacts",
    endpoint: "/api/wfm/coordination",
  },
  connections: {
    title: "Data connections",
    subtitle: "Connect cloud or physical databases using a service account",
    endpoint: "/api/wfm/connections",
  },
};

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || json.details || `Request failed (${res.status})`);
  }
  return json.data !== undefined ? json.data : json;
}

function $(id) {
  return document.getElementById(id);
}

function fmtPct(n) {
  return `${Number(n).toFixed(1)}%`;
}

function toneClass(tone) {
  return tone === "good" || tone === "warn" ? `tone-${tone}` : "";
}

function setClock() {
  const el = $("clock");
  if (!el) return;
  el.textContent = new Date().toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setActiveNav(moduleId) {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    const target = el.getAttribute("data-nav");
    el.classList.toggle("is-active", target === moduleId || (moduleId === "home" && target === "home"));
  });
}

function showView(which) {
  $("view-home").classList.toggle("is-visible", which === "home");
  $("view-module").classList.toggle("is-visible", which === "module");
}

function renderHome() {
  const dash = state.dashboard;
  if (!dash) return;

  $("kpi-strip").innerHTML = dash.kpis
    .map(
      (k) => `
      <div class="kpi ${toneClass(k.tone)}">
        <span class="label">${k.label}</span>
        <span class="value">${k.value}</span>
      </div>`
    )
    .join("");

  $("channel-pulse").innerHTML = dash.channelPulse
    .map((c) => {
      const gapClass = c.gap >= 0 ? "gap-pos" : "gap-neg";
      return `
        <article class="channel">
          <h3>${c.channel}</h3>
          <div class="metric-row"><span>Actual / forecast</span><strong>${c.actualVolumeHour} / ${c.forecastVolumeHour}</strong></div>
          <div class="metric-row"><span>Variance</span><strong>${c.variancePct > 0 ? "+" : ""}${c.variancePct}%</strong></div>
          <div class="metric-row"><span>Service level</span><strong>${c.serviceLevelPct}%</strong></div>
          <div class="metric-row"><span>Staff gap</span><strong class="${gapClass}">${c.gap > 0 ? "+" : ""}${c.gap}</strong></div>
          <div class="bar"><span style="width:${Math.min(100, c.occupancyPct)}%"></span></div>
        </article>`;
    })
    .join("");

  $("module-grid").innerHTML = dash.modules
    .map(
      (m, i) => `
      <button type="button" class="module-tile" data-nav="${m.id}">
        <span class="idx">${String(i + 1).padStart(2, "0")}</span>
        <h3>${m.name}</h3>
        <p>${m.blurb}</p>
      </button>`
    )
    .join("");
}

function renderForecast(data) {
  const recent = data.historical.slice(-12);
  const upcoming = data.forecast.rows.slice(0, 12);
  return `
    <div class="split">
      <div class="panel">
        <h3>Recent historical volumes</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Channel</th><th>Volume</th><th>AHT (s)</th></tr></thead>
            <tbody>
              ${recent
                .map(
                  (r) =>
                    `<tr><td>${r.date}</td><td>${r.channel}</td><td>${r.volume}</td><td>${r.ahtSeconds}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h3>Special events</h3>
        <ul class="list">
          ${data.forecast.events
            .map(
              (e) =>
                `<li><div class="title">${e.name}</div><div class="muted">${e.date} · +${e.upliftPct}% uplift</div></li>`
            )
            .join("")}
        </ul>
      </div>
    </div>
    <div class="panel">
      <h3>${data.forecast.horizonDays}-day forecast</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Channel</th><th>Forecast</th><th>Range</th><th>Event</th></tr></thead>
          <tbody>
            ${upcoming
              .map(
                (r) =>
                  `<tr><td>${r.date}</td><td>${r.channel}</td><td>${r.forecastVolume}</td><td>${r.lowerBound}–${r.upperBound}</td><td>${r.specialEvent || "—"}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderCapacity(data) {
  return `
    <div class="stat-grid">
      <div class="stat"><span class="label">Total shrinkage</span><span class="value">${data.totalShrinkagePct}%</span></div>
      <div class="stat"><span class="label">Occupancy target</span><span class="value">${data.occupancyTargetPct}%</span></div>
      <div class="stat"><span class="label">Breaks</span><span class="value">${(data.shrinkage.breaks * 100).toFixed(0)}%</span></div>
      <div class="stat"><span class="label">Training</span><span class="value">${(data.shrinkage.training * 100).toFixed(0)}%</span></div>
      <div class="stat"><span class="label">Leave</span><span class="value">${(data.shrinkage.leave * 100).toFixed(0)}%</span></div>
      <div class="stat"><span class="label">Absenteeism</span><span class="value">${(data.shrinkage.absenteeism * 100).toFixed(0)}%</span></div>
    </div>
    <div class="panel">
      <h3>Required FTE by day</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Voice</th><th>Chat</th><th>Email</th><th>Tickets</th><th>Total FTE</th></tr></thead>
          <tbody>
            ${data.days
              .slice(0, 10)
              .map((d) => {
                const c = d.channels;
                return `<tr>
                  <td>${d.date}</td>
                  <td>${c.voice?.requiredFte ?? "—"}</td>
                  <td>${c.chat?.requiredFte ?? "—"}</td>
                  <td>${c.email?.requiredFte ?? "—"}</td>
                  <td>${c.tickets?.requiredFte ?? "—"}</td>
                  <td><strong>${d.requiredFte}</strong></td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderSchedules(data) {
  return `
    <div class="panel">
      <h3>Today’s shift board</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Agent</th><th>Shift</th><th>Focus</th><th>Breaks / lunch</th><th>Off-phone</th></tr></thead>
          <tbody>
            ${data.schedules
              .map((s) => {
                const breaks = s.breaks.map((b) => `${b.type} ${b.start} (${b.durationMin}m)`).join(", ");
                const off = s.offPhoneBlocks.length
                  ? s.offPhoneBlocks.map((b) => `${b.start}–${b.end} ${b.reason}`).join("; ")
                  : "—";
                return `<tr>
                  <td>${s.agentName}<div class="muted">${s.agentId}</div></td>
                  <td>${s.shift}</td>
                  <td><span class="tag">${s.channelFocus}</span></td>
                  <td>${breaks}</td>
                  <td>${off}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderRealtime(data) {
  return `
    <div class="channel-pulse">
      ${data.channels
        .map((c) => {
          const gapClass = c.gap >= 0 ? "gap-pos" : "gap-neg";
          return `<article class="channel">
            <h3>${c.channel}</h3>
            <div class="metric-row"><span>Volume</span><strong>${c.actualVolumeHour} vs ${c.forecastVolumeHour}</strong></div>
            <div class="metric-row"><span>SL / ASA</span><strong>${c.serviceLevelPct}% / ${c.asaSeconds}s</strong></div>
            <div class="metric-row"><span>Staffed / required</span><strong>${c.staffed} / ${c.required}</strong></div>
            <div class="metric-row"><span>Gap</span><strong class="${gapClass}">${c.gap}</strong></div>
          </article>`;
        })
        .join("")}
    </div>
    <div class="panel">
      <h3>Recommended adjustments</h3>
      <ul class="list">
        ${data.adjustments
          .map(
            (a) => `<li>
              <div class="title">${a.detail}</div>
              <div class="muted">${a.type} · ${a.impact}</div>
              <span class="tag ${a.status === "pending-approval" ? "warn" : "good"}">${a.status}</span>
            </li>`
          )
          .join("")}
      </ul>
    </div>`;
}

function renderSkills(data) {
  return `
    <div class="panel">
      <h3>Queue coverage</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Queue</th><th>Channel</th><th>Required skills</th><th>Coverage</th><th>Eligible agents</th></tr></thead>
          <tbody>
            ${data.queues
              .map(
                (q) => `<tr>
                  <td>${q.name}</td>
                  <td>${q.channel}</td>
                  <td>${q.requiredSkills.map((s) => `<span class="tag">${s}</span>`).join(" ")}</td>
                  <td><strong>${q.coverage}</strong></td>
                  <td>${q.eligibleAgents.map((a) => a.name).join(", ") || "—"}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <h3>Unmatched work</h3>
      <ul class="list">
        ${data.unmatchedWork
          .map(
            (u) =>
              `<li><div class="title">${u.queueId} · ${u.waiting} waiting</div><div class="muted">${u.reason}</div></li>`
          )
          .join("")}
      </ul>
    </div>`;
}

function renderAttendance(data) {
  return `
    <div class="panel">
      <h3>Today’s attendance</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Agent</th><th>Scheduled</th><th>Actual</th><th>Adherence</th><th>Exceptions</th></tr></thead>
          <tbody>
            ${data.records
              .map((r) => {
                const ex =
                  r.exceptions.length === 0
                    ? "—"
                    : r.exceptions
                        .map((e) => `<span class="tag ${e.type === "absent" ? "danger" : "warn"}">${e.type} ${e.minutes}m</span>`)
                        .join(" ");
                return `<tr>
                  <td>${r.agentName}</td>
                  <td>${r.scheduledHours}h</td>
                  <td>${r.actualHours}h</td>
                  <td>${r.adherencePct}%</td>
                  <td>${ex}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderAdherence(data) {
  return `
    <div class="stat-grid">
      <div class="stat"><span class="label">Adherence</span><span class="value">${data.summary.overallAdherencePct}%</span></div>
      <div class="stat"><span class="label">Conformance</span><span class="value">${data.summary.overallConformancePct}%</span></div>
      <div class="stat"><span class="label">Out of adherence</span><span class="value">${data.summary.agentsOutOfAdherence}</span></div>
      <div class="stat"><span class="label">Open flags</span><span class="value">${data.summary.openFlags}</span></div>
    </div>
    <div class="panel">
      <h3>Deviation flags</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Agent</th><th>Expected</th><th>Actual</th><th>Duration</th><th>Severity</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${data.flags
              .map(
                (f) => `<tr>
                  <td>${f.agentName}</td>
                  <td>${f.expected}</td>
                  <td>${f.actual}</td>
                  <td>${f.durationMin}m</td>
                  <td><span class="tag ${f.severity === "high" ? "danger" : f.severity === "medium" ? "warn" : ""}">${f.severity}</span></td>
                  <td>${f.status}</td>
                  <td>${
                    f.status === "open"
                      ? `<button type="button" class="btn btn-ghost btn-small" data-ack-adherence="${f.id}">Acknowledge</button>`
                      : "—"
                  }</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderPerformance(data) {
  return `
    <div class="stat-grid">
      ${Object.entries(data.kpis)
        .map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, " $1").replace(/Pct$/, " %").replace(/Seconds$/, " (s)");
          const display = String(key).endsWith("Pct") ? `${value}%` : value;
          return `<div class="stat"><span class="label">${label}</span><span class="value">${display}</span></div>`;
        })
        .join("")}
    </div>
    <div class="split">
      <div class="panel">
        <h3>By channel</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Channel</th><th>SL</th><th>Occupancy</th><th>AHT</th><th>Volume</th><th>Forecast acc.</th></tr></thead>
            <tbody>
              ${data.byChannel
                .map(
                  (c) =>
                    `<tr><td>${c.channel}</td><td>${c.serviceLevelPct}%</td><td>${c.occupancyPct}%</td><td>${c.ahtSeconds}s</td><td>${c.volume}</td><td>${c.forecastAccuracyPct}%</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h3>Forecast post-mortem</h3>
        <ul class="list">
          ${data.forecastPostMortem
            .map(
              (w) =>
                `<li><div class="title">${w.week}</div><div class="muted">MAPE ${w.mapePct}% · bias ${w.biasPct}%</div></li>`
            )
            .join("")}
        </ul>
      </div>
    </div>`;
}

function renderLeave(data) {
  return `
    <div class="panel">
      <h3>Leave requests</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Agent</th><th>Type</th><th>Dates</th><th>Staffing impact</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${data.requests
              .map(
                (r) => `<tr>
                  <td>${r.agentName}</td>
                  <td>${r.type}</td>
                  <td>${r.start}${r.end !== r.start ? ` → ${r.end}` : ""}</td>
                  <td>${r.staffingImpact}</td>
                  <td><span class="tag ${r.status === "approved" ? "good" : r.status === "denied" ? "danger" : "warn"}">${r.status}</span></td>
                  <td>
                    ${
                      r.status === "pending"
                        ? `<div class="actions">
                            <button type="button" class="btn btn-primary btn-small" data-leave="${r.id}" data-status="approved">Approve</button>
                            <button type="button" class="btn btn-ghost btn-small" data-leave="${r.id}" data-status="denied">Deny</button>
                          </div>`
                        : "—"
                    }
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderBudget(data) {
  return `
    <div class="stat-grid">
      <div class="stat"><span class="label">Period</span><span class="value" style="font-size:1rem">${data.period}</span></div>
      <div class="stat"><span class="label">Labor budget</span><span class="value">$${(data.laborBudgetUsd / 1000).toFixed(0)}k</span></div>
      <div class="stat"><span class="label">Projected spend</span><span class="value">$${(data.projectedSpendUsd / 1000).toFixed(1)}k</span></div>
      <div class="stat"><span class="label">Variance</span><span class="value">$${(data.varianceUsd / 1000).toFixed(1)}k</span></div>
      <div class="stat"><span class="label">OT spend</span><span class="value">$${(data.overtimeUsd / 1000).toFixed(1)}k</span></div>
      <div class="stat"><span class="label">OT budget</span><span class="value">$${(data.overtimeBudgetUsd / 1000).toFixed(0)}k</span></div>
    </div>
    <div class="panel">
      <h3>Recommendations</h3>
      <ul class="list">
        ${data.recommendations
          .map(
            (r) =>
              `<li><div class="title">${r.detail}</div><div class="muted">${r.type} · ~$${r.costUsd.toLocaleString()}${r.fte ? ` · ${r.fte} FTE` : ""}</div></li>`
          )
          .join("")}
      </ul>
    </div>`;
}

function renderLongterm(data) {
  return `
    <div class="panel">
      <h3>${data.horizonMonths}-month hiring plan</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Month</th><th>Hires</th><th>Attrition</th><th>Net FTE</th><th>Focus</th></tr></thead>
          <tbody>
            ${data.hiringPlan
              .map(
                (m) =>
                  `<tr><td>${m.month}</td><td>${m.hires}</td><td>${m.attrition}</td><td>${m.netFte}</td><td>${m.focus}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="split">
      <div class="panel">
        <h3>Training calendar</h3>
        <ul class="list">
          ${data.trainingCalendar
            .map(
              (t) =>
                `<li><div class="title">${t.topic}</div><div class="muted">Week of ${t.week} · ${t.seats} seats · ${t.capacityImpactFte} FTE impact</div></li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="panel">
        <h3>Risk flags</h3>
        <ul class="list">
          ${data.riskFlags.map((r) => `<li>${r}</li>`).join("")}
        </ul>
      </div>
    </div>`;
}

function renderCoordination(data) {
  return `
    <div class="panel">
      <h3>Open coordination items</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Team</th><th>Topic</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            ${data.items
              .map(
                (i) =>
                  `<tr><td>${i.id}</td><td>${i.team}</td><td>${i.topic}</td><td>${i.owner}</td><td>${i.due}</td><td><span class="tag ${i.status === "agreed" ? "good" : "warn"}">${i.status}</span></td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderConnections(data) {
  const active = data.active || {};
  return `
    <div class="stat-grid">
      <div class="stat"><span class="label">Active type</span><span class="value" style="font-size:1.05rem">${active.type || "demo"}</span></div>
      <div class="stat"><span class="label">Mode</span><span class="value" style="font-size:1.05rem">${active.mode || "demo"}</span></div>
      <div class="stat"><span class="label">Connected</span><span class="value" style="font-size:1.05rem">${active.connected ? "yes" : "no"}</span></div>
      <div class="stat"><span class="label">Auth</span><span class="value" style="font-size:1.05rem">service account</span></div>
    </div>
    <div class="panel">
      <h3>Configured profiles</h3>
      <p class="muted" style="margin-bottom:0.85rem">
        Set <code>DB_TYPE</code> and service-account credentials in <code>.env</code> for ClickHouse, Postgres, MySQL, or SQL Server (cloud or on-prem).
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Environment</th><th>Auth</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${data.profiles
              .map(
                (p) => `<tr>
                  <td>${p.name}</td>
                  <td>${p.type}</td>
                  <td>${p.environment}</td>
                  <td>${p.auth}</td>
                  <td><span class="tag ${p.status === "connected" ? "good" : ""}">${p.status}</span></td>
                  <td><button type="button" class="btn btn-ghost btn-small" data-activate="${p.type}">Activate</button></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <h3>Read-only SQL probe</h3>
      <p class="muted">Available when a live database profile is connected. Demo mode uses in-memory WFM data only.</p>
      <div class="actions" style="margin-top:0.75rem">
        <button type="button" class="btn btn-primary btn-small" id="probe-sql">Run SELECT 1 probe</button>
      </div>
      <pre id="probe-result" class="muted" style="margin-top:0.75rem;white-space:pre-wrap"></pre>
    </div>`;
}

const RENDERERS = {
  forecast: renderForecast,
  capacity: renderCapacity,
  scheduling: renderSchedules,
  realtime: renderRealtime,
  skills: renderSkills,
  attendance: renderAttendance,
  adherence: renderAdherence,
  performance: renderPerformance,
  leave: renderLeave,
  budget: renderBudget,
  longterm: renderLongterm,
  coordination: renderCoordination,
  connections: renderConnections,
};

async function openModule(moduleId) {
  if (moduleId === "home") {
    state.currentModule = "home";
    showView("home");
    setActiveNav("home");
    history.replaceState(null, "", "#home");
    return;
  }

  const meta = MODULE_META[moduleId];
  if (!meta) return;

  state.currentModule = moduleId;
  showView("module");
  setActiveNav(moduleId);
  history.replaceState(null, "", `#${moduleId}`);

  $("module-title").textContent = meta.title;
  $("module-subtitle").textContent = meta.subtitle;
  $("module-body").innerHTML = `<p class="muted">Loading…</p>`;
  $("footer-status").textContent = `Loading ${meta.title}`;

  try {
    const data = await api(meta.endpoint);
    state.cache[moduleId] = data;
    const renderer = RENDERERS[moduleId];
    $("module-body").innerHTML = renderer(data);
    $("footer-status").textContent = `${meta.title} ready`;
    bindModuleActions(moduleId);
  } catch (error) {
    $("module-body").innerHTML = `<p class="error">${error.message}</p>`;
    $("footer-status").textContent = "Error";
  }
}

function bindModuleActions(moduleId) {
  if (moduleId === "leave") {
    document.querySelectorAll("[data-leave]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-leave");
        const status = btn.getAttribute("data-status");
        await api(`/api/wfm/leave/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        delete state.cache.leave;
        openModule("leave");
      });
    });
  }

  if (moduleId === "adherence") {
    document.querySelectorAll("[data-ack-adherence]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-ack-adherence");
        await api(`/api/wfm/adherence/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "acknowledged" }),
        });
        delete state.cache.adherence;
        openModule("adherence");
      });
    });
  }

  if (moduleId === "connections") {
    document.querySelectorAll("[data-activate]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.getAttribute("data-activate");
        $("footer-status").textContent = `Activating ${type}…`;
        try {
          const status = await api("/api/wfm/connections/activate", {
            method: "POST",
            body: JSON.stringify({ type }),
          });
          updateDbPill(status);
          delete state.cache.connections;
          openModule("connections");
        } catch (error) {
          $("footer-status").textContent = error.message;
        }
      });
    });

    const probe = $("probe-sql");
    if (probe) {
      probe.addEventListener("click", async () => {
        const out = $("probe-result");
        out.textContent = "Running…";
        try {
          const result = await api("/api/query", {
            method: "POST",
            body: JSON.stringify({ query: "SELECT 1 AS ok" }),
          });
          out.textContent = JSON.stringify(result, null, 2);
        } catch (error) {
          out.textContent = error.message;
        }
      });
    }
  }
}

function updateDbPill(status) {
  const pill = $("db-pill");
  if (!pill) return;
  const type = status?.type || "demo";
  pill.textContent = `DB: ${type}`;
  pill.classList.toggle("is-warn", status && status.connected === false && type !== "demo");
}

function onNavClick(event) {
  const target = event.target.closest("[data-nav]");
  if (!target) return;
  event.preventDefault();
  openModule(target.getAttribute("data-nav"));
}

async function boot() {
  setClock();
  setInterval(setClock, 30_000);

  document.body.addEventListener("click", onNavClick);

  try {
    const [dashboard, health] = await Promise.all([api("/api/wfm/dashboard"), api("/api/health")]);
    state.dashboard = dashboard;
    renderHome();
    updateDbPill(health);
    $("footer-status").textContent = "Overview ready";

    const hash = (location.hash || "#home").replace("#", "") || "home";
    if (hash !== "home" && MODULE_META[hash]) {
      openModule(hash);
    } else {
      openModule("home");
    }
  } catch (error) {
    $("footer-status").textContent = error.message;
    $("module-grid").innerHTML = `<p class="error">${error.message}</p>`;
  }
}

boot();
