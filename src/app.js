const DATA_FILES = {
  bookingsSoq: "./data/bookings_soq_snapshot.csv",
  bookingsEoq: "./data/bookings_eoq_snapshot.csv",
  bookingsPlan: "./data/bookings_plan.csv",
  bookingsForecast: "./data/bookings_forecast.csv",
  erpActuals: "./data/erp_actuals.csv",
  planningVersions: "./data/planning_versions.csv",
  hierarchyMappings: "./data/financial_hierarchy_mappings.csv",
  varianceTaxonomy: "./data/variance_driver_taxonomy.csv",
  revenueDrivers: "./data/revenue_driver_detail.csv",
};

const BRIDGE_OPTIONS = ["Revenue", "Bookings / Closed ACV", "COGS", "Opex"];

const MODE_DEFAULT_METRIC = {
  review: "Revenue",
  gm: "Bookings / Closed ACV",
  fpa: "Opex",
};

const MODE_DEFAULT_COMPARISON = {
  review: "forecast_amount",
  gm: "plan_amount",
  fpa: "forecast_amount",
};

const COMPARISON_SCENARIOS = {
  forecast_amount: "Forecast",
  plan_amount: "Plan",
  prior_period_amount: "Prior Period Actual",
};

const BRIDGE_COPY = {
  Revenue: {
    title: "Revenue Bridge",
    subtitle: "Actual recognized revenue vs the selected Anaplan baseline, tied to ERP revenue lines.",
  },
  "Bookings / Closed ACV": {
    title: "Bookings / Closed ACV Bridge",
    subtitle: "End-of-quarter closed ACV vs aggregate Anaplan bookings baseline, explained from opportunity snapshots.",
  },
  COGS: {
    title: "COGS Bridge",
    subtitle: "ERP COGS actuals vs Anaplan baseline, grouped by GL hierarchy and source-system contributors.",
  },
  Opex: {
    title: "Opex Bridge",
    subtitle: "ERP operating spend vs Anaplan baseline, grouped by workforce, vendor, discretionary, and timing drivers.",
  },
};

const CATEGORY_META = {
  "Pipeline Slippage": {
    color: "#2563eb",
    type: "Temporary",
    takeaway: "Recoverable only if the named opportunities close in the next period.",
  },
  "Closed Lost": {
    color: "#be123c",
    type: "Structural",
    takeaway: "Permanent bookings gap unless replaced by new pipeline.",
  },
  "Deal Amount Change": {
    color: "#7e22ce",
    type: "Deal Quality",
    takeaway: "Closed deal value changed versus the start-of-quarter snapshot; inspect net movement and large positive or negative deal deltas.",
  },
  "New In-Quarter Deal": {
    color: "#15803d",
    type: "Commercial Upside",
    takeaway: "Newly created in-quarter opportunities offset the baseline gap.",
  },
  "Plan-to-forecast gap": {
    color: "#667085",
    type: "Planning Baseline",
    takeaway: "Aggregate Anaplan baseline differs from the opportunity snapshot control total.",
  },
  "Volume / Usage": {
    color: "#0f766e",
    type: "Execution",
    takeaway: "Revenue movement is tied to product-level ERP actuals versus planning baseline.",
  },
  "Pricing / Discounting": {
    color: "#b7791f",
    type: "Execution",
    takeaway: "Realized pricing or discounting changed revenue versus forecast.",
  },
  "Product / Customer Mix": {
    color: "#7e22ce",
    type: "Mix",
    takeaway: "Revenue composition changed across product, customer, segment, or region.",
  },
  "Recognition Timing": {
    color: "#2563eb",
    type: "Temporary",
    takeaway: "Revenue may recover in a later period if service starts or recognition schedules shift forward.",
  },
  "Credits / Concessions": {
    color: "#b7791f",
    type: "One-Time",
    takeaway: "Separate credits and concessions from run-rate revenue before refreshing the forecast.",
  },
  "Credits / Concessions": {
    color: "#b7791f",
    type: "Commercial Adjustment",
    takeaway: "Credits, concessions, or revenue adjustments should be separated from run-rate revenue.",
  },
  "Cloud / Infrastructure": {
    color: "#2563eb",
    type: "Infrastructure",
    takeaway: "Cloud, storage, compute, or AI workload cost changed versus baseline.",
  },
  "Support Delivery": {
    color: "#7e22ce",
    type: "Delivery Cost",
    takeaway: "Support or implementation cost changed gross margin conversion.",
  },
  Workforce: {
    color: "#be123c",
    type: "Workforce",
    takeaway: "Headcount, salary, benefits, or labor coverage differed from plan.",
  },
  "Vendor / Third-Party": {
    color: "#b7791f",
    type: "Vendor",
    takeaway: "Third-party services, contractors, software, or partner spend changed operating cost.",
  },
  "Discretionary Spend": {
    color: "#7e22ce",
    type: "Discretionary",
    takeaway: "Travel, events, campaigns, or program spend differed from baseline.",
  },
  "Timing / Accruals": {
    color: "#2563eb",
    type: "Temporary",
    takeaway: "Invoices or accruals landed in a different period than planned.",
  },
  "Residual / reconciliation gap": {
    color: "#667085",
    type: "Needs Investigation",
    takeaway: "The remaining gap should stay visible until it is mapped to source detail.",
  },
};

const PERIOD_META = {
  "Q1 FY26": {
    status: "Closed",
    analysisType: "Actuals variance",
    valueLabel: "Actual",
    varianceLabel: "Variance",
    closed: true,
  },
  "Q2 FY26": {
    status: "Open",
    analysisType: "Pacing / projected variance",
    valueLabel: "Projected",
    varianceLabel: "Projected variance",
    closed: false,
  },
};

const DRIVER_DISPLAY_THRESHOLD = 50000;
const SUMMARY_EDITOR_ROLE = "finance_editor";

