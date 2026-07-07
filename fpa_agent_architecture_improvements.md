# FP&A Agent Prototype - Architecture Improvements

## Current Limitation

The prototype currently models Actual, Plan, Forecast, and Prior Period comparisons at the opportunity level for all metrics.

This is realistic for Bookings, but not for Revenue, OpEx, or COGS, which are typically managed through ERP and planning systems rather than individual opportunities.

## Recommendation

The proposed direction makes sense and should be treated as the next major architecture step.

The most important design principle is to separate calculation from narration:

- The data layer owns variance calculation, driver attribution, reconciliation, drill-downs, and source evidence.
- The LLM owns explanation, summarization, executive narrative, and follow-up Q&A over certified facts.

That split makes the prototype more credible for FP&A because the LLM is no longer being asked to discover financial truth from raw records or infer math. It narrates a deterministic analysis that already reconciles to source-system control totals.

## Recommended Data Model

### Bookings

Bookings can remain opportunity-centric.

Inputs:

- Opportunity snapshots, at minimum start-of-quarter and end-of-quarter
- Bookings plan
- Bookings forecast
- Bookings actuals

Primary variance drivers:

- Slipped deals
- Closed-lost deals
- Amount reductions
- Pull-in deals
- New in-quarter deals
- Forecast category changes

Required grain:

- Opportunity ID
- Account
- Owner
- Region
- Segment
- Product
- Forecast category
- Stage/status
- Forecast amount
- Actual amount
- Prior and current close date
- Snapshot date or version

### Revenue, OpEx, and COGS

Revenue, OpEx, and COGS should move to finance-system grain instead of opportunity grain.

Inputs:

- ERP actuals
- Anaplan plan versions
- Anaplan forecast versions
- Financial hierarchy mappings

ERP actuals should include:

- GL account
- Cost center
- Department
- Vendor
- Product or business unit
- Amount
- Fiscal period

Planning data should include:

- Scenario or version, such as Plan, Forecast, Prior Forecast, and Latest Estimate
- Fiscal period
- GL account or planning account
- Cost center or department
- Product or business unit
- Amount
- Optional driver fields such as headcount, vendor, cloud usage, units, or price

Hierarchy mappings should classify GL accounts into categories such as:

- Revenue
- COGS
- Engineering OpEx
- Sales OpEx
- Marketing OpEx
- G&A

## Variance Analysis Workflow

1. Calculate the variance deterministically.
2. Reconcile the variance to a financial control total.
3. Rank the largest contributing categories.
4. Drill into contributors using certified dimensions.
5. Pass certified drivers and source evidence to the LLM.
6. Generate the executive narrative.
7. Support follow-up Q&A by querying the same certified driver layer.

Example:

```text
OpEx Plan = $25M
OpEx Actual = $27M
Variance = +$2M

Top Drivers:
- Engineering Salaries +$1.0M
- Contractors +$0.6M
- Marketing +$0.3M
- Travel +$0.1M

Contractor Detail:
- Accenture +$350K
- Deloitte +$250K
```

The LLM should narrate these findings rather than discover them independently.

## Proposed Implementation Plan

### Phase 1: Make Source Models Explicit

Add separate source files or tables for:

- `bookings_snapshots`
- `bookings_plan`
- `bookings_forecast`
- `erp_actuals`
- `planning_versions`
- `financial_hierarchy_mappings`
- `vendor_department_mappings`, if vendor ownership is not already available from ERP

Keep the existing opportunity file for bookings only.

Sample CSV fixtures created for this prototype:

- `data/bookings_soq_snapshot.csv`
- `data/bookings_eoq_snapshot.csv`
- `data/bookings_plan.csv`
- `data/bookings_forecast.csv`
- `data/erp_actuals.csv`
- `data/planning_versions.csv`
- `data/financial_hierarchy_mappings.csv`
- `data/variance_driver_taxonomy.csv`

Bookings plan and forecast can be aggregate Anaplan outputs at BU, period, and metric grain. Revenue, COGS, and OpEx planning data should usually retain planning grain such as GL account, cost center, department, product, BU, period, and version. A BU-only finance plan is enough for control-total variance, but not enough for source-backed driver attribution or drill-downs.

