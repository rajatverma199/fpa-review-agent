# FP&A Review Agent PM Talk Track

Use slide 1 as a simple product flow:

1. Enterprise systems provide the facts: CRM for pipeline/bookings, ERP/GL for actuals, Workday for workforce, revenue systems for recognition, Snowflake as the data hub, and Anaplan for plan/forecast.
2. Finance creates certified snapshots and reference data: SOQ/EOQ snapshots, actuals, plan, forecast, hierarchy mappings, and the governed variance taxonomy.
3. A deterministic variance engine calculates the bridge: it compares actuals to baseline, classifies drivers, ties every explanation to source evidence, and keeps residuals visible.
4. Step 3 outputs a certified analysis packet into the LLM. The LLM agent then explains that packet. `SKILL.md` is the operating manual that tells the LLM how to write the variance narrative, use the taxonomy, avoid unsupported claims, and return structured output.
5. FP&A remains human in the loop: analysts review the evidence, edit the narrative, approve the final output, and feed misses into evals.

Use slide 2 to explain the upstream data architecture:

- Most enterprise data should flow through Snowflake as the governed access layer.
- Source-system tables land in raw/conformed Snowflake tables.
- Data engineers publish finance-ready views for snapshots, actuals, planning baselines, mappings, and taxonomy.
- Direct source queries are exception paths for drill-downs or missing evidence, not the default workflow.
- Snowflake is not the original system of record; it is where source data becomes certified and reusable for FP&A analysis.

Use slide 3 as the continuation from slide 2:

- Slide 2 ends at the variance engine input package; slide 3 starts with that same object.
- The variance engine calculates and reconciles the bridge, then emits a certified packet: control totals, drivers, source evidence, taxonomy, assumptions, confidence, residuals, and open questions.
- The LLM agent uses `SKILL.md` as its operating manual to explain the packet and produce follow-up-ready analysis.
- The prototype UI is currently a Claude Artifact-style HTML/CSS/JS tool; in production, this would become an internal web app or workflow surface.
- Tool outputs branch outward from the UI/tool: FP&A review workspace, PowerPoint export, and eval output.
- Eval output compares the agent result to FP&A ground truth and feeds improvements back into taxonomy, deterministic rules, `SKILL.md`, guardrails, and templates.

The one-line interview framing:

> The LLM is not discovering financial truth. The enterprise finance layer creates certified, reconciling variance facts; the agent turns those facts into an executive-ready explanation with FP&A approval and evals as controls.

For evals, the agent output should be structured JSON plus the written summary. It should be compared against an FP&A ground truth file for math reconciliation, driver classification, evidence quality, and narrative accuracy.
