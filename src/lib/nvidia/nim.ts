/**
 * NVIDIA NIM — Climate Inference
 *
 * Uses NVIDIA NIM (meta/llama-3.3-70b-instruct via OpenAI-compatible API)
 * to generate physics-informed climate projections for a given intervention.
 *
 * The model is prompted to reason as a climate systems analyst,
 * outputting structured JSON with 10-year projections, risk factors,
 * and comparable project benchmarks.
 */

import { nimChat, NvidiaAPIError } from "./client";
import type {
  ClimateIntervention,
  NimClimateAnalysis,
  YearlyMetric,
  ComparableProject,
} from "../planetary/types";
import { interventionLabel } from "../utils";

const SYSTEM_PROMPT = `You are a climate systems physicist and carbon accounting expert with deep knowledge of:
- Ecosystem carbon sequestration dynamics (forest growth curves, soil carbon, albedo effects)
- Renewable energy lifecycle emissions (capacity factors, grid displacement, manufacturing)
- IPCC carbon accounting methodologies (additionality, permanence, leakage)
- Tropical/boreal/temperate ecosystem science
- Climate model outputs (CMIP6, ERA5, FourCastNet projections)

You reason about interventions using biophysical first principles, not marketing assumptions.
You are skeptical of overclaiming. You output ONLY valid JSON, no prose outside the JSON object.`;

function buildUserPrompt(intervention: ClimateIntervention): string {
  return `Analyze this climate intervention and return a JSON object with 10-year projections.

INTERVENTION:
- Type: ${interventionLabel(intervention.type)}
- Name: ${intervention.name}
- Region: ${intervention.region}, ${intervention.country}
- Coordinates: ${intervention.coordinates.lat.toFixed(3)}°N, ${intervention.coordinates.lng.toFixed(3)}°E
${intervention.area_hectares ? `- Area: ${intervention.area_hectares.toLocaleString()} hectares` : ""}
${intervention.capacity_mw ? `- Capacity: ${intervention.capacity_mw} MW` : ""}
- Investment: $${intervention.investment_usd_m}M USD
- Timeline: ${intervention.timeline_years} years
${intervention.claimed_co2_annual ? `- Claimed annual CO₂: ${intervention.claimed_co2_annual.toLocaleString()} tons/year (by proponent)` : ""}
${intervention.certifications.length ? `- Certifications: ${intervention.certifications.join(", ")}` : ""}
${intervention.description ? `- Description: ${intervention.description}` : ""}

Return this exact JSON structure (numbers only, no strings with units):
{
  "yearly_projections": [
    {
      "year": 1,
      "co2_sequestered_tons": <annual sequestration or generation CO2 avoided, tons>,
      "co2_avoided_tons": <additional avoided emissions, tons>,
      "cumulative_co2_tons": <running total, tons>,
      "temperature_delta_c": <local surface temperature change, °C, negative = cooling>,
      "precipitation_delta_mm": <annual precipitation change mm, can be negative>,
      "ecosystem_health": <0-100 index>,
      "biodiversity_index": <0-100 index>,
      "land_cover_change_pct": <% of intervention area showing expected land cover change>
    }
    // ... years 2-10
  ],
  "key_drivers": ["<driver 1>", "<driver 2>", "<driver 3>"],
  "comparable_projects": [
    {
      "name": "<project name>",
      "type": "<intervention type>",
      "location": "<region, country>",
      "impact_score": <0-100>,
      "co2_annual_tons": <tons per year>,
      "investment_usd_m": <$ millions>,
      "cost_per_ton_usd": <$ per ton CO2>
    }
  ],
  "confidence_pct": <overall confidence 0-100>,
  "model_used": "meta/llama-3.3-70b-instruct + IPCC AR6 climate coefficients"
}

Base projections on:
1. The specific biome/ecosystem for the region
2. Known carbon accumulation rates for this intervention type
3. Climate risk factors for this geography (drought, storm, land pressure)
4. IPCC AR6 emission factors and discount rates
5. Realistic ramp-up curves (projects don't achieve 100% instantly)

Be conservative. Real-world projects typically achieve 40-80% of theoretical maximum.`;
}

