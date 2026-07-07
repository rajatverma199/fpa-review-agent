# FP&A Review Agent

An interactive FP&A review prototype for explaining P&L and bookings variance with source-backed drivers, executive summaries, and role-aware review modes.

## What is included

- Static web app in `index.html`, `styles.css`, and `src/app.js`
- Sample CSV datasets in `data/`
- Finance agent prompt and architecture notes
- Supporting presentation and brief artifacts

## Run locally

Because the app loads local CSV files with `fetch`, serve the folder over a local web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Review modes

- `P&L Review`: revenue, COGS, opex, and margin variance analysis
- `GM Brief`: bookings and closed ACV review for business leaders
- `FP&A Workspace`: finance-oriented drill-downs, evidence, and open actions
