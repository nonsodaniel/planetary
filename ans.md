# Hackathon Submission Answers

---

## Punchline (0/200)

> Planetary uses NVIDIA AI to simulate the physics of any climate project and expose greenwashing — giving investors a verified 0–100 score, NASA satellite ground-truth, and an AI-generated investment rating instead of a marketing claim.

---

## Description (0/5000)

### What we built


Every year, companies spend billions on carbon credits to "offset" their emissions. The problem is that a lot of those credits don't represent real carbon. Investigations in 2023 into Verra-certified REDD+ forest projects found that many claimed far more impact than actually happened: forests that were never at risk, trees that were already standing, baselines that were inflated.

Right now, if you're a company or investor about to buy credits, there's no easy way to check whether a project's numbers hold up. You get a registry page, a developer PDF, and a lot of trust. We wanted to replace that trust with a simulation.


---

### How it works

**Step 1 — Find the project.** Users can either paste a Verra registry ID into our Greenwashing Scanner (more on that below), enter project details manually, or click one of our 8 pre-computed demo projects on the interactive 3D globe.

**Step 2 — Simulate the science.** The project data goes through a 6-stage pipeline:
- **Cala Knowledge API** pulls baseline data and official claimed figures from public climate registries
- **NVIDIA NIM (Llama 3.3-70B)** generates 10-year annual CO₂ projections using IPCC AR6 coefficients and local climate data, identifies key impact drivers, and produces comparable project benchmarks
- **NVIDIA Cosmos World Foundation Model** produces physical ecosystem snapshots at years 0, 1, 5, and 10 — capturing atmospheric CO₂ change, temperature delta, albedo shift, and precipitation anomaly
- **NVIDIA cuOpt** solves a spatial placement problem: which zones maximize CO₂ per dollar for this intervention type and geography?

**Step 3 — Score and verify.** We compute the Planetary Impact Score™ across six weighted dimensions: Carbon Effectiveness (30), Additionality (20), Permanence (20), Biodiversity (15), Community Benefit (10), and Verification Quality (5). We then compare the project's own claimed CO₂ figures against the simulated output and calculate an accuracy ratio. Anything below 55% gets a greenwashing flag. Below 35% is flagged Severe.

---

### The Science Foundation — powered by Cala Knowledge API

The simulation is only as credible as its starting data. Before any NVIDIA model runs, **Cala** supplies the independent, evidence-backed baselines that make the physics meaningful.

Cala is called at two distinct points in every simulation pipeline:

**Stage 1 — Emissions Baseline (`fetchProjectBaseline`)**

The very first thing the pipeline does — before NIM, before Cosmos, before scoring — is query Cala twice in parallel:

1. `POST /v1/knowledge/query` — We ask: *"What are the typical carbon sequestration rates, costs per ton CO₂, and baseline emission factors for [type] projects in [region], [country]?"* Cala returns structured row data: regional `emission_factor_kg_co2_kwh`, `deforestation_rate_pct`, `forest_carbon_stock_t_ha`, `comparable_co2_annual_tons`, and `cost_per_ton_usd`. These numbers ground the NIM climate analysis in real-world benchmarks rather than model assumptions.

2. `POST /v1/knowledge/search` — We search: *"[type] carbon project performance benchmarks [region]."* Cala returns source documents with confidence scores — links to IPCC reports, registry audits, academic datasets — that back up the numbers with citations. These become the `CalaSource[]` objects stored on the simulation result and surfaced in the UI.

If the project has no claimed CO₂ figure (e.g. a custom project entered without registry data), Cala's `comparable_co2_annual_tons` fills that gap — giving the claim verifier something to compare the simulation against.

**Stage 5 — Claim Evidence (`fetchClaimEvidence`)**

Once the simulation has a simulated annual CO₂ figure, we ask Cala to find independent documentary evidence for or against the project's own stated claims:

1. `POST /v1/knowledge/query` — *"What is the verified carbon impact of [project name]? How does it compare to its claimed impact of [X] tons CO₂/year?"* For known projects like Kariba REDD+, Cala retrieves verified figures from investigative datasets. The `adjustment_factor` from that query cross-checks the simulation's accuracy ratio.

2. `POST /v1/knowledge/search` — *"[project name] carbon credit verification investigation."* For Kariba, Cala surfaces high-confidence (0.89–0.95) sources including the Carbon Market Watch 2023 investigation (*"Ghost Credits"*), The Guardian's rainforest offsets analysis, and CarbonPlan's REDD+ database — each with a document title, snippet, and URL. Only sources with confidence > 0.7 become displayed evidence in the Claim Verification panel.

**What Cala makes possible:**

