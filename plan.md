# Planetary — Climate Decision Engine
## Global Hackathon Build Plan

> Stop trusting marketing claims. Start trusting physics.

---

## Problem

$500B+ flows into climate investments annually.
**40–90% of carbon credits overstate their real-world impact.**
Investors, corporations, and governments are funding greenwashing — not climate solutions.

There is no tool that simulates what a climate intervention *actually* does to the physical world before you commit capital.

---

## Solution

**Planetary** is a Climate Decision Engine that:

1. **Simulates** physical world effects using NVIDIA Cosmos + NIM (FourCastNet, climate physics)
2. **Verifies** every project claim against real emissions data via Cala API
3. **Optimizes** intervention placement using NVIDIA cuOpt (maximum impact per dollar)
4. **Scores** every project with the **Planetary Impact Score™** (0–100, 6 dimensions)

---

## NVIDIA Stack

| Model | Role | Endpoint |
|---|---|---|
| **NVIDIA NIM** (meta/llama-3.3-70b) | Climate inference, 10-year projections | `integrate.api.nvidia.com/v1` |
| **NVIDIA Cosmos** | Physical world state simulation (ecosystem snapshots at years 0/1/5/10) | NIM / NVCF |
| **NVIDIA cuOpt** | Spatial placement optimization (maximize CO₂ per $) | NVCF |

**Cala API** provides real project baselines, claimed impacts, and evidence sourcing.

---

## Planetary Impact Score™ (0–100)

| Dimension | Weight | What it measures |
|---|---|---|
| Carbon Effectiveness | 30 | Simulated CO₂ vs. benchmark for type |
| Additionality | 20 | Would it happen without this investment? |
| Permanence | 20 | Will it last 10+ years? |
| Biodiversity | 15 | Ecosystem health co-benefits |
| Community Benefit | 10 | Local livelihood impact |
| Verification Quality | 5 | Standard + monitoring rigour |

**Tiers:** 🔵 Platinum (90+) · 🟡 Gold (75+) · ⚪ Silver (60+) · 🟤 Bronze (45+) · 🟠 Caution (30+) · 🔴 Flagged (0–29)

---

## Killer Feature: Greenwashing Detector

```
Kariba REDD+ Project (Zimbabwe)
  Claimed:    4,900,000 tCO₂/year
  Simulated:  1,100,000 tCO₂/year
  Accuracy:   22%
  ⚠️ GREENWASHING RISK: SEVERE — Project claims 4.5× its simulated impact
```

Side-by-side comparison with sourced evidence from Cala.

---

## Product Architecture

```
Stack:
  Frontend   →  Next.js 15 + React 19 + TypeScript
  Styling    →  Tailwind CSS + shadcn/ui (dark space theme)
  State      →  Zustand 5
  Charts     →  Recharts
  Animation  →  Framer Motion
  Auth       →  None (hackathon scope)

Backend (Next.js API Routes):
  POST /api/simulate    → Start simulation pipeline
  GET  /api/simulate/[id] → Poll simulation status
  POST /api/optimize    → cuOpt placement optimization
  GET  /api/projects    → Cala-sourced real project examples

Simulation Pipeline:
  1. Fetch baseline data     ← Cala API
  2. Run NIM analysis        ← NVIDIA NIM (climate physics)
  3. Run Cosmos simulation   ← NVIDIA Cosmos (world states y0/1/5/10)
  4. Run cuOpt optimization  ← NVIDIA cuOpt (zone placement)
  5. Compute Impact Score    ← Planetary scoring engine
  6. Verify claims           ← Cala + NIM cross-reference
```

---

## File Structure

```
planetary/
├── src/
│   ├── app/
│   │   ├── page.tsx                        ← Landing + Intervention Form
│   │   ├── simulate/[id]/page.tsx          ← Simulation Dashboard
│   │   ├── portfolio/page.tsx              ← Multi-project portfolio
│   │   └── api/
│   │       ├── simulate/route.ts           ← Simulation orchestration
│   │       ├── simulate/[id]/route.ts      ← Status polling
│   │       ├── optimize/route.ts           ← cuOpt
│   │       └── projects/route.ts           ← Cala project search
│   ├── lib/
│   │   ├── nvidia/
│   │   │   ├── client.ts                   ← Base NVIDIA API client
│   │   │   ├── nim.ts                      ← NIM climate inference
│   │   │   ├── cosmos.ts                   ← Cosmos world simulation
│   │   │   └── cuopt.ts                    ← cuOpt optimization
│   │   ├── cala/
│   │   │   ├── client.ts                   ← Cala API client
│   │   │   └── climate.ts                  ← Climate project queries
│   │   └── planetary/
│   │       ├── types.ts                    ← All TypeScript types
│   │       ├── scoring.ts                  ← Impact Score algorithm
│   │       ├── simulator.ts                ← Full pipeline orchestration
│   │       ├── demos.ts                    ← 3 pre-computed demos
│   │       └── store.ts                    ← Zustand state
│   └── components/
│       ├── planetary/
│       │   ├── InterventionForm.tsx         ← Input form (3 tabs)
│       │   ├── SimulationStages.tsx         ← Pipeline progress bar
│       │   ├── ImpactScore.tsx              ← Radial score display
│       │   ├── TimelineChart.tsx            ← 10-year CO₂ chart
│       │   ├── ClaimVerifier.tsx            ← Claimed vs. simulated
│       │   ├── RiskMatrix.tsx               ← Risk factor grid
│       │   ├── MetricsGrid.tsx              ← Key KPIs
│       │   ├── WorldMap.tsx                 ← Intervention map
│       │   ├── CosmosSnapshots.tsx          ← Year 0/1/5/10 descriptions
│       │   └── NvidiaInsights.tsx           ← Model attribution
│       ├── layout/
│       │   └── Header.tsx
│       └── ui/                             ← shadcn/ui components
└── ...config files
```

