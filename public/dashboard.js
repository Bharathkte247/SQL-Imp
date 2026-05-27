function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadDashboard() {
  const kpiGrid = document.getElementById("kpiGrid");
  const roadmapList = document.getElementById("roadmapList");

  kpiGrid.innerHTML = "<p>Loading summary...</p>";
  roadmapList.innerHTML = "";

  try {
    const response = await fetch("/api/qra/dashboard");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load dashboard data.");
    }

    kpiGrid.innerHTML = data.kpis
      .map(
        (kpi) => `
          <article class="kpi-card">
            <p class="kpi-label">${escapeHtml(kpi.label)}</p>
            <p class="kpi-value">${escapeHtml(kpi.value)}</p>
          </article>
        `
      )
      .join("");

    roadmapList.innerHTML = data.roadmapPhases
      .map((phase) => `<li>${escapeHtml(phase)}</li>`)
      .join("");
  } catch (error) {
    kpiGrid.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
  }
}

loadDashboard();