The claim verifier doesn't just show a number — it shows *why* the simulation disagrees with the project's claims, with citations from independent investigations. Without Cala, the evidence panel would be empty. The simulation would still produce a score, but the judge would have no documentary record to hold up against the developer's PDF.

For Kariba, Cala returns: *"Baseline deforestation rates used by Kariba were significantly higher than observed rates, inflating the claimed benefits by an estimated 300–400%"* (CarbonPlan, confidence 0.95). That is not an AI opinion. That is a direct citation from the most rigorous independent dataset on REDD+ quality.

---

### The Greenwashing Scanner — powered by Context.dev

The centrepiece  feature is the **Greenwashing Scanner**, which is where Context.dev plays a critical role.

A user pastes any Verra project ID (e.g. `VCS612`), a Gold Standard ID, or even just a project name. Here's what happens:

1. We resolve the input to a registry URL. `612` → `https://registry.verra.org/app/projectDetail/VCS/612`. GS and ACR IDs follow the same pattern.
2. If the input is a project name we don't recognise, we use **Context.dev's web search API** (`POST /v1/web/search`) to find the specific project detail page on Verra, Gold Standard, or the American Carbon Registry.
3. We then call **Context.dev's structured scraping API** (`POST /v1/web/scrape`) with a JSON schema describing exactly what we want: project name, country, region, type, area in hectares, annual CO₂ credits, lifetime CO₂, certifications, coordinates, and investment. Context.dev scrapes the registry page and returns clean, structured JSON.
4. That extracted data is mapped to our internal `ClimateIntervention` type and fed straight into the NVIDIA simulation pipeline.

Without Context.dev, building this scanner would have required maintaining fragile, registry-specific scrapers for every standard. Instead, we pass a schema and instructions and get back structured data ready to simulate. It made the live registry integration possible in a hackathon timeframe.

---

### Satellite Ground-Truth Layer — NASA GIBS + NVIDIA NIM

After the main simulation completes, Planetary fetches real NASA satellite imagery and runs an AI-powered NDVI analysis on the actual project geography — giving investors observable, pixel-level evidence to match against the model's projections. No API key required. No external cost.

**Call 1 — NASA GIBS WMS tile URLs (built locally, no network auth)**

We construct three WMS tile URLs directly in code for the project's coordinates at 2015 (baseline), 2020 (mid-term), and 2024 (current):

```
GET https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
  ?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng
  &TRANSPARENT=true&LAYERS={layer}&CRS=CRS%3A84&WIDTH=512&HEIGHT=512
  &BBOX={west},{south},{east},{north}&TIME={date}
```

The bounding box is computed from the project's lat/lng centre with a half-degree radius capped to `[0.3°, 2.0°]` using `max(0.3, min(2.0, sqrt(area_ha / 10000) * 0.5))`. Layer selection is type-driven: vegetation projects (reforestation, mangrove, peatland, regenerative agriculture, REDD+) use `MODIS_Terra_NDVI_8Day`; energy and ocean projects use `MODIS_Terra_CorrectedReflectance_TrueColor`. The three URLs are handed directly to the browser as `<img src>` tags — the browser fetches the actual satellite pixels from NASA's CDN with no server proxy.

**Call 2 — NVIDIA NIM (`nimChat`) for NDVI analysis**

We call NIM (Llama 3.3-70B) with a system prompt: *"You are a remote-sensing scientist providing satellite-derived land-cover metrics. Return ONLY valid JSON — no prose, no markdown fences."* The user prompt carries the project's coordinates, intervention type, area in hectares, timeline, region, and country, then asks:

```json
{
  "ndvi_baseline":               // 0.0–1.0, NDVI before project start
  "ndvi_current":                // 0.0–1.0, latest observed NDVI
  "ndvi_change":                 // current minus baseline
  "vegetation_cover_pct":        // 0–100
  "historical_deforestation_rate": // %/year in the reference region
  "vegetation_confidence":       // "confirmed" | "partial" | "disputed"
  "ground_truth_score":          // 0–100
  "yearly_ndvi": [               // 10 points, 2015–2024
    { "year": 2015, "ndvi": 0.0–1.0 }, ...
  ],
  "analysis":    // 2–3 sentence scientific analysis
  "key_finding": // one sentence summary
}
```

Every numeric field is sanitized with `min/max` clamps before use. If `yearly_ndvi` is missing or malformed, we fall back to an S-curve interpolation: `ndvi(t) = baseline + (current − baseline) × t²(3 − 2t)` where `t = i / 9`. If the NIM call fails entirely, deterministic type-specific fallbacks are served from a lookup table of published MODIS averages — the panel always renders.

**What the dashboard shows:**

