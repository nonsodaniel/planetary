/**
 * NVIDIA Nemotron Integration
 *
 * Uses: NEMOTRON_MODEL  (default: nvidia/nemotron-3.5-super-vl-120b-a12b)
 *       NEMOTRON_BASE_URL (default: https://integrate.api.nvidia.com/v1)
 *       NVIDIA_API_KEY    (shared with NIM)
 *
 * Feature 1 — Confidence Judge
 *   Prompts Nemotron to evaluate the NIM climate analysis as a scientific
 *   reviewer, returning a structured quality score (High / Medium / Low)
 *   with per-dimension breakdown. Stored as SimulationResult.nemotron_confidence.
 *
 * Feature 3 — Greenwashing Root-Cause Analysis
 *   When a greenwashing gap is detected, Nemotron identifies the specific
 *   mechanism: inflated baselines, leakage, additionality failure, etc.
 *   Stored as ClaimVerification.nemotron_analysis.
 *
 * Feature 4 — Synthetic Project Generation
 *   Generates realistic ClimateIntervention datasets for any intervention
 *   type and geography — expands the platform beyond the 8 pre-computed demos.
 *   Returned from POST /api/generate-projects.
 *
 * All three functions degrade gracefully: on API failure a deterministic
 * fallback is returned and the existing simulation result is never mutated.
 */

import { nimChat, NvidiaAPIError } from "./client";
import type {
  ClimateIntervention,
  NimClimateAnalysis,
  ClaimVerification,
  InterventionType,
  NemotronConfidence,
  NemotronGreenwashingAnalysis,
} from "../planetary/types";
import { interventionLabel, makeId } from "../utils";

// ── Config ────────────────────────────────────────────────────────────────────

function getNemotronModel(): string {
  return process.env.NEMOTRON_MODEL ?? "nvidia/nemotron-3.5-super-vl-120b-a12b";
}

// nimChat already reads NVIDIA_NIM_BASE_URL which defaults to integrate.api.nvidia.com/v1.
// NEMOTRON_BASE_URL is the same host, so we reuse nimChat and just override the model.
// If a separate base URL is ever needed, set NVIDIA_NIM_BASE_URL in the environment.

// ── Feature 1: Confidence Judge ───────────────────────────────────────────────

/**
 * Ask Nemotron to evaluate the NIM analysis as a scientific peer reviewer.
 * Returns a 0–1 confidence score with four sub-dimensions.
 * Runs asynchronously after the main pipeline completes.
 */
