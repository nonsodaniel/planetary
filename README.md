# Planetary — Climate Decision Engine

> Stop trusting marketing claims. Start trusting physics.

Planetary is a full-stack climate verification platform that uses NVIDIA AI models and the Cala Knowledge API to simulate the real-world impact of climate interventions, score carbon projects on a transparent 0–100 scale, and automatically detect greenwashing in carbon credits.

**40–90% of carbon credits overstate their real-world impact.** Planetary gives investors a physics-based alternative to marketing claims.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Core Concepts](#core-concepts)
  - [Planetary Impact Score™](#planetary-impact-score)
  - [Greenwashing Detection](#greenwashing-detection)
  - [Simulation Pipeline](#simulation-pipeline)
  - [Risk Assessment](#risk-assessment)
- [NVIDIA Integration](#nvidia-integration)
- [Demo Projects](#demo-projects)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Component Architecture](#component-architecture)

---

## Overview

Planetary solves a critical problem in climate finance: investors have no reliable way to verify whether a carbon credit or climate project actually delivers the impact it claims. Traditional third-party certifications (Verra, Gold Standard) are slow, expensive, and still subject to manipulation.

Planetary replaces certification theater with a simulation-first approach:

1. **Fetch** real project data from the Cala Knowledge API or public registries
2. **Simulate** the physical climate impact using NVIDIA NIM (Llama 3.3-70B) and the Cosmos World Foundation Model
3. **Optimize** spatial placement of interventions with NVIDIA cuOpt
4. **Score** the project on six weighted dimensions to produce a single Planetary Impact Score™
5. **Verify** the project's own claims against the simulated output and flag overclaiming

The result is a verified, physics-grounded investment signal — not a marketing number.

---

## Features

### Interactive 3D Globe
An interactive React globe displaying 8 real-world demo projects across the planet. Users can rotate, zoom, and click project pins to explore pre-computed simulation results. Each pin opens a hover card with the project name, type, country, and impact score. Auto-rotation resumes after user interaction ends.

### Planetary Impact Score™
A 0–100 composite score that breaks down across six dimensions: carbon effectiveness, additionality, permanence, biodiversity impact, community benefit, and verification quality. Each score is backed by NVIDIA NIM projections and displayed as a radial gauge with animated fill on page load.

### Greenwashing Scanner
Paste any Verra registry project ID into the scanner tab. Planetary fetches the project's claimed emissions reductions via Cala, runs a physics-based simulation, and computes an accuracy ratio between the claimed and simulated CO₂ outputs. Projects with accuracy ratios below 55% receive a "High Risk" or "Severe" greenwashing flag.

**Example:** The Kariba REDD+ project (Zimbabwe) claims 4.9 million tCO₂/year. Planetary simulates 1.1 million — a 4.5× overclaim flagged as Severe greenwashing.

### Full Simulation Dashboard
Each simulation produces a rich results dashboard including:
- Animated radial gauge for the impact score
- 6-dimension radar breakdown
- 10-year CO₂ projection timeline chart
- Side-by-side claim verification panel
- Risk matrix across 7 risk categories
- Ecosystem state snapshots at years 0, 1, 5, and 10 (from Cosmos)
- Comparable projects benchmark table
- NVIDIA model attribution panel

### Portfolio Optimizer
Given a total budget, the optimizer uses NVIDIA cuOpt to find the allocation of climate interventions that maximizes total CO₂ sequestration per dollar. Users set a budget (presets from $10M to $1B), configure max allocation slots, and optionally exclude specific intervention types. Results show each allocation with its verified impact score, projected CO₂, and NIM-generated reasoning.

### Space-Themed Dark UI
Full dark mode with deep navy/zinc backgrounds, glowing accent elements, animated starfield, nebula layers, and planetary body decorations. All major state transitions use Framer Motion animations. Loading states, error boundaries, and skeleton loaders are implemented throughout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| Components | Radix UI (11 primitives) |
| Animation | Framer Motion 11 |
| State | Zustand 5 |
| Charts | Recharts 2.13 |
| 3D Globe | react-globe.gl 2.38 |
| World Map | react-simple-maps 5.0 + topojson-client |
| Validation | Zod |
| Testing | Jest + React Testing Library |
| AI Inference | NVIDIA NIM (Llama 3.3-70B) |
| Physical Sim | NVIDIA Cosmos World Foundation Model |
| Optimization | NVIDIA cuOpt |
| Data | Cala Knowledge API |

---

## Project Structure

```
planetary/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout (fonts, metadata)
│   │   ├── globe/
│   │   │   ├── page.tsx                # Interactive 3D globe explorer
│   │   │   └── loading.tsx             # Globe loading skeleton
│   │   ├── simulate/
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Simulation results dashboard
│   │   │       └── loading.tsx         # Simulation loading state
│   │   ├── optimize/
│   │   │   ├── page.tsx                # Portfolio optimizer
│   │   │   └── loading.tsx             # Optimizer loading state
│   │   ├── portfolio/
│   │   │   ├── page.tsx                # Multi-project portfolio view
│   │   │   └── loading.tsx             # Portfolio loading state
│   │   └── api/
│   │       ├── simulate/
│   │       │   ├── route.ts            # POST — start simulation
│   │       │   └── [id]/route.ts       # GET — poll simulation status
│   │       ├── optimize/
│   │       │   └── portfolio/route.ts  # POST — run cuOpt optimization
│   │       ├── projects/route.ts       # GET — Cala project list
│   │       └── scan/route.ts           # POST — greenwashing scanner
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx              # Site navigation
│   │   ├── planetary/
│   │   │   ├── GlobeHero.tsx           # Landing page 3D globe
│   │   │   ├── GlobeHeroOverlay.tsx    # Overlay UI on landing globe
│   │   │   ├── WorldMapSection.tsx     # SVG world map with project pins
│   │   │   ├── SpaceBackground.tsx     # Starfield + nebula animation layer
│   │   │   ├── ImpactScore.tsx         # Radial gauge + 6D breakdown
│   │   │   ├── SimulationStages.tsx    # Pipeline progress indicator
│   │   │   ├── TimelineChart.tsx       # 10-year CO₂ projection chart
│   │   │   ├── ClaimVerifier.tsx       # Claimed vs simulated comparison
│   │   │   ├── RiskMatrix.tsx          # Risk factor grid
│   │   │   ├── MetricsGrid.tsx         # KPI summary cards
│   │   │   ├── CosmosWorldView.tsx     # Year 0/1/5/10 snapshots
│   │   │   ├── NvidiaInsights.tsx      # Model attribution panel
│   │   │   └── InterventionForm.tsx    # 3-tab input form
│   │   └── ui/                         # shadcn/ui primitives
│   ├── lib/
│   │   ├── planetary/
│   │   │   ├── types.ts                # Core data types
│   │   │   ├── demoProjects.ts         # 8 pre-computed demo projects
│   │   │   ├── scoring.ts              # Impact Score algorithm
│   │   │   ├── countryLabels.ts        # Globe country label data
│   │   │   └── useCountries.ts         # Country data hook
│   │   └── store.ts                    # Zustand state store
│   └── __tests__/
│       ├── demoProjects.test.ts        # Demo data validation
│       ├── scoring.test.ts             # Impact Score algorithm tests
│       └── utils.test.ts               # Utility function tests
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
└── jest.setup.ts
```

---

## Pages & Routes

### `/` — Landing Page
The entry point. Contains the animated 3D hero globe, the problem/solution narrative, a 3-step explainer section, 8 demo project cards, and the main InterventionForm. The form has three tabs: a Greenwashing Scanner (Verra ID input), a manual intervention entry form, and a portfolio multi-project input.

### `/globe` — Project Explorer
A full-screen interactive 3D globe showing all 8 demo projects as colored pins. Hovering a pin shows a floating card with the project name, type, country, impact score badge, and a quick summary. Clicking navigates to the simulation dashboard for that project. The globe auto-rotates when idle and responds to mouse drag, scroll zoom, and touch gestures.

### `/simulate/[id]` — Simulation Dashboard
The core output view. Shows the full simulation result for a given project ID. If the ID matches a demo project, pre-computed data is displayed immediately. For live simulations, the page polls the API every 2 seconds and shows a stage-by-stage progress indicator while the pipeline runs. Once complete, all panels animate in with staggered Framer Motion transitions.

### `/optimize` — Portfolio Optimizer
A tool for allocating a climate investment budget across multiple intervention types to maximize total CO₂ impact. Users configure budget, max number of allocations, and type exclusions. The optimizer calls the cuOpt API endpoint and returns a ranked allocation table with per-slot scores and NIM-generated reasoning.

### `/portfolio` — Multi-Project Portfolio *(planned)*
An aggregated view of multiple tracked projects with combined impact metrics.

---

## Core Concepts

### Planetary Impact Score™

The Impact Score is a 0–100 composite metric computed across six weighted dimensions:

| Dimension | Weight | What It Measures |
|---|---|---|
| Carbon Effectiveness | 30% | Simulated CO₂ output vs. benchmark for the intervention type |
| Additionality | 20% | Would this impact occur without the investment? |
| Permanence | 20% | Will the carbon stay sequestered for 10+ years? (risk-adjusted) |
| Biodiversity | 15% | Ecosystem health co-benefits |
| Community Benefit | 10% | Local livelihood and social impact |
| Verification Quality | 5% | Rigor of certification (Gold Standard > Verra > uncertified) |

**Score Tiers:**

| Range | Tier | Meaning |
|---|---|---|
| 90–100 | Platinum | Exceptional, fully verified |
| 75–89 | Gold | Credible, minor uncertainties |
| 60–74 | Silver | Mixed evidence, investable with caution |
| 45–59 | Bronze | Risky, significant uncertainties |
| 30–44 | Caution | Significant overclaiming detected |
| 0–29 | Flagged | Severe greenwashing, do not invest |

---

### Greenwashing Detection

For every simulation, Planetary computes an **accuracy ratio**:

```
accuracy_ratio = simulated_annual_co2 / claimed_annual_co2
```

| Ratio | Risk Level |
|---|---|
| ≥ 0.90 | None |
| 0.75–0.89 | Low |
| 0.55–0.74 | Moderate |
| 0.35–0.54 | High |
| < 0.35 | Severe |

The claim verification panel shows the gap between claimed and simulated values, the confidence interval on the simulated number, and a plain-language summary of the evidence.

---

### Simulation Pipeline

Simulations execute through six sequential stages, each visible in the progress UI:

1. **Fetch Baseline** — Pull project data, claimed emissions, and historical context from the Cala Knowledge API
2. **Run NIM Analysis** — NVIDIA Llama 3.3-70B generates 10-year annual CO₂ projections using IPCC coefficients and local climate data
3. **Run Cosmos Simulation** — The Cosmos World Foundation Model produces physical ecosystem state snapshots at years 0, 1, 5, and 10 with atmospheric parameters (CO₂ ppm, temperature delta, albedo change)
4. **Run cuOpt Optimization** — Solves a spatial placement problem: which zones maximize CO₂ per dollar for this intervention type?
5. **Compute Impact Score** — The scoring algorithm weighs the six dimensions and produces the 0–100 composite
6. **Verify Claims** — Compares the project's own stated impact numbers against the simulated output and generates an evidence-backed verification summary

The client polls `/api/simulate/[id]` every 2 seconds until the pipeline completes, displaying live stage transitions throughout.

---

### Risk Assessment

Each simulation auto-generates a risk matrix across seven categories:

| Category | Example Risk Factors |
|---|---|
| Physical | Wildfire, drought, sea level rise |
| Policy | Grid curtailment, government instability, land tenure |
| Social | Community conflict, land rights disputes |
| Financial | Operating cost overruns, currency risk |
| Permanence | Carbon reversal, leakage, buffer pool depletion |
| Methodology | Inflated baselines, verification gaps, double-counting |
| Technology | Equipment failure, grid interconnection delays |

Each risk has a severity level (Low / Medium / High / Critical) and a probability estimate.

---

## NVIDIA Integration

### NIM — Llama 3.3-70B
Used for climate physics inference. For each intervention, NIM generates:
- Annual CO₂ sequestration or avoidance projections for years 1–10
- Key drivers of impact and uncertainty (citing IPCC AR6 coefficients)
- A list of comparable real-world projects with their verified outcomes
- Portfolio diversification reasoning in the optimizer

### Cosmos World Foundation Model
Used to generate physical ecosystem snapshots. For each year milestone (0, 1, 5, 10), Cosmos outputs:
- A narrative description of the ecosystem state
- Quantitative parameters: atmospheric CO₂ change (ppm), temperature delta (°C), albedo change, precipitation anomaly
- A fidelity rating (Low / Medium / High) indicating simulation confidence

### cuOpt
Solves the spatial placement optimization problem: given the intervention type, budget, and geographic region, which zones should be targeted to maximize total CO₂ impact? Each cuOpt zone result includes:
- Zone identifier and coordinates
- Projected CO₂ impact
- Impact multiplier vs. unoptimized baseline
- Brief rationale for the placement recommendation

### Cala Knowledge API
Provides real project baseline data sourced from public climate registries including:
- Official claimed emission reductions from Verra/Gold Standard filings
- Historical project performance data
- Evidence snippets with source URLs for claim verification

---

## Demo Projects

Eight real-world projects are pre-computed and available without any API keys:

| Project | Country | Type | Score | Status |
|---|---|---|---|---|
| Congo Basin Reforestation | DR Congo | Reforestation | 72 | Moderate overclaim |
| Saharan Solar Array | Tunisia | Solar Farm | 85 | Claim accurate |
| Kariba REDD+ Credits | Zimbabwe | Carbon Credits | 32 | Severe greenwashing (4.5× overclaim) |
| Amazon Buffer Zones | Brazil | Reforestation | 78 | Mostly accurate |
| Rajasthan Solar Corridor | India | Solar Farm | 69 | Minor overclaim |
| Sundarbans Mangroves | Bangladesh | Mangrove Restoration | 74 | Minor overclaim |
| Dogger Bank Wind Farm | UK | Wind Farm | 91 | Claim accurate |
| Häme Peatland Restoration | Finland | Peatland Restoration | 81 | Claim accurate |

The Kariba REDD+ project is the canonical greenwashing demo: it claims 4.9M tCO₂/year but the Cosmos simulation estimates 1.1M tCO₂/year (22% accuracy ratio, Severe risk).

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

```bash
git clone https://github.com/your-org/planetary.git
cd planetary
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The 8 demo projects work without API keys.

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# NVIDIA API
NVIDIA_API_KEY=your_nvidia_api_key

# Cala Knowledge API
CALA_API_KEY=clsk_0TuWbY6TDqIFteDbCDHTg8Co6cWlxuVfoOxi3NJfW9A
CALA_API_URL=https://api.cala.ai

# Optional: override NIM model
NIM_MODEL=meta/llama-3.3-70b-instruct
```

Without these keys, the application runs in demo mode and all 8 pre-computed projects are fully accessible.

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

The test suite covers:
- `demoProjects.test.ts` — Validates that all 8 demo project objects match the expected schema
- `scoring.test.ts` — Unit tests for the Impact Score algorithm across all six dimensions
- `utils.test.ts` — Tests for formatting utilities (CO₂ units, currency formatting, date helpers)

---

## API Reference

### `POST /api/simulate`
Start a new simulation for a climate intervention.

**Request body:**
```json
{
  "type": "reforestation",
  "name": "Amazon Buffer Zones",
  "region": "South America",
  "country": "Brazil",
  "coordinates": { "lat": -3.47, "lng": -62.21 },
  "area_hectares": 450000,
  "investment_usd_m": 85,
  "claimed_co2_annual": 2800000,
  "claimed_co2_lifetime": 28000000,
  "timeline_years": 10,
  "certifications": ["Verra", "CCBA"]
}
```

**Response:**
```json
{ "id": "sim_abc123", "status": "pending" }
```

---

### `GET /api/simulate/[id]`
Poll the status of a running simulation.

**Response (in progress):**
```json
{
  "id": "sim_abc123",
  "status": "running",
  "current_stage": "cosmos",
  "stages_log": [...]
}
```

**Response (complete):**
```json
{
  "id": "sim_abc123",
  "status": "complete",
  "result": { ... }
}
```

---

### `POST /api/scan`
Greenwashing scanner — fetch and simulate a Verra registry project by ID.

**Request body:**
```json
{ "verra_id": "VCS-902" }
```

**Response:** Same shape as a completed simulation result.

---

### `POST /api/optimize/portfolio`
Run the cuOpt portfolio optimizer.

**Request body:**
```json
{
  "budget_usd_m": 100,
  "max_allocations": 5,
  "exclude_types": ["carbon_credits"]
}
```

**Response:**
```json
{
  "allocations": [
    {
      "type": "reforestation",
      "region": "Southeast Asia",
      "budget_usd_m": 35,
      "projected_co2_annual": 1200000,
      "score": 78,
      "reasoning": "..."
    }
  ],
  "total_co2_annual": 4100000,
  "cost_per_ton": 24.39
}
```

---

### `GET /api/projects`
Return the list of available demo/Cala projects.

---

## Component Architecture

### `InterventionForm`
Three-tab form component that handles all user input paths:
- **Tab 1 (Scanner):** Single text input for Verra ID, submits to `/api/scan`
- **Tab 2 (Manual):** Full form with intervention type selector, coordinates, area, budget, claimed CO₂, timeline, and certifications
- **Tab 3 (Portfolio):** Multi-row input for batch optimization, submits to `/api/optimize/portfolio`

### `ImpactScore`
Renders the radial SVG gauge with animated stroke-dashoffset fill. Accepts the `score_breakdown` object and renders each dimension as a labeled row with a colored progress bar. Score tier badge (Platinum/Gold/etc.) and color coding update based on the numeric score.

### `TimelineChart`
Recharts `ComposedChart` with area fills for cumulative CO₂ sequestered/avoided and a line for ecosystem health index. Tooltips show values for a hovered year. Responsive container wraps for mobile.

### `ClaimVerifier`
Side-by-side comparison of claimed annual CO₂ vs. simulated CO₂. Shows the accuracy ratio as a percentage, a colored risk badge, and a bulleted list of evidence from the Cala/NIM output.

### `CosmosWorldView`
Tabbed panel with one tab per year milestone (0, 1, 5, 10). Each tab shows the Cosmos narrative description, a mini parameter grid (CO₂ ppm change, temperature delta, albedo), and the fidelity badge.

### `RiskMatrix`
Grid layout of risk cards, one per risk factor. Each card shows the category icon, risk name, severity badge (color-coded), probability estimate, and a one-line description.

### `SpaceBackground`
Fixed-position canvas layer rendered client-only. Draws animated star particles, two nebula gradient blobs, and three decorative planetary bodies using `requestAnimationFrame`. Suppresses React hydration warnings from browser extensions.

---

## License

MIT

---

*Built with NVIDIA NIM, Cosmos, and cuOpt. Data sourced from Cala Knowledge API and public climate registries.*