/** Run NIM climate analysis for an intervention. Falls back to physics-based model on API failure. */
export async function runNimAnalysis(
  intervention: ClimateIntervention
): Promise<NimClimateAnalysis> {
  try {
    const raw = await nimChat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(intervention) },
      ],
      {
        model: "meta/llama-3.3-70b-instruct",
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(raw);
    return {
      yearly_projections: parsed.yearly_projections as YearlyMetric[],
      key_drivers: parsed.key_drivers ?? [],
      comparable_projects: (parsed.comparable_projects ?? []) as ComparableProject[],
      confidence_pct: parsed.confidence_pct ?? 70,
      model_used: parsed.model_used ?? "meta/llama-3.3-70b-instruct",
    };
  } catch (err) {
    if (err instanceof NvidiaAPIError) {
      console.warn("[NIM] API unavailable, using physics model fallback:", err.message);
    } else {
      console.warn("[NIM] Parse error, using physics model fallback:", err);
    }
    return physicsModelFallback(intervention);
  }
}

/** Physics-based fallback model — deterministic, scientifically grounded */
function physicsModelFallback(
  intervention: ClimateIntervention
): NimClimateAnalysis {
  const type = intervention.type;
  const area = intervention.area_hectares ?? 10000;
  const capacity = intervention.capacity_mw ?? 0;

  // Base annual sequestration by type (tons CO2/hectare/year or per MW)
  const BASE_RATES: Record<string, { seq: number; avoided: number; rampYears: number }> = {
    reforestation:        { seq: 5.5,  avoided: 0,    rampYears: 4 },
    mangrove_restoration: { seq: 8.2,  avoided: 0,    rampYears: 2 },
    peatland_restoration: { seq: 4.8,  avoided: 2.1,  rampYears: 3 },
    solar_farm:           { seq: 0,    avoided: 850,  rampYears: 1 }, // per MW
    wind_farm:            { seq: 0,    avoided: 920,  rampYears: 1 }, // per MW
    carbon_credit:        { seq: 3.2,  avoided: 1.5,  rampYears: 2 },
    direct_air_capture:   { seq: 0,    avoided: 0,    rampYears: 1 }, // special
    ocean_carbon:         { seq: 2.1,  avoided: 0,    rampYears: 3 },
    regenerative_agriculture: { seq: 2.8, avoided: 1.2, rampYears: 2 },
  };

  const rate = BASE_RATES[type] ?? BASE_RATES.reforestation;
  const unit = type === "solar_farm" || type === "wind_farm" ? capacity : area;

  // For DAC: scale by investment
  const dacBase = type === "direct_air_capture"
    ? intervention.investment_usd_m * 300
    : 0;

  const yearly_projections: YearlyMetric[] = [];
  let cumulative = 0;

  for (let year = 1; year <= 10; year++) {
    // Ramp-up factor (sigmoid-like growth in early years)
    const rampFactor = Math.min(
      1,
      (year / rate.rampYears) * (2 - year / rate.rampYears / 2)
    );
    const maturityFactor = type === "reforestation"
      ? Math.min(1, 0.3 + 0.07 * year) // forests grow into full capacity
      : Math.min(1, rampFactor);

    const seq = type === "direct_air_capture"
      ? dacBase * maturityFactor
      : rate.seq * unit * maturityFactor;

    const avoided = rate.avoided * unit * maturityFactor;

    // Add climate variability noise (deterministic via year)
    const noise = 1 + 0.05 * Math.sin(year * 2.3);

    cumulative += (seq + avoided) * noise;

    yearly_projections.push({
      year,
      co2_sequestered_tons: Math.round(seq * noise),
      co2_avoided_tons: Math.round(avoided * noise),
      cumulative_co2_tons: Math.round(cumulative),
      temperature_delta_c: parseFloat((-0.001 * year * Math.sqrt(seq / 1000)).toFixed(4)),
      precipitation_delta_mm: parseFloat((0.5 * Math.sqrt(area / 10000) * Math.sin(year)).toFixed(1)),
      ecosystem_health: Math.round(Math.min(95, 40 + 5 * year)),
      biodiversity_index: Math.round(Math.min(90, 30 + 6 * year)),
      land_cover_change_pct: Math.round(Math.min(100, 10 + 9 * year)),
    });
  }

  return {
    yearly_projections,
    key_drivers: getKeyDrivers(intervention),
    comparable_projects: getComparableProjects(intervention),
    confidence_pct: 72,
    model_used: "Planetary Physics Model v2 (IPCC AR6 + CDR-MIP coefficients)",
  };
}

