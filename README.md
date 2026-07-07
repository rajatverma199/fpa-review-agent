# FP&A Review Agent

An agentic FP&A workflow prototype that explains financial variance with source-backed drivers, deterministic reconciliation, and executive-ready narrative.

The project models how an FP&A team could move from static variance reporting to an assisted review workflow: ingest actuals, plan, forecast, opportunity snapshots, and driver detail; calculate the variance bridge in a controlled data layer; classify the drivers; and then use an agent to produce clear summaries, evidence, actions, and follow-up questions for Finance, FP&A, and business leaders.

## Project Purpose

FP&A teams spend a large amount of review time answering the same questions:

- Why did actuals differ from forecast, plan, or prior period?
- Which drivers are temporary versus structural?
- Which accounts, products, regions, vendors, or cost centers caused the movement?
- What should the business do next?
- Can the explanation be tied back to source-system evidence?

This prototype explores an agentic workflow for that review process. The goal is not to let an LLM guess the math. The data layer owns variance calculations, control totals, driver attribution, and reconciliation. The agent layer turns that certified analysis into an executive summary, evidence-backed explanation, and action-oriented review narrative.

## What This Prototype Demonstrates

- Source-backed P&L and bookings review across multiple business views
- Deterministic variance bridge calculations before any narrative is generated
- Driver classification across timing, loss, mix, pricing, volume, cost, and accrual patterns
- Role-aware review modes for Finance editors, Finance viewers, and GM viewers
- Drill-downs from executive summary to driver details and underlying source records
- A practical boundary between finance-system logic and LLM-generated explanation

## Review Modes

- `P&L Review`: revenue, COGS, opex, and margin variance analysis for finance review
- `GM Brief`: bookings and closed ACV review for business leaders
- `FP&A Workspace`: deeper finance drill-downs, evidence, open questions, and actions

## Data Model

The sample data is synthetic and intentionally small. Each file represents a type of system extract that an FP&A workflow would normally rely on.

| File | Purpose |
|---|---|
| `data/financial_results.csv` | Aggregated actual, forecast, plan, and prior-period financial results by period, BU, product, region, segment, and metric. This powers KPI cards and high-level variance comparisons. |
| `data/bookings_soq_snapshot.csv` | Start-of-quarter opportunity snapshot. This represents the pipeline baseline at the beginning of the review period. |
| `data/bookings_eoq_snapshot.csv` | End-of-quarter opportunity snapshot. This is compared with the start-of-quarter snapshot to identify slipped, lost, changed, or newly created deals. |
| `data/crm_opportunities.csv` | CRM opportunity-level detail with forecast and actual outcomes. This supports account, owner, stage, close-date, and outcome evidence for bookings variance. |
| `data/bookings_plan.csv` | Bookings plan by period, business unit, and metric. This represents the planning baseline for closed ACV or bookings targets. |
| `data/bookings_forecast.csv` | Bookings forecast by period, business unit, and metric. This represents the latest forecast baseline used in actual-versus-forecast review. |
| `data/erp_actuals.csv` | ERP actuals by posting date, journal, GL account, cost center, department, vendor, product, BU, and amount. This is the source of truth for actual revenue, COGS, and expense activity. |
| `data/planning_versions.csv` | Planning-system versions such as plan, forecast, and scenario data by GL account, cost center, department, product, BU, period, and amount. This supports actual-versus-plan and actual-versus-forecast bridges. |
| `data/financial_hierarchy_mappings.csv` | Mapping from GL accounts to financial statement lines and driver families. This allows raw ERP and planning rows to roll up into finance-readable categories. |
| `data/pricing_and_usage.csv` | Product and customer-level pricing, discount, usage, unit, and migration detail. This supports pricing, volume, discounting, and usage variance attribution. |
| `data/revenue_driver_detail.csv` | Certified revenue driver rows with source table, source record, actual value, baseline value, amount, category, and variance basis. This is an example of the structured driver layer an agent should narrate from. |
| `data/expense_detail.csv` | Expense driver detail by BU, cost center, category, vendor, owner, forecast spend, actual spend, invoice date, accrual flag, and variance basis. This supports opex and spend control review. |
| `data/variance_driver_taxonomy.csv` | Driver taxonomy used to classify variance into explainable categories such as timing, miss, mix, pricing, volume, and cost. |

## Agent Workflow

1. Select a review context such as BU, period, metric, comparison basis, and user role.
2. Load certified source data from CRM, ERP, planning, and driver-detail extracts.
3. Calculate the actual-versus-baseline variance deterministically.
4. Attribute the variance to driver categories and source records.
5. Reconcile the driver bridge back to the financial control total.
6. Generate a concise executive summary and evidence-backed driver explanation.
7. Surface actions, open questions, and drill-downs for follow-up review.

## Repository Contents

| Path | Description |
|---|---|
| `index.html` | Static application shell for the FP&A review interface. |
| `styles.css` | Interface styling for sidebar controls, KPI cards, bridge charts, evidence panels, and review modes. |
| `src/app.js` | Client-side workflow logic, CSV loading, metric selection, driver building, summaries, and UI rendering. |
| `data/` | Synthetic finance, planning, CRM, pricing, and driver-detail datasets. |
| `accounting_flux_agent.md` | Prompt and operating contract for the finance variance explanation agent. |
| `fpa_agent_architecture_improvements.md` | Architecture notes on separating deterministic finance logic from LLM narration. |
| `interview_architecture_diagram.md` | Architecture walkthrough and diagram notes. |
| `fpa-agent-enterprise-flow-talk-track.md` | Talk track for presenting the enterprise workflow. |
| `fpa-agent-enterprise-flow.pptx` | Supporting presentation artifact. |
| `accounting_flux_agent_brief.docx` | Supporting written brief. |

## Run Locally

Because the app loads CSV files with `fetch`, serve the folder over a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Why This Matters

The core design principle is that FP&A agents should not invent financial truth. They should narrate and interact with a certified analysis layer.

That makes the workflow more credible for finance teams because the explanation can be tied back to known source systems, reconciled bridge amounts, and explicit driver categories. The agent becomes a review accelerator, not a black-box replacement for finance controls.