const state = {
  mode: "review",
  period: "Q1 FY26",
  bu: "Enterprise Solutions",
  metric: "Revenue",
  comparison: "forecast_amount",
  role: SUMMARY_EDITOR_ROLE,
};

let data = {};
const customExecutiveSummaries = new Map();
const summaryEditState = {
  active: false,
  key: "",
};

const els = {
  buSelect: document.querySelector("#buSelect"),
  periodSelect: document.querySelector("#periodSelect"),
  metricSelect: document.querySelector("#metricSelect"),
  comparisonSelect: document.querySelector("#comparisonSelect"),
  roleSelect: document.querySelector("#roleSelect"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  modeEyebrow: document.querySelector("#modeEyebrow"),
  viewTitle: document.querySelector("#viewTitle"),
  exportPptxButton: document.querySelector("#exportPptxButton"),
  confidencePill: document.querySelector("#confidencePill"),
  kpiGrid: document.querySelector("#kpiGrid"),
  executiveSummary: document.querySelector("#executiveSummary"),
  summaryEditButton: document.querySelector("#summaryEditButton"),
  bridgeTitle: document.querySelector("#bridgeTitle"),
  bridgeSubtitle: document.querySelector("#bridgeSubtitle"),
  bridgeChart: document.querySelector("#bridgeChart"),
  reconcileBadge: document.querySelector("#reconcileBadge"),
  modeInfo: document.querySelector("#modeInfo"),
  taxonomyGuide: document.querySelector("#taxonomyGuide"),
  driverDetails: document.querySelector("#driverDetails"),
  sliceTables: document.querySelector("#sliceTables"),
  actionsPanel: document.querySelector("#actionsPanel"),
};

init();

async function init() {
  data = await loadData();
  hydrateControls();
  bindEvents();
  applyRoute({ applyDefaults: true });
  render();
}

async function loadData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, path]) => {
      const response = await fetch(path, { cache: "no-store" });
      return [key, parseCSV(await response.text())];
    }),
  );
  return Object.fromEntries(entries);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines.shift());
  return lines.map((line) => {
    const values = splitCSVLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, castValue(values[index] ?? "")]));
  });
}

function splitCSVLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function castValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

function hydrateControls() {
  const buValues = unique([
    ...data.erpActuals.map((row) => row.bu),
    ...data.planningVersions.map((row) => row.bu),
    ...data.bookingsForecast.map((row) => row.bu),
  ]);
  const periodValues = unique([
    ...data.erpActuals.map((row) => row.period),
    ...data.planningVersions.map((row) => row.period),
    ...data.bookingsForecast.map((row) => row.period),
  ]);

  populateSelect(els.buSelect, buValues);
  populateSelect(els.periodSelect, periodValues);
  populateSelect(els.metricSelect, BRIDGE_OPTIONS);
  syncControls();
}

function syncControls() {
  els.buSelect.value = state.bu;
  els.periodSelect.value = state.period;
  els.metricSelect.value = state.metric;
  els.comparisonSelect.value = state.comparison;
  els.roleSelect.value = state.role;
}

function populateSelect(select, options) {
  select.innerHTML = options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
}

function bindEvents() {
  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      state.metric = MODE_DEFAULT_METRIC[state.mode] || state.metric;
      state.comparison = MODE_DEFAULT_COMPARISON[state.mode] || state.comparison;
      window.location.hash = state.mode;
      syncControls();
      render();
    });
  });

  [
    [els.buSelect, "bu"],
    [els.periodSelect, "period"],
    [els.metricSelect, "metric"],
    [els.comparisonSelect, "comparison"],
    [els.roleSelect, "role"],
  ].forEach(([select, key]) => {
    select.addEventListener("change", () => {
      state[key] = select.value;
      if (key === "role" && !canEditExecutiveSummary()) {
        summaryEditState.active = false;
      }
      render();
    });
  });

  els.summaryEditButton.addEventListener("click", () => {
    if (!canEditExecutiveSummary()) return;
    summaryEditState.active = true;
    summaryEditState.key = summaryKey();
    render();
  });

  els.exportPptxButton.addEventListener("click", () => {
    els.exportPptxButton.classList.add("is-placeholder");
    els.exportPptxButton.dataset.tooltip =
      "Prototype affordance: a presentation agent would export this certified analysis into the standard FP&A PowerPoint template.";
    window.setTimeout(() => els.exportPptxButton.classList.remove("is-placeholder"), 2400);
  });

  els.executiveSummary.addEventListener("click", (event) => {
    if (event.target.closest("[data-summary-add]")) {
      addExecutiveSummaryBullet();
    }
    if (event.target.closest("[data-summary-save]")) {
      saveExecutiveSummaryEdit();
    }
    if (event.target.closest("[data-summary-cancel]")) {
      summaryEditState.active = false;
      render();
    }
  });

  window.addEventListener("hashchange", () => {
    applyRoute({ applyDefaults: true });
    syncControls();
    render();
  });
}

function applyRoute({ applyDefaults } = { applyDefaults: false }) {
  const route = window.location.hash.replace("#", "");
  if (!["review", "gm", "fpa"].includes(route)) return;
  const previousMode = state.mode;
  state.mode = route;
  if (applyDefaults && previousMode !== route) {
    state.metric = MODE_DEFAULT_METRIC[route] || state.metric;
    state.comparison = MODE_DEFAULT_COMPARISON[route] || state.comparison;
  }
}

function render() {
  syncControls();
  const analysis = analyze();
  renderShell(analysis);
  renderKpis(analysis);
  renderBridge(analysis);
  renderTaxonomyGuide();
  renderDrivers(analysis);
  renderSlices(analysis);
  renderActions(analysis);
}