export async function runNemotronConfidence(
  intervention: ClimateIntervention,
  nimAnalysis: NimClimateAnalysis
): Promise<NemotronConfidence> {
  const model = getNemotronModel();

  const prompt = buildConfidencePrompt(intervention, nimAnalysis);

  try {
    const raw = await nimChat(
      [{ role: "user", content: prompt }],
      {
        model,
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(raw);
    return normaliseConfidence(parsed, model);
  } catch (err) {
    if (err instanceof NvidiaAPIError) {
      console.warn("[Nemotron Confidence] API unavailable:", err.message);
    } else {
      console.warn("[Nemotron Confidence] Parse error:", err);
    }
    return fallbackConfidence(nimAnalysis, model);
  }
}

function buildConfidencePrompt(
  intervention: ClimateIntervention,
  nim: NimClimateAnalysis
): string {
  const totalCO2 = nim.yearly_projections.reduce(
    (s, y) => s + y.co2_sequestered_tons + y.co2_avoided_tons,
    0
  );
  const avgAnnual = Math.round(totalCO2 / Math.max(1, nim.yearly_projections.length));
  const yr1 = nim.yearly_projections[0];
  const yr10 = nim.yearly_projections[nim.yearly_projections.length - 1];

  return `You are a scientific peer reviewer for climate carbon accounting models.
Evaluate the quality and reliability of this NVIDIA NIM climate analysis.

INTERVENTION:
- Type: ${interventionLabel(intervention.type)}
- Location: ${intervention.region}, ${intervention.country}
- Investment: $${intervention.investment_usd_m}M
${intervention.area_hectares ? `- Area: ${intervention.area_hectares.toLocaleString()} ha` : ""}
${intervention.capacity_mw ? `- Capacity: ${intervention.capacity_mw} MW` : ""}
${intervention.claimed_co2_annual ? `- Proponent's claimed CO₂/yr: ${intervention.claimed_co2_annual.toLocaleString()} t` : ""}

NIM ANALYSIS OUTPUTS:
- Average annual CO₂: ${avgAnnual.toLocaleString()} t/yr
- Year 1 ecosystem health: ${yr1?.ecosystem_health ?? "n/a"}/100
- Year 10 ecosystem health: ${yr10?.ecosystem_health ?? "n/a"}/100
- Year 10 biodiversity index: ${yr10?.biodiversity_index ?? "n/a"}/100
- NIM stated confidence: ${nim.confidence_pct}%
- Key drivers identified: ${nim.key_drivers.slice(0, 2).join("; ")}
- Comparable projects found: ${nim.comparable_projects.length}

Score this analysis on four dimensions (each 0.0–1.0):
1. scientific_accuracy — Are the CO₂ projections within known IPCC AR6 ranges for this type/region?
2. internal_consistency — Do year-on-year growth curves follow plausible ramp-up dynamics?
3. regional_specificity — Does the analysis reference climate/biome conditions specific to this location?
4. ipcc_alignment — Are IPCC emission factors and discount rates applied correctly?

Return ONLY this JSON:
{
  "score": <weighted average 0.0–1.0, 2 decimal places>,
  "label": "<High|Medium|Low>",
  "reasoning": "<2 sentences explaining the confidence rating>",
  "dimensions": {
    "scientific_accuracy": <0.0–1.0>,
    "internal_consistency": <0.0–1.0>,
    "regional_specificity": <0.0–1.0>,
    "ipcc_alignment": <0.0–1.0>
  }
}

High = score ≥ 0.70, Medium = 0.45–0.69, Low = < 0.45.`;
}

function normaliseConfidence(
  parsed: Record<string, unknown>,
  model: string
): NemotronConfidence {
  const score = Math.min(1, Math.max(0, Number(parsed.score) || 0.65));
  const label =
    score >= 0.7 ? "High" : score >= 0.45 ? "Medium" : "Low";

  const dims = parsed.dimensions as Record<string, number> | undefined;

  return {
    score: parseFloat(score.toFixed(2)),
    label: (parsed.label as "High" | "Medium" | "Low") ?? label,
    reasoning:
      (parsed.reasoning as string) ??
      "Analysis evaluated by Nemotron scientific reviewer.",
    dimensions: dims
      ? {
          scientific_accuracy: parseFloat(Number(dims.scientific_accuracy || 0.65).toFixed(2)),
          internal_consistency: parseFloat(Number(dims.internal_consistency || 0.65).toFixed(2)),
          regional_specificity: parseFloat(Number(dims.regional_specificity || 0.65).toFixed(2)),
          ipcc_alignment: parseFloat(Number(dims.ipcc_alignment || 0.65).toFixed(2)),
        }
      : undefined,
    model_used: model,
  };
}

function fallbackConfidence(
  nim: NimClimateAnalysis,
  model: string
): NemotronConfidence {
  const score = parseFloat(Math.min(1, Math.max(0, nim.confidence_pct / 100)).toFixed(2));
  const label = score >= 0.7 ? "High" : score >= 0.45 ? "Medium" : "Low";
  return {
    score,
    label,
    reasoning: `Derived from NIM model's self-reported confidence of ${nim.confidence_pct}%. Nemotron peer review unavailable — this is an estimated confidence level.`,
    model_used: `${model} (fallback)`,
  };
}

// ── Feature 3: Greenwashing Root-Cause Analysis ───────────────────────────────

/**
 * When an accuracy gap is detected, ask Nemotron to explain the specific
 * mechanisms behind the overclaiming. Goes beyond the ratio to name the
 * exact methodology failure (e.g. inflated REDD+ baseline, leakage, etc.).
 * Only called when greenwashing_risk is "moderate", "high", or "severe".
 */
export async function runNemotronGreenwashingAnalysis(
  intervention: ClimateIntervention,
  verification: ClaimVerification
): Promise<NemotronGreenwashingAnalysis> {
  const model = getNemotronModel();

  const prompt = buildGreenwashingPrompt(intervention, verification);

  try {
    const raw = await nimChat(
      [{ role: "user", content: prompt }],
      {
        model,
        temperature: 0.3,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(raw);
    return normaliseGreenwashing(parsed, model);
  } catch (err) {
    if (err instanceof NvidiaAPIError) {
      console.warn("[Nemotron Greenwashing] API unavailable:", err.message);
    } else {
      console.warn("[Nemotron Greenwashing] Parse error:", err);
    }
    return fallbackGreenwashing(intervention, verification, model);
  }
}

function buildGreenwashingPrompt(
  intervention: ClimateIntervention,
  v: ClaimVerification
): string {
  const overclaim = v.accuracy_ratio > 0 ? (1 / v.accuracy_ratio).toFixed(1) : "∞";
  const type = interventionLabel(intervention.type);

  return `You are a carbon fraud investigator. Analyze WHY this project overclaims its CO₂ impact.

PROJECT: ${intervention.name || type + " — " + intervention.country}
Type: ${type}
Location: ${intervention.region}, ${intervention.country}
Certifications: ${intervention.certifications.join(", ") || "None"}
${intervention.area_hectares ? `Area: ${intervention.area_hectares.toLocaleString()} ha` : ""}

OVERCLAIMING DATA:
- Claimed annual CO₂: ${v.claimed_annual_co2_tons.toLocaleString()} t/yr
- Simulated annual CO₂: ${v.simulated_annual_co2_tons.toLocaleString()} t/yr
- Overclaim factor: ${overclaim}× (accuracy = ${Math.round(v.accuracy_ratio * 100)}%)
- Greenwashing risk level: ${v.greenwashing_risk}

Identify the specific mechanism for THIS project type (${type}). Be precise — not generic.

For carbon_credit/REDD+: check inflated deforestation baselines, non-additionality, leakage.
For reforestation/mangrove: check ramp-up curve errors, species carbon density, soil carbon exclusion.
For solar/wind: check capacity factor assumptions, grid emission factor mismatch, curtailment.
For peatland: check re-wetting rate assumptions, methane offset accounting, monitoring gaps.

Return ONLY this JSON (no prose outside JSON):
{
  "root_cause": "<the single most likely cause, one plain-English sentence>",
  "mechanisms": [
    "<specific mechanism 1 — name the exact methodology error>",
    "<specific mechanism 2>",
    "<specific mechanism 3>"
  ],
  "red_flags": [
    "<concrete observable red flag visible in the data above>",
    "<concrete red flag 2>",
    "<concrete red flag 3>"
  ]
}`;
}

function normaliseGreenwashing(
  parsed: Record<string, unknown>,
  model: string
): NemotronGreenwashingAnalysis {
  return {
    root_cause:
      (parsed.root_cause as string) ?? "Claimed CO₂ exceeds physics-based simulation.",
    mechanisms: Array.isArray(parsed.mechanisms)
      ? (parsed.mechanisms as string[]).slice(0, 3)
      : [],
    red_flags: Array.isArray(parsed.red_flags)
      ? (parsed.red_flags as string[]).slice(0, 3)
      : [],
    model_used: model,
  };
}

function fallbackGreenwashing(
  intervention: ClimateIntervention,
  v: ClaimVerification,
  model: string
): NemotronGreenwashingAnalysis {
  const type = intervention.type;
  const overclaim = v.accuracy_ratio > 0 ? (1 / v.accuracy_ratio).toFixed(1) : "∞";

  const byType: Record<string, Omit<NemotronGreenwashingAnalysis, "model_used">> = {
    carbon_credit: {
      root_cause: "Deforestation baseline appears inflated — the forest protection area was not at the claimed risk level.",
      mechanisms: [
        "Non-additionality: protected forest was not facing the stated deforestation threat",
        "Leakage: logging pressure shifted to adjacent unprotected areas not counted in baseline",
        "Permanence deficit: credits issued before long-term enforcement was contractually secured",
      ],
      red_flags: [
        `${overclaim}× overclaim is consistent with documented patterns in REDD+ baseline manipulation`,
        "VCS certification does not independently verify field-level additionality at this scale",
        "Project area is remote with low historical deforestation pressure — baseline may be overstated",
      ],
    },
    reforestation: {
      root_cause: "Carbon accumulation rate overestimated — trees sequester CO₂ more slowly than the project timeline assumed.",
      mechanisms: [
        "Ramp-up period ignored: forests take 5–10 years to reach peak sequestration rates",
        "Above-ground biomass overestimated for the specific species mix and rainfall regime",
        "Soil carbon build-up included in claims before it was measurable in monitoring data",
      ],
      red_flags: [
        `Claimed CO₂/yr exceeds typical IPCC ceiling for ${((intervention.area_hectares ?? 0) / 1e3).toFixed(0)}K ha at this climate zone`,
        "No discount for drought probability in 10-year projection period",
        "Verification methodology does not independently cross-check biomass estimates",
      ],
    },
    solar_farm: {
      root_cause: "Grid emission factor or capacity factor assumption overstates the actual displaced emissions.",
      mechanisms: [
        "Capacity factor assumed higher than measured site wind/irradiance data supports",
        "Grid marginal emission factor used instead of average — overstates displacement",
        "Curtailment events not factored into annual generation forecasts",
      ],
      red_flags: [
        "Claimed output requires capacity factor above regional average for this latitude",
        "Grid emission factor may have declined since project baseline was set",
        "No downward adjustment for grid curtailment periods in peak generation months",
      ],
    },
  };

  const data = byType[type] ?? {
    root_cause: `Simulated impact is ${Math.round(v.accuracy_ratio * 100)}% of claimed, indicating a ${v.discrepancy_pct.toFixed(0)}% overclaim.`,
    mechanisms: [
      "Claimed figures exceed physics-based simulation for this intervention type and region",
      "Certification methodology may not capture actual on-ground performance variance",
      "Regional climate variability not fully accounted for in baseline projections",
    ],
    red_flags: [
      `Accuracy ratio ${Math.round(v.accuracy_ratio * 100)}% falls below the 75% investable threshold`,
      `Discrepancy of ${v.discrepancy_pct.toFixed(0)}% exceeds acceptable ±10% variance for verified credits`,
      "Independent field verification required before capital deployment",
    ],
  };

  return { ...data, model_used: `${model} (fallback)` };
}

// ── Feature 4: Synthetic Project Generation ───────────────────────────────────

export interface GeneratedProject {
  intervention: ClimateIntervention;
  rationale: string;
}

// Location pools per intervention type (5 geographically diverse options each)
const LOCATION_POOL: Record<
  string,
  Array<{ lat: number; lng: number; country: string; region: string }>
> = {
  reforestation: [
    { lat: -3.4,  lng: -62.2,  country: "Brazil",      region: "Amazon Basin" },
    { lat:  0.4,  lng:  18.3,  country: "DR Congo",    region: "Congo Basin" },
    { lat: 15.1,  lng: 101.2,  country: "Thailand",    region: "Southeast Asia" },
    { lat: -8.3,  lng: 115.1,  country: "Indonesia",   region: "Borneo" },
    { lat: 10.5,  lng: -13.5,  country: "Guinea",      region: "West Africa" },
  ],
  solar_farm: [
    { lat: 23.5,  lng:  54.3,  country: "UAE",         region: "Arabian Peninsula" },
    { lat: 30.1,  lng:  31.2,  country: "Egypt",       region: "North Africa" },
    { lat: -26.3, lng:  27.4,  country: "South Africa",region: "Karoo Desert" },
    { lat: 37.5,  lng:  -6.2,  country: "Spain",       region: "Andalusia" },
    { lat: 20.1,  lng:  73.5,  country: "India",       region: "Gujarat" },
  ],
  wind_farm: [
    { lat: 56.1,  lng:   3.2,  country: "UK",          region: "North Sea" },
    { lat: 55.3,  lng:  14.5,  country: "Denmark",     region: "Baltic Sea" },
    { lat: 28.1,  lng: -15.4,  country: "Spain",       region: "Canary Islands" },
    { lat: -33.8, lng: 150.2,  country: "Australia",   region: "New South Wales" },
    { lat: 42.5,  lng: -88.4,  country: "USA",         region: "Midwest" },
  ],
  mangrove_restoration: [
    { lat: 20.3,  lng:  86.9,  country: "India",       region: "Odisha Coast" },
    { lat: -4.1,  lng:  39.7,  country: "Kenya",       region: "Kenyan Coast" },
    { lat: 10.5,  lng: 107.2,  country: "Vietnam",     region: "Mekong Delta" },
    { lat: -8.5,  lng: 115.3,  country: "Indonesia",   region: "Bali" },
    { lat: 23.1,  lng:  90.4,  country: "Bangladesh",  region: "Sundarbans Extension" },
  ],
  peatland_restoration: [
    { lat: 61.5,  lng:  25.8,  country: "Finland",     region: "Central Finland" },
    { lat: 55.2,  lng:  -4.5,  country: "UK",          region: "Scottish Highlands" },
    { lat: 52.4,  lng:   5.9,  country: "Netherlands", region: "Noord-Holland" },
    { lat: -1.3,  lng: 110.5,  country: "Indonesia",   region: "Central Kalimantan" },
    { lat: 60.1,  lng:  15.2,  country: "Sweden",      region: "Dalarna" },
  ],
  carbon_credit: [
    { lat: -17.8, lng:  31.2,  country: "Zimbabwe",    region: "Zambezi Valley" },
    { lat: -12.5, lng:  28.6,  country: "Zambia",      region: "Luangwa Valley" },
    { lat:  -3.1, lng:  37.3,  country: "Kenya",       region: "Tsavo East" },
    { lat:  -9.5, lng: -74.2,  country: "Peru",        region: "Madre de Dios" },
    { lat:   5.4, lng: -59.3,  country: "Guyana",      region: "Iwokrama Forest" },
  ],
  direct_air_capture: [
    { lat: 64.1,  lng: -21.9,  country: "Iceland",     region: "Reykjanes Peninsula" },
    { lat: 31.8,  lng: -106.4, country: "USA",         region: "West Texas" },
    { lat: 51.1,  lng:  10.4,  country: "Germany",     region: "Central Germany" },
    { lat: -23.5, lng: -46.6,  country: "Brazil",      region: "São Paulo State" },
    { lat: 35.6,  lng: 139.7,  country: "Japan",       region: "Kanto Region" },
  ],
  ocean_carbon: [
    { lat: -42.9, lng: 147.3,  country: "Australia",   region: "Tasmania Coastline" },
    { lat: 60.4,  lng:   5.3,  country: "Norway",      region: "Norwegian Fjords" },
    { lat: 20.5,  lng: -87.0,  country: "Mexico",      region: "Yucatan Coast" },
    { lat: -34.6, lng: -58.4,  country: "Argentina",   region: "Buenos Aires Coast" },
    { lat:  1.3,  lng: 103.8,  country: "Singapore",   region: "Singapore Strait" },
  ],
  regenerative_agriculture: [
    { lat: 41.8,  lng: -87.6,  country: "USA",         region: "Illinois Corn Belt" },
    { lat: -15.6, lng:  28.3,  country: "Zambia",      region: "Zambia Plateau" },
    { lat: 20.5,  lng:  78.9,  country: "India",       region: "Madhya Pradesh" },
    { lat: -32.0, lng: 148.6,  country: "Australia",   region: "New South Wales Wheat Belt" },
    { lat: 51.5,  lng:  10.4,  country: "Germany",     region: "Brandenburg" },
  ],
};

const TYPE_GUIDANCE: Record<string, string> = {
  reforestation:            "Area 50K–2M ha. Investment $20–200M. CO₂ 500K–8M t/yr. Certs: VCS, CCBA, Plan Vivo.",
  solar_farm:               "Capacity 100–2000 MW. Investment $80–1500M. CO₂ avoided 100K–2M t/yr. Certs: Gold Standard, ISO 14064.",
  wind_farm:                "Capacity 200–4000 MW. Investment $200–3000M. CO₂ avoided 200K–4M t/yr. Certs: ISO 14064.",
  mangrove_restoration:     "Area 1K–50K ha. Investment $5–100M. CO₂ 20K–500K t/yr. Certs: Verra, Plan Vivo.",
  peatland_restoration:     "Area 10K–200K ha. Investment $20–150M. CO₂ 100K–2M t/yr. Certs: Verra, Gold Standard.",
  carbon_credit:            "Area 100K–2M ha. Investment $30–300M. CO₂ 500K–10M t/yr (expect overclaiming). Certs: VCS.",
  direct_air_capture:       "No area. Investment $50–2000M. CO₂ 10K–1M t/yr. Certs: ISO 14064.",
  ocean_carbon:             "Area 1K–100K ha. Investment $10–200M. CO₂ 20K–1M t/yr. Certs: Verra.",
  regenerative_agriculture: "Area 50K–500K ha. Investment $20–150M. CO₂ 100K–2M t/yr. Certs: Gold Standard, Verra.",
};

/**
 * Generate synthetic climate project specifications using Nemotron 340B.
 * Returns realistic ClimateIntervention objects ready for the simulation pipeline.
 * Counts per type are distributed evenly across the requested total.
 */
export async function generateSyntheticProjects(
  count: number,
  types?: InterventionType[]
): Promise<GeneratedProject[]> {
  const model = getNemotronModel();
  const targetTypes: InterventionType[] =
    types && types.length > 0
      ? types
      : [
          "reforestation",
          "solar_farm",
          "wind_farm",
          "mangrove_restoration",
          "peatland_restoration",
        ];

  const results: GeneratedProject[] = [];
  const perType = Math.ceil(count / targetTypes.length);

  for (const type of targetTypes) {
    if (results.length >= count) break;

    const pool = LOCATION_POOL[type] ?? LOCATION_POOL.reforestation;
    const locations = pool.slice(0, Math.min(perType, pool.length));

    try {
      const raw = await nimChat(
        [{ role: "user", content: buildGenerationPrompt(type, locations) }],
        {
          model,
          temperature: 0.7,
          max_tokens: 1800,
          response_format: { type: "json_object" },
        }
      );

      const parsed = JSON.parse(raw);
      const projects: GeneratedProject[] = (
        (parsed.projects ?? []) as Record<string, unknown>[]
      ).map((p, i) => ({
        intervention: mapRawToIntervention(p, type, locations[i] ?? locations[0]),
        rationale: (p.rationale as string) ?? "",
      }));

      results.push(...projects);
    } catch (err) {
      console.warn(`[Nemotron Generate] Failed for ${type}:`, err);
      results.push(...deterministicFallback(type, locations, model));
    }
  }

  return results.slice(0, count);
}

function buildGenerationPrompt(
  type: InterventionType,
  locations: Array<{ lat: number; lng: number; country: string; region: string }>
): string {
  return `Generate ${locations.length} realistic climate intervention project specifications.
Each project is type: "${interventionLabel(type)}"
Locations (one project per location):
${locations.map((l, i) => `${i + 1}. ${l.region}, ${l.country} (${l.lat.toFixed(1)}°, ${l.lng.toFixed(1)}°)`).join("\n")}

Typical parameters for ${interventionLabel(type)}: ${TYPE_GUIDANCE[type] ?? ""}

Make each project realistic — slightly optimistic on claimed CO₂ like real projects do.
Return ONLY this JSON (no prose):
{
  "projects": [
    {
      "name": "<specific project name including location>",
      "description": "<2 sentence description of goals and methodology>",
      "area_hectares": <number or null if energy type>,
      "capacity_mw": <number or null if land type>,
      "investment_usd_m": <number>,
      "claimed_co2_annual": <number, tons/yr — slightly optimistic>,
      "timeline_years": <10–30>,
      "certifications": ["<cert1>"],
      "proponent": "<realistic org name>",
      "rationale": "<one sentence: why this location suits this intervention>"
    }
  ]
}`;
}

function mapRawToIntervention(
  p: Record<string, unknown>,
  type: InterventionType,
  loc: { lat: number; lng: number; country: string; region: string }
): ClimateIntervention {
  return {
    id: makeId("syn"),
    type,
    name: (p.name as string) ?? `${interventionLabel(type)} — ${loc.region}`,
    description: (p.description as string) ?? "",
    region: loc.region,
    country: loc.country,
    coordinates: { lat: loc.lat, lng: loc.lng },
    ...(p.area_hectares != null ? { area_hectares: Number(p.area_hectares) } : {}),
    ...(p.capacity_mw != null ? { capacity_mw: Number(p.capacity_mw) } : {}),
    investment_usd_m: Number(p.investment_usd_m) || 50,
    ...(p.claimed_co2_annual != null
      ? { claimed_co2_annual: Number(p.claimed_co2_annual) }
      : {}),
    timeline_years: Number(p.timeline_years) || 25,
    certifications: Array.isArray(p.certifications)
      ? (p.certifications as string[]).filter(Boolean)
      : [],
    proponent: (p.proponent as string | undefined) ?? undefined,
    created_at: new Date().toISOString(),
  };
}

/** Deterministic fallback when Nemotron is unavailable */
function deterministicFallback(
  type: InterventionType,
  locations: Array<{ lat: number; lng: number; country: string; region: string }>,
  model: string
): GeneratedProject[] {
  const BASE: Record<
    string,
    Pick<ClimateIntervention, "investment_usd_m" | "claimed_co2_annual" | "timeline_years" | "certifications"> &
      Partial<Pick<ClimateIntervention, "area_hectares" | "capacity_mw">>
  > = {
    reforestation:            { area_hectares: 200000, investment_usd_m: 60,  claimed_co2_annual: 1800000, timeline_years: 25, certifications: ["VCS", "CCBA"] },
    solar_farm:               { capacity_mw: 350,      investment_usd_m: 280, claimed_co2_annual: 600000,  timeline_years: 25, certifications: ["Gold Standard"] },
    wind_farm:                { capacity_mw: 600,      investment_usd_m: 540, claimed_co2_annual: 950000,  timeline_years: 25, certifications: ["ISO 14064"] },
    mangrove_restoration:     { area_hectares: 15000,  investment_usd_m: 28,  claimed_co2_annual: 110000,  timeline_years: 20, certifications: ["Verra", "Plan Vivo"] },
    peatland_restoration:     { area_hectares: 55000,  investment_usd_m: 42,  claimed_co2_annual: 420000,  timeline_years: 30, certifications: ["Verra"] },
    carbon_credit:            { area_hectares: 500000, investment_usd_m: 55,  claimed_co2_annual: 3200000, timeline_years: 30, certifications: ["VCS"] },
    direct_air_capture:       {                        investment_usd_m: 300, claimed_co2_annual: 85000,   timeline_years: 20, certifications: ["ISO 14064"] },
    ocean_carbon:             { area_hectares: 30000,  investment_usd_m: 45,  claimed_co2_annual: 180000,  timeline_years: 20, certifications: ["Verra"] },
    regenerative_agriculture: { area_hectares: 120000, investment_usd_m: 35,  claimed_co2_annual: 480000,  timeline_years: 15, certifications: ["Gold Standard"] },
  };

  const base = BASE[type] ?? BASE.reforestation;

  return locations.map((loc) => ({
    intervention: {
      id: makeId("syn"),
      type,
      name: `${interventionLabel(type)} — ${loc.region}`,
      description: `${interventionLabel(type)} project in ${loc.region}, ${loc.country}.`,
      region: loc.region,
      country: loc.country,
      coordinates: { lat: loc.lat, lng: loc.lng },
      ...base,
      created_at: new Date().toISOString(),
    } as ClimateIntervention,
    rationale: `Deterministic fallback — ${model} unavailable. Location selected from curated pool for ${interventionLabel(type)}.`,
  }));
}
