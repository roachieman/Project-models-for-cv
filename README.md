# NZ Aquaculture — Distribution Economics Model

An interactive financial model of New Zealand aquaculture distribution economics, covering King salmon and Greenshell mussels. It traces margin capture from farm gate to consumer and compares export, foodservice, and direct-to-consumer channels. All headline figures are anchored to published 2023–2025 industry data (sources listed in-app).

Built with React + Vite + Recharts.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal (usually http://localhost:5173).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to vercel.com, click "Add New Project", and import the repo.
3. Vercel auto-detects Vite — no configuration needed. Click Deploy.
4. You get a live URL like `nz-aquaculture-model.vercel.app`.

## Deploy to Netlify

1. Push to GitHub.
2. In Netlify, "Add new site" → import the repo.
3. Build command: `npm run build` · Publish directory: `dist`
4. Deploy.

## What the model shows

- **Value-chain margin build-up** — how price accumulates across processing, export, distribution, and retail.
- **Consumer-dollar capture** — what share of the final price each party keeps.
- **Channel economics** — volume, price, margin, and total profit by route to market.
- **Species comparison** — salmon vs mussels blended profit.

The companion Excel workbook (with sourced cell-level citations) contains the full model logic.

## Data sources

- MPI / NZ Aquaculture Development Plan 2025–2030
- Aquaculture New Zealand 2023 Sector Overview
- NZ King Salmon (NZX:NZK) FY25 results
- Selina Wamucii market prices (Nov 2025)

Figures are public point-in-time estimates compiled for a portfolio model. Stage markups and channel mix are reasoned, editable assumptions.