function analyze() {
  const control = controlTotalForBridge();
  const drivers = buildDriversForMetric(control);
  const explained = sumAmounts(drivers.filter((driver) => !driver.isResidual));
  const residual = control.totalVariance - explained;

  if (Math.abs(residual) > DRIVER_DISPLAY_THRESHOLD) {
    drivers.push({
      category: "Residual / reconciliation gap",
      amount: residual,
      explanation: "The remaining variance is visible instead of being forced into an unsupported category.",
      evidence: [`Residual after source-backed ${state.metric.toLowerCase()} drivers are applied.`],
      actions: ["Map the residual to additional ERP, Anaplan, or CRM source detail."],
      isResidual: true,
    });
  }

  const signedDrivers = drivers
    .filter((driver) => Math.abs(driver.amount) > DRIVER_DISPLAY_THRESHOLD)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  const temporary = signedDrivers
    .filter((driver) => ["Pipeline Slippage", "Recognition Timing", "Timing / Accruals"].includes(driver.category))
    .reduce((total, driver) => total + Math.abs(driver.amount), 0);

  return {
    ...control,
    drivers: signedDrivers,
    temporary,
    periodMeta: periodMeta(),
    confidence: confidenceFor(signedDrivers, control.totalVariance),
    sliceTables: sliceTablesForBridge(),
  };
}

function controlTotalForBridge() {
  if (state.metric === "Bookings / Closed ACV") {
    const actual = bookingsActual();
    const comparison = bookingsBaseline();
    return { actual, comparison, totalVariance: actual - comparison };
  }

  const actual = financeActualTotal(state.metric);
  const comparison = financeBaselineTotal(state.metric);
  const totalVariance = isCostMetric(state.metric) ? comparison - actual : actual - comparison;
  return { actual, comparison, totalVariance };
}

function buildDriversForMetric(control) {
  if (state.metric === "Bookings / Closed ACV") return buildBookingsDrivers(control);
  if (state.metric === "Revenue") return buildRevenueDrivers(control);
  return buildFinanceDrivers(state.metric);
}

function buildRevenueDrivers() {
  const rows = data.revenueDrivers.filter((row) => row.period === state.period && row.bu === state.bu);
  const grouped = new Map();

  rows.forEach((row) => {
    const current =
      grouped.get(row.driver_category) || {
        category: row.driver_category,
        amount: 0,
        rows: [],
      };
    current.amount += row.amount;
    current.rows.push(row);
    grouped.set(row.driver_category, current);
  });

  return [...grouped.values()].map((group) => ({
    category: group.category,
    amount: group.amount,
    explanation: revenueDriverExplanation(group.category),
    evidence: group.rows.slice(0, 4).map(revenueEvidence),
    records: group.rows.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
    actions: actionsForRevenueCategory(group.category),
  }));
}

function buildBookingsDrivers(control) {
  const soqRows = bookingsSoqRows();
  const eoqRows = bookingsEoqRows();
  const soqById = new Map(soqRows.map((row) => [row.opportunity_id, row]));
  const drivers = [];

  const pushDriver = (category, rows, amount, explanation, actions) => {
    if (!rows.length && Math.abs(amount) <= DRIVER_DISPLAY_THRESHOLD) return;
    drivers.push({
      category,
      amount,
      explanation,
      evidence: rows.slice(0, 4).map((row) => bookingEvidence(category, row, soqById.get(row.opportunity_id))),
      records: rows,
      actions,
    });
  };

  const slipped = eoqRows.filter((row) => soqById.has(row.opportunity_id) && row.status === "Slipped");
  pushDriver(
    "Pipeline Slippage",
    slipped,
    -sum(slipped.map((row) => soqById.get(row.opportunity_id)), "amount"),
    "Start-of-quarter forecast opportunities moved outside the selected period.",
    ["Confirm revised close dates and next-period commit coverage."],
  );

  const lost = eoqRows.filter((row) => soqById.has(row.opportunity_id) && row.status === "Closed Lost");
  pushDriver(
    "Closed Lost",
    lost,
    -sum(lost.map((row) => soqById.get(row.opportunity_id)), "amount"),
    "Start-of-quarter forecast opportunities were closed lost by quarter end.",
    ["Review closed-lost outcome codes and pipeline replacement coverage."],
  );

  const closedFromSnapshot = eoqRows.filter((row) => soqById.has(row.opportunity_id) && row.status === "Closed Won");
  const changedAmounts = closedFromSnapshot.filter((row) => row.amount !== soqById.get(row.opportunity_id).amount);
  pushDriver(
    "Deal Amount Change",
    changedAmounts,
    changedAmounts.reduce((total, row) => total + (row.amount - soqById.get(row.opportunity_id).amount), 0),
    "Closed-won opportunities landed above or below their start-of-quarter snapshot amount.",
    ["Refresh deal size assumptions by product and owner."],
  );

  const newInQuarter = eoqRows.filter(
    (row) => !soqById.has(row.opportunity_id) && row.status === "Closed Won" && row.created_date >= soqSnapshotDate(),
  );
  pushDriver(
    "New In-Quarter Deal",
    newInQuarter,
    sum(newInQuarter, "amount"),
    "Opportunities created after the start-of-quarter snapshot closed inside the quarter.",
    ["Identify whether new in-quarter wins are repeatable pipeline generation or pull-forward."],
  );

  return drivers;
}