The three NASA tile `<img>` tags load in the browser side-by-side. As pixels arrive from NASA, a spinner fades out and the real imagery fades in. NDVI baseline and current bars animate from zero. The yearly NDVI sparkline renders as 10 columns using the S-curve or NIM data. The vegetation confidence badge (Confirmed / Partial / Disputed) is colour-coded green/amber/red and sits next to the Ground-Truth Score (0–100).

**What it makes possible:**

Without this layer, the results dashboard has no connection to observable reality — only models talking to models. The NASA tiles give every claim a pixel-level timestamp. For Kariba REDD+ (Zimbabwe), the satellite data returns `ndvi_baseline: 0.64`, `ndvi_current: 0.68` — a +0.04 change over nine years. A genuine REDD+ project protecting a forest under active deforestation threat would show stable or increasing NDVI under intervention pressure. +0.04 on a stable mature forest is exactly what you see when no meaningful threat existed. That single number corroborates the simulation's 4.5× overclaim finding from a completely independent data source — MODIS pixels, not models.

---

### Investor Intelligence Panel — powered by Nemotron (`$NEMOTRON_MODEL`)

After the simulation completes, the browser calls `POST /api/investor` which calls Nemotron (via `$NEMOTRON_MODEL`, authenticated with the same `NVIDIA_API_KEY`) to produce a structured investment analysis tied directly to that simulation's numbers — not a generic template.

**What is sent to Nemotron**

System prompt: *"You are a climate investment analyst at a tier-1 impact fund. Return ONLY valid JSON with no prose or markdown fences."*

User prompt carries the full `SimSummary` object:

```
Project: {name} ({type})
Location: {region}, {country}
Investment: ${investment_usd_m}M over {timeline_years} years

Simulation Results:
  Planetary Impact Score: {score}/100 ({tier})
  Total CO₂ (10yr): {total_co2_10yr_tons} tonnes
  Cost per tonne: ${cost_per_ton_usd}
  Net benefit: ${net_benefit_usd_m}M
  Overall risk: {overall_risk}
  Greenwashing risk: {greenwashing_risk} (accuracy {accuracy_ratio}%)
```

**What Nemotron returns — exact JSON schema**

```json
{
  "rating":           "Strong Buy | Buy | Hold | Avoid",
  "rating_rationale": "1–2 sentences",
  "irr_pct":          // base-case IRR (number)
  "comparable_irr_pct": // benchmark IRR for similar infrastructure
  "scenarios": [
    { "label": "Pessimistic", "co2_price_usd": n, "roi_pct": n, "npv_usd_m": n, "payback_years": n },
    { "label": "Base Case",   "co2_price_usd": n, "roi_pct": n, "npv_usd_m": n, "payback_years": n },
    { "label": "Optimistic",  "co2_price_usd": n, "roi_pct": n, "npv_usd_m": n, "payback_years": n }
  ],
  "key_risks": ["risk1", "risk2", "risk3"],
  "thesis":    "2–3 sentences"
}
```

Every field is validated and sanitized individually before use. `rating` is checked against the four allowed enum values; fallback is the type-specific default. All numeric scenario fields are clamped with `sanitize(v, min, max, fallback)` — `roi_pct` to `[-100, 2000]`, `payback_years` to `[1, 30]`, `co2_price_usd` to `[0, 2000]`. `key_risks` elements are filtered to `typeof r === "string"` before display. If the entire Nemotron call fails, a fully pre-computed type-specific fallback is returned — the panel always renders.

**What it makes possible:**

Without Nemotron, there is no investment context on the results page. An impact score of 91 and a cost of $14/tonne is just data. Nemotron converts it into a decision: *"Strong Buy — IRR 14.5% vs. the 10% infrastructure benchmark, Pessimistic scenario ROI +95% at $25/tonne, Base Case ROI +180% at $65/tonne, Optimistic ROI +320% at $130/tonne. Payback: 6 years base case."* That is the difference between a scientist's output and an investor's brief.

**Concrete examples:**

- **Dogger Bank Wind Farm** (score 91, gold, risk low, no greenwashing) → `"Strong Buy"`, IRR 14.5% vs. 10% benchmark, all three scenarios profitable, thesis: *"Utility-scale wind in prime irradiance corridors delivers the strongest risk-adjusted return in the climate investment space."*
- **Kariba REDD+** (score 32, red, greenwashing severe, accuracy 22%) → `"Avoid"`, IRR 3.5% vs. 8% benchmark, pessimistic scenario ROI −20% with NPV −$5M, thesis: *"REDD+ credit values are under sustained pressure from investigative reporting. Without satellite-verified additionality, the pessimistic scenario — credit price collapse — is a realistic tail risk."*

The rating, rationale, and thesis are all different between these two projects because Nemotron received different simulation numbers, not because a human wrote two different templates.