### Phase 2: Introduce Metric-Specific Driver Builders

Replace generic opportunity-style driver logic with metric-specific analyzers:

- `buildBookingsDrivers()` from opportunity snapshots
- `buildRevenueDrivers()` from ERP actuals, planning versions, product/customer mappings, and revenue bridge rules
- `buildOpexDrivers()` from ERP actuals, planning versions, GL hierarchy, cost center, department, and vendor
- `buildCogsDrivers()` from ERP actuals, planning versions, product/service line, cloud/vendor detail, and margin mappings
- `buildOperatingProfitDrivers()` from certified Revenue, COGS, and OpEx driver outputs, deferred until the component bridges are source-backed

Operating Profit should be a roll-up of certified component bridges, not an independently guessed bridge.

Near-term scope should focus on Bookings, Revenue, OpEx, and COGS. Operating Profit can remain a later roll-up once those component bridges are credible.

### Phase 3: Create a Certified Driver Contract

Every driver passed to the UI or LLM should follow a common contract:

```json
{
  "metric": "OpEx",
  "period": "Q1 FY26",
  "comparison": "Actual vs Plan",
  "category": "Contractors",
  "amount": 600000,
  "control_total_amount": 2000000,
  "share_of_variance": 0.3,
  "temporary_or_structural": "Execution",
  "source_system": "ERP",
  "source_rows": [
    {
      "gl_account": "6205 Contractors",
      "department": "Engineering",
      "vendor": "Accenture",
      "amount": 350000
    }
  ],
  "evidence": [
    "Accenture contributed +$350K of contractor variance",
    "Deloitte contributed +$250K of contractor variance"
  ]
}
```

### Phase 4: Add Reconciliation Guardrails

For each metric:

- Compare actuals to the selected baseline.
- Sum driver amounts.
- Calculate residual.
- Display residual if above materiality.
- Prevent the LLM narrative from presenting unreconciled or guessed amounts as fact.

The UI should show whether the bridge is reconciled, partially reconciled, or not reconciled.

### Phase 5: Move the LLM Boundary Later

The LLM input should be a compact certified analysis packet, not raw finance data:

```json
{
  "control_total": {
    "metric": "OpEx",
    "period": "Q1 FY26",
    "comparison": "Actual vs Plan",
    "actual": 27000000,
    "baseline": 25000000,
    "variance": 2000000
  },
  "drivers": [
    { "category": "Engineering Salaries", "amount": 1000000 },
    { "category": "Contractors", "amount": 600000 },
    { "category": "Marketing", "amount": 300000 },
    { "category": "Travel", "amount": 100000 }
  ],
  "drilldowns": {
    "Contractors": [
      { "vendor": "Accenture", "amount": 350000 },
      { "vendor": "Deloitte", "amount": 250000 }
    ]
  }
}
```

## Fit With Current Prototype

The current prototype already has the right UI concepts: bridge focus, comparison basis, KPI cards, driver evidence, taxonomy, drill-downs, and executive summary.

The main gap is the analysis layer. Some drivers are currently allocated from the total variance using fixed percentages or prototype assumptions. That is fine for a demo, but it is the exact part that should be replaced before this becomes a credible FP&A workflow.

Recommended near-term code change:

- Keep the current UI.
- Replace mock/apportioned drivers with source-backed driver builders.
- Add ERP/planning-style sample data for Revenue, OpEx, and COGS.
- Restrict opportunity-level logic to Bookings.
- Make residuals explicit and visible when source-backed drivers do not fully reconcile.

## Verdict

Yes, the proposed change makes sense.

It is the right architecture for a serious FP&A agent because it aligns with how finance data actually works:

- Bookings are sales-system and opportunity-centric.
- Revenue is finance-system and recognition-centric.
- OpEx is ERP/planning-system and cost-center/vendor-centric.
- COGS is ERP/planning-system and product/service/vendor-centric.
- The LLM should explain certified outputs, not invent driver attribution.

The only caveat is scope: this turns the prototype from a generic variance explainer into a source-system-aware finance analysis product. That is a good move, but it should be implemented in phases so the demo remains usable while the data layer becomes more realistic.