function buildFinanceDrivers(metric) {
  const actualGroups = groupFinanceRows(financeActualRows(metric), metric, "actual");
  const baselineGroups = groupFinanceRows(financeBaselineRows(metric), metric, "baseline");
  const categories = unique([...actualGroups.keys(), ...baselineGroups.keys()]);

  return categories.map((category) => {
    const actualRows = actualGroups.get(category) || [];
    const baselineRows = baselineGroups.get(category) || [];
    const actual = sumSigned(actualRows, metric);
    const baseline = sumSigned(baselineRows, metric);
    const amount = isCostMetric(metric) ? baseline - actual : actual - baseline;
    const records = financeRecordRows(actualRows, baselineRows, metric);

    return {
      category,
      amount,
      explanation: `${metric} variance for ${category.toLowerCase()} is calculated from ERP actuals against ${scenarioLabel().toLowerCase()} planning rows.`,
      evidence: records.slice(0, 4).map((row) => financeEvidence(row, metric)),
      records,
      actions: actionsForFinanceCategory(category, metric),
    };
  });
}

function groupFinanceRows(rows, metric, sourceType) {
  const grouped = new Map();
  rows.forEach((row) => {
    const category = financeDriverCategory(row, metric);
    const record = { ...row, sourceType };
    grouped.set(category, [...(grouped.get(category) || []), record]);
  });
  return grouped;
}

function financeDriverCategory(row, metric) {
  const mapping = hierarchyFor(row.gl_account);
  if (metric === "Revenue") {
    return mapping.driver_category === "Credits / Concessions" ? "Credits / Concessions" : "Volume / Usage";
  }
  if (metric === "Opex") {
    if (mapping.driver_family === "Workforce") return "Workforce";
    if (mapping.driver_family === "Discretionary") return "Discretionary Spend";
    if (/accrual|timing/i.test(`${row.gl_account_name} ${row.vendor}`)) return "Timing / Accruals";
    return "Vendor / Third-Party";
  }
  return mapping.driver_category || "Residual / reconciliation gap";
}

function financeRecordRows(actualRows, baselineRows, metric) {
  const grouped = new Map();
  [...actualRows, ...baselineRows].forEach((row) => {
    const key = [row.gl_account, row.cost_center, row.department, row.vendor, row.product, row.bu].join("|");
    const current =
      grouped.get(key) || {
        gl_account: row.gl_account,
        gl_account_name: row.gl_account_name,
        cost_center: row.cost_center,
        department: row.department,
        vendor: row.vendor,
        product: row.product,
        bu: row.bu,
        actual: 0,
        baseline: 0,
      };
    if (row.sourceType === "actual") current.actual += signedAmount(row, metric);
    if (row.sourceType === "baseline") current.baseline += signedAmount(row, metric);
    current.variance = isCostMetric(metric) ? current.baseline - current.actual : current.actual - current.baseline;
    grouped.set(key, current);
  });

  return [...grouped.values()].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

function bookingsActual() {
  return sum(bookingsEoqRows().filter((row) => row.status === "Closed Won"), "amount");
}

function bookingsBaseline() {
  const sourceRows =
    state.comparison === "plan_amount"
      ? data.bookingsPlan.filter((row) => row.period === state.period && row.bu === state.bu)
      : data.bookingsForecast.filter((row) => row.period === state.period && row.bu === state.bu && row.version.includes("Start Forecast"));
  return sum(sourceRows, "amount");
}

function bookingsSoqRows() {
  return data.bookingsSoq.filter((row) => row.period === state.period && row.bu === state.bu);
}

function bookingsEoqRows() {
  return data.bookingsEoq.filter((row) => row.period === state.period && row.bu === state.bu);
}

function soqSnapshotDate() {
  return bookingsSoqRows()[0]?.snapshot_date || `${state.period.slice(0, 2) === "Q1" ? "2026-01-01" : "2026-04-01"}`;
}

function financeActualRows(metric) {
  return data.erpActuals.filter((row) => row.period === state.period && row.bu === state.bu && rowBelongsToMetric(row, metric));
}

function financeBaselineRows(metric) {
  return data.planningVersions.filter(
    (row) =>
      row.period === state.period &&
      row.bu === state.bu &&
      row.scenario === scenarioLabel() &&
      rowBelongsToMetric(row, metric),
  );
}

function financeActualTotal(metric) {
  return sumSigned(financeActualRows(metric), metric);
}

function financeBaselineTotal(metric) {
  return sumSigned(financeBaselineRows(metric), metric);
}

function rowBelongsToMetric(row, metric) {
  const mapping = hierarchyFor(row.gl_account);
  if (metric === "Revenue") return mapping.statement_line === "Revenue";
  if (metric === "COGS") return mapping.statement_line === "COGS";
  if (metric === "Opex") return !["Revenue", "COGS"].includes(mapping.statement_line);
  return false;
}

function hierarchyFor(glAccount) {
  return (
    data.hierarchyMappings.find((row) => String(row.gl_account) === String(glAccount)) || {
      statement_line: "Unmapped",
      driver_family: "Unmapped",
      driver_category: "Residual / reconciliation gap",
      normal_balance: "Debit",
    }
  );
}

function signedAmount(row, metric) {
  if (metric === "Revenue") return -Number(row.amount || 0);
  return Number(row.amount || 0);
}

function sumSigned(rows, metric) {
  return rows.reduce((total, row) => total + signedAmount(row, metric), 0);
}

function isCostMetric(metric) {
  return metric === "COGS" || metric === "Opex";
}

function renderShell(analysis) {
  els.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });

  const modeLabel = {
    review: "P&L Review",
    gm: "GM Brief",
    fpa: "FP&A Workspace",
  }[state.mode];

  els.modeEyebrow.textContent = modeLabel;
  els.viewTitle.textContent = `${state.bu} ${metricTitleLabel()} variance`;
  els.exportPptxButton.dataset.tooltip =
    "Export this review as a PowerPoint using the approved FP&A template.";
  els.confidencePill.textContent = `${analysis.periodMeta.status} · ${analysis.periodMeta.analysisType} · Confidence: ${analysis.confidence}`;
  els.modeInfo.dataset.tooltip = modeInfoText();
  els.summaryEditButton.hidden = !canEditExecutiveSummary();
  els.summaryEditButton.dataset.tooltip = canEditExecutiveSummary()
    ? "Finance editors can customize the executive summary for this review."
    : "";
  els.executiveSummary.innerHTML = renderExecutiveSummary(analysis);
}