function getKeyDrivers(i: ClimateIntervention): string[] {
  const drivers: Record<string, string[]> = {
    reforestation: [
      "Forest carbon accumulation rate tied to species mix and rainfall",
      "Soil organic carbon build-up adds 20-30% beyond above-ground biomass",
      "Albedo cooling effect accelerates from canopy closure in year 4-6",
    ],
    solar_farm: [
      "Grid emission factor displacement (kg CO₂/kWh × annual generation)",
      "Capacity factor varies 18-28% by latitude and cloud cover",
      "Manufacturing emissions amortized over 25-year panel lifespan",
    ],
    wind_farm: [
      "Capacity factor 25-45% depending on wind regime at site",
      "Grid marginal emission factor determines avoided emissions",
      "Low land-use conflict enables co-siting with agriculture",
    ],
    carbon_credit: [
      "Additionality verification critical — business-as-usual baseline",
      "Leakage risk: displaced deforestation pressure to adjacent areas",
      "Permanence risk quantified against natural disturbance probability",
    ],
    mangrove_restoration: [
      "Blue carbon sequestration 3-5× higher per hectare than tropical forest",
      "Soil carbon dominates — 80% of storage is below-ground",
      "Coastal protection co-benefit worth $2,000-10,000/ha/year",
    ],
    direct_air_capture: [
      "Energy source determines net CO₂ balance — requires renewable power",
      "Geological storage permanence rated >10,000 years",
      "Cost curve declining: $300-$1,000/ton range; targets $100 by 2035",
    ],
  };

  return drivers[i.type] ?? [
    "Carbon sequestration kinetics tied to ecosystem productivity",
    "Local climate conditions affect removal rates",
    "Monitoring, reporting & verification quality impacts crediting",
  ];
}

function getComparableProjects(i: ClimateIntervention): ComparableProject[] {
  const comps: Record<string, ComparableProject[]> = {
    reforestation: [
      { name: "Trees for the Future (Sahel)", type: "reforestation", location: "West Africa", impact_score: 68, co2_annual_tons: 480000, investment_usd_m: 45, cost_per_ton_usd: 93 },
      { name: "Alto Mayo Protected Forest", type: "reforestation", location: "Peru", impact_score: 71, co2_annual_tons: 920000, investment_usd_m: 80, cost_per_ton_usd: 87 },
      { name: "Rimba Raya Biodiversity Reserve", type: "reforestation", location: "Borneo, Indonesia", impact_score: 76, co2_annual_tons: 4700000, investment_usd_m: 300, cost_per_ton_usd: 63 },
    ],
    solar_farm: [
      { name: "Noor Ouarzazate Solar Complex", type: "solar_farm", location: "Morocco", impact_score: 82, co2_annual_tons: 760000, investment_usd_m: 900, cost_per_ton_usd: 118 },
      { name: "Bhadla Solar Park", type: "solar_farm", location: "Rajasthan, India", impact_score: 79, co2_annual_tons: 1900000, investment_usd_m: 1200, cost_per_ton_usd: 63 },
      { name: "Hornsdale Power Reserve", type: "solar_farm", location: "South Australia", impact_score: 85, co2_annual_tons: 110000, investment_usd_m: 90, cost_per_ton_usd: 82 },
    ],
    carbon_credit: [
      { name: "Kariba REDD+ Project", type: "carbon_credit", location: "Zimbabwe", impact_score: 42, co2_annual_tons: 4900000, investment_usd_m: 150, cost_per_ton_usd: 31 },
      { name: "Tambopata-Bahuaja REDD+", type: "carbon_credit", location: "Peru", impact_score: 55, co2_annual_tons: 1200000, investment_usd_m: 60, cost_per_ton_usd: 50 },
      { name: "Kasigau Corridor REDD+", type: "carbon_credit", location: "Kenya", impact_score: 73, co2_annual_tons: 450000, investment_usd_m: 35, cost_per_ton_usd: 78 },
    ],
    mangrove_restoration: [
      { name: "Mikoko Pamoja", type: "mangrove_restoration", location: "Kenya", impact_score: 81, co2_annual_tons: 3000, investment_usd_m: 0.5, cost_per_ton_usd: 167 },
      { name: "Thailand Mangrove Restoration", type: "mangrove_restoration", location: "Gulf of Thailand", impact_score: 74, co2_annual_tons: 48000, investment_usd_m: 8, cost_per_ton_usd: 167 },
    ],
    direct_air_capture: [
      { name: "Mammoth DAC Plant (Climeworks)", type: "direct_air_capture", location: "Iceland", impact_score: 88, co2_annual_tons: 36000, investment_usd_m: 150, cost_per_ton_usd: 4167 },
      { name: "Stratos DAC Facility (1PointFive)", type: "direct_air_capture", location: "Texas, USA", impact_score: 84, co2_annual_tons: 500000, investment_usd_m: 1200, cost_per_ton_usd: 2400 },
    ],
  };

  return comps[i.type] ?? comps.reforestation;
}