---

## Demo Scenarios (pre-loaded, work without API keys)

| Project | Type | Claimed | Simulated | Score | Verdict |
|---|---|---|---|---|---|
| Congo Basin Reforestation | Reforestation | 2.0M tCO₂/yr | 1.4M tCO₂/yr | 72 🟡 Gold | Modest overclaim |
| Sahara Solar Array 500MW | Solar Farm | 800K tCO₂/yr | 714K tCO₂/yr | 85 🟡 Gold | Accurate |
| Kariba REDD+ Credits | Carbon Credits | 4.9M tCO₂/yr | 1.1M tCO₂/yr | 32 🔴 Flagged | ⚠️ Greenwashing |

---

## Why Planetary Wins

1. **Defensible numbers** — every claim traceable to NVIDIA model + Cala source
2. **Physical simulation** — not just a calculator, a world model (Cosmos)
3. **Optimization** — cuOpt tells you *where* to invest for max impact
4. **Greenwashing detection** — the killer feature no other tool has
5. **Beautiful UI** — dark space theme, real-time animation, stunning charts
6. **Full-stack** — working API, real NVIDIA integrations, Cala data sourcing

---

---

## Top 5 Features to Win

### 1. Live NIM Token Streaming — "Watch the Physics Think"
Stream NVIDIA NIM reasoning token-by-token to the UI. Judges watch the model cite IPCC AR6 coefficients and reason about drought risk in real time. Turns the black box into a credible, transparent process — no other climate tool shows its reasoning.

**Build:** `stream: true` on NIM API + `ReadableStream` from Next.js route. Render tokens into a "reasoning panel" with typewriter animation.

### 2. Cosmos World View — Ecosystem Snapshots at Year 0 / 1 / 5 / 10 ✅
Call Cosmos's text-to-world API to generate physical world state descriptions and (when available) video of the ecosystem at each time step. Show before/after transformation as a simulation timeline, not just a chart.

**Build:** `CosmosWorldView` component consuming `cosmos_world.year_snapshots`. Shows ecosystem state, physical parameters (CO₂ ppm, temperature delta, albedo), and descriptions formatted as scientific report frames.

### 3. Portfolio Optimizer — "I Have $100M, Maximize CO₂" ✅
Given a budget, cuOpt finds the optimal combination of intervention types, locations, and scales to maximize 10-year CO₂ per dollar. Outputs specific allocation percentages with projected impact.

**Build:** `/optimize` page + `POST /api/optimize/portfolio`. Greedy + NIM-refined allocation across intervention types. Shows allocation chart, per-intervention breakdown, total CO₂, vs. single-type comparison.

### 4. Greenwashing Scanner — Score Any Registry Project in 10 Seconds
Search bar on landing that accepts a Verra Registry ID or project name, fetches via Cala `/v1/entities`, auto-fills the intervention form, and runs the full simulation pipeline. Makes the product immediately useful to anyone in the room.

### 5. The Deception Index — Live Leaderboard of Carbon Overclaiming
A standalone public dashboard ranking carbon credit projects by gap between marketing claims and Planetary-simulated impact. Names names. Gets written about. Demonstrates societal impact to judges.

---

## MVP Checklist

- [x] Package configuration + TypeScript
- [x] NVIDIA NIM client (climate inference)
- [x] NVIDIA Cosmos client (world simulation)
- [x] NVIDIA cuOpt client (placement optimization)
- [x] Cala API client (baseline data)
- [x] Planetary Impact Score engine
- [x] Simulation orchestration pipeline
- [x] Demo data (3 pre-computed scenarios)
- [ ] API routes (simulate, optimize, projects)
- [ ] Landing page + InterventionForm
- [ ] Simulation Dashboard
- [ ] All UI components
- [ ] Deployment config