function renderKpis(analysis) {
  els.kpiGrid.innerHTML = buildScorecards(analysis)
    .map(
      (card) => `
        <article class="kpi-card scorecard">
          <p>${escapeHtml(card.label)}</p>
          <strong>${card.format === "percent" ? percent(card.actual) : money(card.actual)}</strong>
          <div class="kpi-lines">
            <span>${escapeHtml(card.comparisonLabel)}: ${card.format === "percent" ? percent(card.comparison) : money(card.comparison)}</span>
            <span class="${card.variance < 0 ? "negative" : "positive"}">${escapeHtml(card.varianceLabel)}: ${card.format === "percent" ? percent(card.variance) : money(card.variance)} (${percent(Math.abs(card.variance) / Math.max(1, Math.abs(card.comparison)))})</span>
          </div>
          <small>${escapeHtml(card.note)}</small>
        </article>
      `,
    )
    .join("");
}

function buildScorecards(analysis) {
  const revenue = totalCardValues("Revenue");
  const cogs = totalCardValues("COGS");
  const opex = totalCardValues("Opex");
  const bookings = {
    actual: bookingsActual(),
    comparison: bookingsBaseline(),
  };
  bookings.variance = bookings.actual - bookings.comparison;

  if (state.metric === "Bookings / Closed ACV") {
    return [
      card("Closed ACV", bookings.actual, bookings.comparison, bookings.variance, "Anaplan baseline", "Variance", "Closed-won commercial value from EOQ snapshot."),
      card("SOQ Forecast Pipeline ACV", sum(bookingsSoqRows(), "amount"), bookings.comparison, sum(bookingsSoqRows(), "amount") - bookings.comparison, "Anaplan baseline", "Gap", "Start-of-quarter forecasted opportunity pool; not confirmed bookings."),
      card("New In-Quarter Closed ACV", sum(bookingsEoqRows().filter((row) => !bookingsSoqRows().some((soq) => soq.opportunity_id === row.opportunity_id) && row.status === "Closed Won"), "amount"), bookings.comparison, 0, "Anaplan baseline", "Variance", "Closed-won ACV from opportunities created after the SOQ snapshot."),
      card(`${comparisonLabel().replace(" ACV", "")} Attainment`, bookings.comparison ? bookings.actual / bookings.comparison : 0, 1, bookings.comparison ? bookings.actual / bookings.comparison - 1 : 0, "Target", "Gap", "Closed ACV as a share of the selected bookings baseline.", "percent"),
    ];
  }

  return [
    card(metricLabel(), analysis.actual, analysis.comparison, analysis.totalVariance, comparisonLabel(), "Variance", `${analysis.periodMeta.valueLabel} ${metricLabel().toLowerCase()} from ERP actuals.`),
    card("Revenue", revenue.actual, revenue.comparison, revenue.variance, comparisonLabel(), "Variance", "Recognized revenue control total."),
    card("COGS", cogs.actual, cogs.comparison, cogs.variance, comparisonLabel(), "Variance", "Cost of goods sold control total."),
    card("Opex", opex.actual, opex.comparison, opex.variance, comparisonLabel(), "Variance", "Operating expense control total."),
  ];
}

function totalCardValues(metric) {
  const actual = financeActualTotal(metric);
  const comparison = financeBaselineTotal(metric);
  const variance = isCostMetric(metric) ? comparison - actual : actual - comparison;
  return { actual, comparison, variance };
}

function card(label, actual, comparison, variance, comparisonLabelValue, varianceLabel, note, format) {
  return { label, actual, comparison, variance, comparisonLabel: comparisonLabelValue, varianceLabel, note, format };
}

function renderBridge(analysis) {
  const bridgeDrivers = analysis.drivers;
  const maxAmount = Math.max(...bridgeDrivers.map((driver) => Math.abs(driver.amount)), 1);
  const explained = sumAmounts(bridgeDrivers);
  const gap = analysis.totalVariance - explained;
  const reconciles = Math.abs(gap) <= DRIVER_DISPLAY_THRESHOLD;
  const copy = BRIDGE_COPY[state.metric] || BRIDGE_COPY.Revenue;

  els.bridgeTitle.textContent = copy.title;
  els.bridgeSubtitle.textContent = copy.subtitle;
  els.reconcileBadge.textContent = reconciles ? "Reconciled to variance" : "Reconciliation gap";

  const driverRows = bridgeDrivers
    .map((driver) => {
      const meta = categoryMeta(driver.category);
      const width = Math.max(4, (Math.abs(driver.amount) / maxAmount) * 100);
      return `
        <div class="bridge-row" tabindex="0" role="button" aria-label="${escapeHtml(driver.category)} details">
          <div class="bridge-label">${escapeHtml(driver.category)}</div>
          <div class="bridge-track" aria-label="${escapeHtml(driver.category)} ${money(driver.amount)}">
            <div class="bridge-bar" style="width:${width}%;background:${meta.color}"></div>
          </div>
          <div class="bridge-value ${driver.amount < 0 ? "negative" : "positive"}">${money(driver.amount)}</div>
          ${renderBridgeTooltip(driver)}
        </div>
      `;
    })
    .join("");

  const reconciliationNote = reconciles
    ? `Ties to ${analysis.periodMeta.varianceLabel.toLowerCase()} ${money(analysis.totalVariance)}`
    : `Leaves ${money(gap)} unexplained vs ${money(analysis.totalVariance)}`;

  els.bridgeChart.innerHTML = `
    ${driverRows || `<p class="empty-state">No material source-backed drivers for the selected view.</p>`}
    <div class="bridge-total">
      <div>
        <div class="bridge-total-label">Driver total</div>
        <div class="bridge-total-note">${escapeHtml(reconciliationNote)}</div>
      </div>
      <div class="bridge-total-value ${explained < 0 ? "negative" : "positive"}">${money(explained)}</div>
    </div>
  `;
}