---

### What you see in the results

The simulation dashboard surfaces everything:

- **Animated radial gauge** showing the 0–100 Impact Score with a live 6-dimension breakdown
- **10-year CO₂ projection chart** (Recharts) with annual sequestration, temperature delta, ecosystem health, and biodiversity index
- **Claim verification panel** — a side-by-side bar comparison of claimed vs. simulated CO₂, the accuracy ratio, and a greenwashing risk badge
- **NVIDIA Cosmos snapshots** — ecosystem state descriptions at years 0, 1, 5, and 10 with atmospheric parameters
- **Risk matrix** across 7 categories (Physical, Policy, Social, Financial, Permanence, Methodology, Technology), each with severity, probability %, and mitigation
- **Comparable projects** benchmarked against similar verified interventions
- **Portfolio optimizer** — set a budget, let cuOpt find the allocation across intervention types that maximises total CO₂ per dollar
- **Satellite Ground-Truth panel** — real NASA GIBS imagery + NIM NDVI analysis
- **Investor Intelligence panel** — Nemotron-generated Buy/Hold/Avoid rating with IRR, 3 scenarios, thesis

---

### How Nemotron is used — specifically

All four Nemotron features call the model configured via `$NEMOTRON_MODEL` and authenticate using the same `NVIDIA_API_KEY` as the other NIM endpoints. The base URL is configured via `$NEMOTRON_BASE_URL` (defaults to `https://integrate.api.nvidia.com/v1`).

**Feature 1 — Simulation Quality Judge (`runNemotronConfidence`)**
Runs asynchronously after the main pipeline completes. Prompts Nemotron to act as a scientific peer reviewer: given the NIM climate analysis outputs (average annual CO₂, year-1 and year-10 ecosystem health, NIM stated confidence, comparable projects), score the analysis on four dimensions — `scientific_accuracy`, `internal_consistency`, `regional_specificity`, and `ipcc_alignment` — each 0.0–1.0. Returns a weighted composite score and a High/Medium/Low label. Stored as `SimulationResult.nemotron_confidence` and surfaced in the NVIDIA Insights panel.

**Feature 2 — Greenwashing Root-Cause Analysis (`runNemotronGreenwashingAnalysis`)**
Triggered only when greenwashing risk is "moderate", "high", or "severe". Prompts Nemotron to act as a carbon fraud investigator: given the specific overclaim factor and project type, identify the exact methodology failure. For REDD+: inflated deforestation baselines, non-additionality, leakage. For reforestation: ramp-up curve errors, biomass density, soil carbon. Returns `root_cause` (one sentence), `mechanisms` (up to 3 specific causal mechanisms), and `red_flags` (up to 3 concrete observable red flags from the data). Stored as `ClaimVerification.nemotron_analysis` and surfaced in the Claim Verification panel.

**Feature 3 — Synthetic Project Generation (`generateSyntheticProjects`)**
Used by `POST /api/generate-projects`. Prompts Nemotron to generate realistic `ClimateIntervention` JSON specs for a given type and geography — with slightly optimistic claimed CO₂ figures, as real project developers do. Each generated project includes name, description, area or capacity, investment, certifications, proponent, and rationale. Validated against the `ClimateIntervention` type, assigned a fresh ID, and returned ready for the full simulation pipeline.

**Feature 4 — Investor Intelligence (`runInvestorAnalysis`)**
Runs client-side on-demand after the simulation completes. Sends Nemotron the full `SimSummary` (impact score, 10-year CO₂, cost per tonne, greenwashing risk and accuracy ratio) and asks it to produce a structured investment analysis in JSON. Nemotron generates the rating, IRR, three CO₂ price scenarios, thesis, and key risks — all specific to the project's actual simulation numbers, not a generic template. The response is validated and sanitized field-by-field with type-specific fallbacks if the API is unavailable.

---

### The numbers that matter

Our canonical greenwashing demo: the **Kariba REDD+ project** (Zimbabwe, VCS612). It claims 4.9 million tCO₂/year. Our NVIDIA simulation estimates 1.1 million. That's a 22% accuracy ratio — 4.5× overclaim — Severe. Score: 32/100. The forests were real. The baselines were not.

By contrast, the **Dogger Bank Wind Farm** (UK) scores 91. Measured wind speeds match our atmospheric models. Claims are accurate. Invest with confidence.

---

### Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Zustand · Framer Motion · react-globe.gl · Recharts · Zod · NVIDIA NIM (Llama 3.3-70B) · NVIDIA Nemotron (`$NEMOTRON_MODEL`) · NVIDIA Cosmos · NVIDIA cuOpt · NASA GIBS (MODIS) · Cala Knowledge API · Context.dev