function renderBridgeTooltip(driver) {
  const records = (driver.records || []).slice(0, 4);
  const rows = records.length
    ? records.map((record) => renderTooltipRecord(record)).join("")
    : driver.evidence.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `
    <div class="bridge-tooltip" role="tooltip">
      <div class="tooltip-title">Source evidence</div>
      <p>${escapeHtml(driver.explanation)}</p>
      <ul>${rows}</ul>
    </div>
  `;
}

function renderTooltipRecord(record) {
  if (record.opportunity_id) {
    return `
      <li>
        <strong>${escapeHtml(record.account_name)}</strong>
        <span>${money(record.amount)} · ${escapeHtml(record.region)} · ${escapeHtml(record.segment)}</span>
        <span>Owner: ${escapeHtml(record.owner)} · ${escapeHtml(record.status || record.stage)}</span>
        <em>${escapeHtml(formatCodeLabel(record.outcome_code || ""))} · ${escapeHtml(record.source_note_id || "")}</em>
      </li>
    `;
  }

  if (record.account_name && record.driver_category) {
    return `
      <li>
        <strong>${escapeHtml(record.account_name)}</strong>
        <span>${escapeHtml(record.product)} · ${escapeHtml(record.segment)} · ${money(record.amount)} impact</span>
        <span>${escapeHtml(record.actual_value)} actual vs ${escapeHtml(record.baseline_value)} baseline ${escapeHtml(record.unit_of_measure)}</span>
        <em>${escapeHtml(formatCodeLabel(record.variance_basis_code))} · ${escapeHtml(record.source_record_id)}</em>
      </li>
    `;
  }

  return `
    <li>
      <strong>${escapeHtml(record.vendor || record.product || record.gl_account_name)}</strong>
      <span>${escapeHtml(record.gl_account_name)} · ${escapeHtml(record.department || "No department")}</span>
      <span>Actual ${money(record.actual)} vs ${comparisonLabel().toLowerCase()} ${money(record.baseline)}</span>
      <em>${escapeHtml(record.product || record.cost_center || record.bu)}</em>
    </li>
  `;
}

function renderDrivers(analysis) {
  const denominator = Math.max(1, Math.abs(analysis.totalVariance));
  els.driverDetails.innerHTML = analysis.drivers
    .map((driver) => {
      const meta = categoryMeta(driver.category);
      const evidence = driver.evidence.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return `
        <article class="driver-card">
          <header>
            <div>
              <h4>${escapeHtml(driver.category)}</h4>
              <p>${escapeHtml(meta.type)} · ${percent(Math.abs(driver.amount) / denominator)} of total variance</p>
            </div>
            <div class="amount ${driver.amount < 0 ? "negative" : "positive"}">${money(driver.amount)}</div>
          </header>
          <p>${escapeHtml(driver.explanation)}</p>
          <p><strong>Finance takeaway:</strong> ${escapeHtml(meta.takeaway)}</p>
          <ul>${evidence}</ul>
        </article>
      `;
    })
    .join("");
}

function renderTaxonomyGuide() {
  const metricKey =
    state.metric === "Bookings / Closed ACV" ? "Bookings" : state.metric === "Opex" ? "OpEx" : state.metric;
  const guide = data.varianceTaxonomy.filter((row) => row.metric === metricKey);
  els.taxonomyGuide.innerHTML = guide
    .map((item) => {
      const meta = categoryMeta(item.driver_category);
      return `
        <article class="taxonomy-item" style="--taxonomy-color:${meta.color}">
          <div class="taxonomy-label">
            <span class="taxonomy-swatch"></span>
            <strong>${escapeHtml(item.driver_category)}</strong>
          </div>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `;
    })
    .join("");
}

function renderSlices(analysis) {
  els.sliceTables.innerHTML = analysis.sliceTables
    .map(
      ({ title, rows }) => `
        <div>
          <div class="mini-heading">${escapeHtml(title)}</div>
          <table>
            <thead>
              <tr><th>Slice</th><th>Actual</th><th>${escapeHtml(comparisonLabel())}</th><th>Variance</th></tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      <td>${escapeHtml(row.name)}</td>
                      <td>${money(row.actual)}</td>
                      <td>${money(row.comparison)}</td>
                      <td class="${row.variance < 0 ? "negative" : "positive"}">${money(row.variance)}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `,
    )
    .join("");
}

function renderActions(analysis) {
  const actions = unique(analysis.drivers.flatMap((driver) => driver.actions)).slice(0, 5);
  const openQuestions = openQuestionsFor(analysis);
  els.actionsPanel.innerHTML = `
    <div>
      <div class="mini-heading">Recommended actions</div>
      <ul>${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
    </div>
    <div>
      <div class="mini-heading">Open questions</div>
      <ul>${openQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderExecutiveSummary(analysis) {
  const key = summaryKey();
  const items = executiveSummaryItems(analysis);
  if (summaryEditState.active && summaryEditState.key === key && canEditExecutiveSummary()) {
    return renderExecutiveSummaryEditor(items);
  }

  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${summaryAuditLine(key)}`;
}

function executiveSummaryItems(analysis) {
  const key = summaryKey();
  if (customExecutiveSummaries.has(key)) return customExecutiveSummaries.get(key);

  const topDrivers = analysis.drivers.filter((driver) => !driver.isResidual).slice(0, 2);
  const direction = state.metric === "Bookings / Closed ACV" || state.metric === "Revenue"
    ? analysis.totalVariance >= 0 ? "ahead of" : "behind"
    : analysis.totalVariance >= 0 ? "below" : "above";
  const baseline = comparisonLabel().toLowerCase();
  const baselinePhrase = state.metric === "Bookings / Closed ACV" ? baseline.replace(" acv", "") : baseline;
  const temporaryShare = percent(Math.min(1, analysis.temporary / Math.max(1, Math.abs(analysis.totalVariance))));
  const driverText = topDrivers.length
    ? topDrivers.map((driver) => `${driver.category.toLowerCase()} (${money(driver.amount)})`).join(" and ")
    : "no material source-backed drivers";
  const items = [
    `${state.bu} is ${money(Math.abs(analysis.totalVariance))} ${direction} ${baselinePhrase} for ${metricLabel().toLowerCase()} in ${state.period}.`,
    `The largest source-backed drivers are ${driverText}. Temporary timing represents ${temporaryShare} of the selected variance.`,
  ];

  return items;
}

function renderExecutiveSummaryEditor(items) {
  return `
    <div class="summary-editor" aria-label="Edit executive summary">
      ${items
        .map(
          (item, index) => `
            <label>
              Bullet ${index + 1}
              <textarea class="summary-editor-field" rows="2">${escapeHtml(item)}</textarea>
            </label>
          `,
        )
        .join("")}
      <div class="summary-edit-actions">
        <button type="button" class="summary-add" data-summary-add>Add bullet</button>
        <span class="summary-edit-spacer"></span>
        <button type="button" class="summary-save" data-summary-save>Save</button>
        <button type="button" class="summary-cancel" data-summary-cancel>Cancel</button>
      </div>
    </div>
  `;
}

function addExecutiveSummaryBullet() {
  const actions = els.executiveSummary.querySelector(".summary-edit-actions");
  if (!actions) return;
  const fieldCount = els.executiveSummary.querySelectorAll(".summary-editor-field").length;
  actions.insertAdjacentHTML(
    "beforebegin",
    `
      <label>
        Bullet ${fieldCount + 1}
        <textarea class="summary-editor-field" rows="2"></textarea>
      </label>
    `,
  );
  const fields = els.executiveSummary.querySelectorAll(".summary-editor-field");
  fields[fields.length - 1].focus();
}

function saveExecutiveSummaryEdit() {
  const items = [...els.executiveSummary.querySelectorAll(".summary-editor-field")]
    .map((field) => field.value.trim())
    .filter(Boolean);
  if (items.length) customExecutiveSummaries.set(summaryKey(), items);
  summaryEditState.active = false;
  render();
}

function summaryAuditLine(key) {
  if (!customExecutiveSummaries.has(key)) return "";
  return `<div class="summary-audit">Customized by Finance Editor in this prototype session.</div>`;
}

function summaryKey() {
  return [state.mode, state.period, state.bu, state.metric, state.comparison].join("|");
}

function canEditExecutiveSummary() {
  return state.role === SUMMARY_EDITOR_ROLE;
}

function modeInfoText() {
  if (state.mode === "gm") {
    return "GM Brief defaults to Actual vs Plan bookings because this view is meant for commercial leadership: closed ACV, plan attainment, deal slippage, closed-lost exposure, and named owner follow-up.";
  }
  if (state.mode === "fpa") {
    return "FP&A Workspace emphasizes reconciliation, source rows, taxonomy, and open questions for analyst follow-up.";
  }
  return "P&L Review emphasizes ERP actuals vs Anaplan baselines across recognized revenue, COGS, and operating spend.";
}

function sliceTablesForBridge() {
  if (state.metric === "Bookings / Closed ACV") {
    return [
      { title: "By Product", rows: sliceBookings("product") },
      { title: "By Owner", rows: sliceBookings("owner") },
    ];
  }

  return [
    { title: "By Product", rows: sliceFinance("product", state.metric) },
    { title: "By Department", rows: sliceFinance("department", state.metric) },
  ];
}

function sliceBookings(key) {
  const soqRows = bookingsSoqRows();
  const eoqRows = bookingsEoqRows();
  const grouped = new Map();

  soqRows.forEach((row) => {
    const name = row[key] || "Unassigned";
    const current = grouped.get(name) || { name, actual: 0, comparison: 0, variance: 0 };
    current.comparison += row.amount;
    grouped.set(name, current);
  });

  eoqRows.filter((row) => row.status === "Closed Won").forEach((row) => {
    const name = row[key] || "Unassigned";
    const current = grouped.get(name) || { name, actual: 0, comparison: 0, variance: 0 };
    current.actual += row.amount;
    grouped.set(name, current);
  });

  return [...grouped.values()].map((row) => ({ ...row, variance: row.actual - row.comparison })).sort(byAbsVariance);
}

function sliceFinance(key, metric) {
  const grouped = new Map();
  financeRecordRows(financeActualRows(metric).map((row) => ({ ...row, sourceType: "actual" })), financeBaselineRows(metric).map((row) => ({ ...row, sourceType: "baseline" })), metric).forEach((row) => {
    const name = row[key] || "Unassigned";
    const current = grouped.get(name) || { name, actual: 0, comparison: 0, variance: 0 };
    current.actual += row.actual;
    current.comparison += row.baseline;
    current.variance += row.variance;
    grouped.set(name, current);
  });
  return [...grouped.values()].sort(byAbsVariance);
}

function bookingEvidence(category, row, soqRow) {
  if (category === "Pipeline Slippage") return `${row.account_name}: ${money(soqRow.amount)} slipped from ${soqRow.close_date} to ${row.close_date}.`;
  if (category === "Closed Lost") return `${row.account_name}: ${money(soqRow.amount)} closed lost; ${formatCodeLabel(row.outcome_code)} (${row.source_note_id}).`;
  if (category === "Deal Amount Change") return `${row.account_name}: closed ${money(row.amount)} vs SOQ ${money(soqRow.amount)}.`;
  return `${row.account_name}: ${money(row.amount)} closed after being created on ${row.created_date}; ${formatCodeLabel(row.outcome_code)} (${row.source_note_id}).`;
}

function financeEvidence(row, metric) {
  const direction = row.variance < 0 ? "unfavorable" : "favorable";
  const subject = row.vendor || row.product || row.gl_account_name;
  return `${subject}: ${money(row.variance)} ${direction} impact, ERP actual ${money(row.actual)} vs ${comparisonLabel().toLowerCase()} ${money(row.baseline)}.`;
}

function revenueEvidence(row) {
  return `${row.account_name}: ${money(row.amount)} impact, ${row.actual_value} actual vs ${row.baseline_value} baseline ${row.unit_of_measure}; basis ${formatCodeLabel(row.variance_basis_code)} from ${row.source_system} ${row.source_record_id}.`;
}

function revenueDriverExplanation(category) {
  if (category === "Recognition Timing") {
    return "Recognized revenue moved out of Q1 because start dates, service periods, or recognition schedules differed from the forecast.";
  }
  if (category === "Volume / Usage") {
    return "Recognized revenue changed because the installed base consumed, activated, renewed, expanded, or contracted fewer units than forecast.";
  }
  if (category === "Pricing / Discounting") {
    return "Recognized revenue changed because realized pricing or discounting differed from forecast assumptions.";
  }
  if (category === "Product / Customer Mix") {
    return "Recognized revenue changed because the product, segment, or customer mix shifted versus forecast.";
  }
  if (category === "Credits / Concessions") {
    return "One-time credits, concessions, or accounting adjustments reduced recognized revenue.";
  }
  return "Recognized revenue changed versus forecast based on certified revenue subledger detail.";
}

function actionsForRevenueCategory(category) {
  if (category === "Recognition Timing") return ["Reconcile booking dates, service start dates, and rev-rec schedules."];
  if (category === "Volume / Usage") return ["Refresh seat, usage, renewal, expansion, and churn assumptions."];
  if (category === "Pricing / Discounting") return ["Review deal desk approvals and realized discount assumptions."];
  if (category === "Product / Customer Mix") return ["Separate mix shift from true volume pressure in the next forecast."];
  if (category === "Credits / Concessions") return ["Validate one-time credits before carrying them into the run-rate forecast."];
  return ["Review revenue source detail and update the driver mapping."];
}

function actionsForFinanceCategory(category, metric) {
  if (category === "Workforce") return ["Reconcile headcount, backfills, and labor cost to the workforce plan."];
  if (category === "Vendor / Third-Party") return ["Review vendor owners, active SOWs, and forecast run-rate assumptions."];
  if (category === "Discretionary Spend") return ["Separate approved programs from discretionary overruns before refreshing the forecast."];
  if (category === "Cloud / Infrastructure") return ["Refresh usage, committed-spend coverage, and workload assumptions."];
  if (category === "Support Delivery") return ["Review support volume, implementation load, and partner utilization."];
  if (metric === "Revenue") return ["Validate product-level revenue movement against billing and revenue recognition schedules."];
  return ["Review source detail and update the driver mapping if needed."];
}

function openQuestionsFor(analysis) {
  const questions = ["Are ERP actuals and Anaplan baselines from the same close cycle?"];
  if (state.metric === "Bookings / Closed ACV") {
    questions.unshift("Which slipped opportunities have customer-confirmed next-period close dates?");
    questions.push("Does the aggregate Anaplan bookings baseline reconcile to the SOQ CRM snapshot?");
  } else {
    questions.push("Are any material manual journals or planning overlays missing from the source fixtures?");
  }
  if (analysis.drivers.some((driver) => driver.category === "Residual / reconciliation gap")) {
    questions.unshift("What source rows explain the residual bridge gap?");
  }
  return questions.slice(0, 4);
}

function confidenceFor(drivers, totalVariance) {
  const residual = drivers.find((driver) => driver.category === "Residual / reconciliation gap");
  if (!residual) return "High";
  const residualShare = Math.abs(residual.amount) / Math.max(1, Math.abs(totalVariance));
  if (residualShare > 0.3) return "Medium";
  return "Medium-High";
}

function comparisonLabel() {
  if (state.metric === "Bookings / Closed ACV") {
    if (state.comparison === "plan_amount") return "Plan ACV";
    return "Forecast ACV";
  }
  return {
    forecast_amount: "Forecast",
    plan_amount: "Plan",
    prior_period_amount: "Prior Period",
  }[state.comparison];
}

function scenarioLabel() {
  return COMPARISON_SCENARIOS[state.comparison] || "Forecast";
}

function metricLabel() {
  if (state.metric === "Revenue") return "Recognized Revenue";
  if (state.metric === "Bookings / Closed ACV") return "Bookings / Closed ACV";
  if (state.metric === "COGS") return "COGS";
  return "Opex";
}

function metricTitleLabel() {
  if (state.metric === "Revenue") return "recognized revenue";
  if (state.metric === "Bookings / Closed ACV") return "bookings / closed ACV";
  if (state.metric === "COGS") return "COGS";
  return "spend / opex";
}

function periodMeta() {
  return PERIOD_META[state.period] || {
    status: "Unknown",
    analysisType: "Variance analysis",
    valueLabel: "Actual",
    varianceLabel: "Variance",
    closed: true,
  };
}

function categoryMeta(category) {
  return (
    CATEGORY_META[category] || {
      color: "#667085",
      type: "Bridge Driver",
      takeaway: "Review the source detail behind this driver.",
    }
  );
}

function byAbsVariance(a, b) {
  return Math.abs(b.variance) - Math.abs(a.variance);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function sumAmounts(rows) {
  return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
}

function money(value) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCodeLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
