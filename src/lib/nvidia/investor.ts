/**
 * Nemotron Investor Intelligence
 *
 * Uses the Nemotron judge model to generate a structured investment analysis
 * for a completed climate simulation:
 *   • Buy/Sell rating with rationale
 *   • Three CO₂-price scenarios (pessimistic / base / optimistic)
 *   • IRR vs comparable infrastructure benchmark
 *   • Investment thesis and key investor risks
 *
 * Falls back to type-specific deterministic defaults when the API is unavailable.
 */

import { nimChat } from "./client";
import type {
  ClimateIntervention,
  InterventionType,
  InvestorIntelligence,
  InvestorScenario,
} from "../planetary/types";

// ── Slim sim summary passed to Nemotron ──────────────────────────────────────

export interface SimSummary {
  planetary_impact_score: number;
  score_tier: string;
  total_co2_10yr_tons: number;
  cost_per_ton_usd: number;
  net_benefit_usd_m: number;
  overall_risk: string;
  greenwashing_risk?: string;
  accuracy_ratio?: number;
}

// ── Fallbacks by intervention type ───────────────────────────────────────────

type FallbackSpec = Omit<InvestorIntelligence, "model_used" | "generated_at">;

const TYPE_FALLBACKS: Record<InterventionType, FallbackSpec> = {
  solar_farm: {
    rating: "Strong Buy",
    rating_rationale:
      "Utility-scale solar in high-irradiance markets offers bankable, measurable carbon displacement with minimal permanence risk and strong regulatory tailwinds.",
    irr_pct: 14.5,
    comparable_irr_pct: 10.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 25,  roi_pct: 95,  npv_usd_m: 38,  payback_years: 9 },
      { label: "Base Case",   co2_price_usd: 65,  roi_pct: 180, npv_usd_m: 96,  payback_years: 6 },
      { label: "Optimistic",  co2_price_usd: 130, roi_pct: 320, npv_usd_m: 182, payback_years: 4 },
    ],
    key_risks: ["Grid-integration & curtailment delays", "Power-purchase agreement price risk", "Panel degradation above warranted rate"],
    thesis:
      "Utility-scale solar in prime irradiance corridors delivers the strongest risk-adjusted return in the climate investment space. Bankable revenue streams from long-term PPAs and rising voluntary carbon prices support a bullish thesis across all three scenarios.",
  },

  wind_farm: {
    rating: "Buy",
    rating_rationale:
      "Wind offers reliable capacity factors at scale with well-understood O&M costs and strong policy support across key jurisdictions.",
    irr_pct: 11.5,
    comparable_irr_pct: 10.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 25,  roi_pct: 75,  npv_usd_m: 22, payback_years: 10 },
      { label: "Base Case",   co2_price_usd: 55,  roi_pct: 155, npv_usd_m: 62, payback_years: 7  },
      { label: "Optimistic",  co2_price_usd: 110, roi_pct: 265, npv_usd_m: 118, payback_years: 5 },
    ],
    key_risks: ["Wind-resource variability vs. P50 forecast", "Grid curtailment in high-penetration markets", "Community/visual externality opposition"],
    thesis:
      "Wind energy projects offer a moderate premium over comparable infrastructure IRR, underpinned by proven technology and long asset lives. The slight resource variability premium is offset by strong policy support and growing corporate PPA demand.",
  },

  reforestation: {
    rating: "Hold",
    rating_rationale:
      "Reforestation offers compelling co-benefits but slower carbon delivery relative to energy projects; permanence risk limits institutional investor appetite at current VCM prices.",
    irr_pct: 7.5,
    comparable_irr_pct: 8.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 20,  roi_pct: 60,  npv_usd_m: 5,  payback_years: 12 },
      { label: "Base Case",   co2_price_usd: 50,  roi_pct: 140, npv_usd_m: 28, payback_years: 8  },
      { label: "Optimistic",  co2_price_usd: 100, roi_pct: 260, npv_usd_m: 65, payback_years: 5  },
    ],
    key_risks: ["Permanence — fire, pest, drought reversal", "Baseline additionality under Article 6 scrutiny", "Carbon credit liquidity thin below $40/ton"],
    thesis:
      "Reforestation IRR trails the infrastructure benchmark at today's VCM prices. At ≥$50/ton — a credible 2027 trajectory — returns become compelling. Best positioned for impact-first investors comfortable with a 10+ year horizon and permanence buffer reserves.",
  },

  mangrove_restoration: {
    rating: "Buy",
    rating_rationale:
      "Mangrove carbon commands a premium over terrestrial forestry due to higher sequestration density, proven blue-carbon MRV, and growing institutional buyer demand.",
    irr_pct: 10.5,
    comparable_irr_pct: 8.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 30,  roi_pct: 80,  npv_usd_m: 8,  payback_years: 10 },
      { label: "Base Case",   co2_price_usd: 70,  roi_pct: 185, npv_usd_m: 22, payback_years: 7  },
      { label: "Optimistic",  co2_price_usd: 140, roi_pct: 340, npv_usd_m: 45, payback_years: 4  },
    ],
    key_risks: ["Storm-surge and cyclone exposure", "Coastal encroachment from aquaculture expansion", "Monitoring and verification cost overruns"],
    thesis:
      "Blue-carbon assets, particularly mangroves, are attracting significant Article 6 bilateral-deal interest from Annex-I buyers seeking premium, verifiable removals. The outsized co-benefits — coastal protection, fisheries, biodiversity — further underpin a premium pricing floor.",
  },

  peatland_restoration: {
    rating: "Buy",
    rating_rationale:
      "Peatland restoration delivers extremely high permanence scores at competitive cost, with rising sovereign and corporate demand for high-integrity removals.",
    irr_pct: 11.0,
    comparable_irr_pct: 8.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 25,  roi_pct: 70,  npv_usd_m: 6,  payback_years: 11 },
      { label: "Base Case",   co2_price_usd: 65,  roi_pct: 180, npv_usd_m: 18, payback_years: 7  },
      { label: "Optimistic",  co2_price_usd: 130, roi_pct: 340, npv_usd_m: 38, payback_years: 4  },
    ],
    key_risks: ["Rewetting infrastructure failure", "Land-tenure disputes in target watersheds", "Hydrology monitoring complexity and cost"],
    thesis:
      "Peatland carbon is among the most cost-effective removal pathways with IPCC-validated permanence exceeding 1,000 years. As Article 6 bilateral deal volume scales, premium pricing for high-integrity peat removals is structurally supported.",
  },

  regenerative_agriculture: {
    rating: "Buy",
    rating_rationale:
      "Growing food-sector net-zero commitments and improving soil-carbon MRV create a credible demand floor that underpins a Buy rating at scale.",
    irr_pct: 10.0,
    comparable_irr_pct: 9.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 20, roi_pct: 65,  npv_usd_m: 12, payback_years: 10 },
      { label: "Base Case",   co2_price_usd: 45, roi_pct: 145, npv_usd_m: 32, payback_years: 7  },
      { label: "Optimistic",  co2_price_usd: 80, roi_pct: 250, npv_usd_m: 58, payback_years: 5  },
    ],
    key_risks: ["Farmer adoption rate risk", "Soil-carbon permanence verification gaps", "Extreme weather yield impact"],
    thesis:
      "Regenerative agriculture benefits from supply-chain driven demand from food majors with Scope 3 commitments. Co-benefits — soil health, yield resilience — create a natural corporate buyer premium above the spot VCM price.",
  },

  carbon_credit: {
    rating: "Avoid",
    rating_rationale:
      "REDD+ credit quality varies enormously; without satellite-verified additionality, credit values are exposed to regulatory reform and reputational risk under Article 6.",
    irr_pct: 3.5,
    comparable_irr_pct: 8.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 15, roi_pct: -20, npv_usd_m: -5, payback_years: 15 },
      { label: "Base Case",   co2_price_usd: 40, roi_pct: 55,  npv_usd_m: 12, payback_years: 11 },
      { label: "Optimistic",  co2_price_usd: 90, roi_pct: 155, npv_usd_m: 38, payback_years: 7  },
    ],
    key_risks: ["Additionality challenge and credit invalidation", "Baseline inflation under VERRA methodology reform", "Article 6 corresponding adjustment uncertainty"],
    thesis:
      "REDD+ credit values are under sustained pressure from investigative reporting and tightening registry standards. Without independent satellite verification showing genuine forest protection, the pessimistic scenario (credit price collapse) is a realistic tail risk.",
  },

  direct_air_capture: {
    rating: "Hold",
    rating_rationale:
      "DAC is the ultimate backstop removal pathway but current economics require significant policy support; suitable for strategic/impact investors with long horizons.",
    irr_pct: 8.5,
    comparable_irr_pct: 10.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 80,  roi_pct: 15,  npv_usd_m: 3,  payback_years: 14 },
      { label: "Base Case",   co2_price_usd: 150, roi_pct: 60,  npv_usd_m: 12, payback_years: 10 },
      { label: "Optimistic",  co2_price_usd: 200, roi_pct: 165, npv_usd_m: 38, payback_years: 7  },
    ],
    key_risks: ["Technology scaling and cost-reduction execution risk", "High energy input cost with grid carbon intensity dependency", "Policy dependency (US 45Q, EU CCS Directive)"],
    thesis:
      "DAC offers permanent, verifiable, location-independent removals — the gold standard for hard-to-abate sector offsetting. Best suited for investors seeking strategic optionality on a nascent market with a credible path to cost parity by 2035.",
  },

  ocean_carbon: {
    rating: "Hold",
    rating_rationale:
      "Ocean carbon sequestration lacks standardised MRV and credit recognition, making it unsuitable for yield-seeking investors at present.",
    irr_pct: 5.5,
    comparable_irr_pct: 8.0,
    scenarios: [
      { label: "Pessimistic", co2_price_usd: 20,  roi_pct: 10,  npv_usd_m: 1,  payback_years: 15 },
      { label: "Base Case",   co2_price_usd: 55,  roi_pct: 90,  npv_usd_m: 8,  payback_years: 10 },
      { label: "Optimistic",  co2_price_usd: 120, roi_pct: 220, npv_usd_m: 22, payback_years: 6  },
    ],
    key_risks: ["MRV methodology not yet standardised", "Credit recognition uncertain across registries", "Ocean-climate feedback uncertainty"],
    thesis:
      "Ocean carbon captures early-mover optionality on a potentially transformative carbon pathway. Currently suited for R&D-stage impact capital; return expectations should reflect the pre-commercial nature of the market.",
  },
};

// ── Nemotron analysis ─────────────────────────────────────────────────────────

function sanitize(v: unknown, min: number, max: number, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}

function parseScenario(
  raw: unknown,
  fb: InvestorScenario
): InvestorScenario {
  const r = raw as Record<string, unknown> ?? {};
  const labels = ["Pessimistic", "Base Case", "Optimistic"] as const;
  return {
    label: labels.includes(r.label as (typeof labels)[number])
      ? (r.label as InvestorScenario["label"])
      : fb.label,
    co2_price_usd:  sanitize(r.co2_price_usd,  0, 2000,  fb.co2_price_usd),
    roi_pct:        sanitize(r.roi_pct,         -100, 2000, fb.roi_pct),
    npv_usd_m:      sanitize(r.npv_usd_m,       -500, 10000, fb.npv_usd_m),
    payback_years:  sanitize(r.payback_years,   1, 30,     fb.payback_years),
  };
}

async function nimInvestorAnalysis(
  intervention: ClimateIntervention,
  sim: SimSummary
): Promise<Omit<InvestorIntelligence, "model_used" | "generated_at">> {
  const fb = TYPE_FALLBACKS[intervention.type];

  const systemPrompt =
    "You are a climate investment analyst at a tier-1 impact fund. " +
    "Return ONLY valid JSON with no prose or markdown fences.";

  const userPrompt =
    `Generate investor intelligence for this climate project.\n\n` +
    `Project: ${intervention.name} (${intervention.type.replace(/_/g, " ")})\n` +
    `Location: ${intervention.region}, ${intervention.country}\n` +
    `Investment: $${intervention.investment_usd_m}M over ${intervention.timeline_years} years\n\n` +
    `Simulation Results:\n` +
    `  Planetary Impact Score: ${sim.planetary_impact_score}/100 (${sim.score_tier})\n` +
    `  Total CO₂ (10yr): ${sim.total_co2_10yr_tons.toLocaleString()} tonnes\n` +
    `  Cost per tonne: $${sim.cost_per_ton_usd}\n` +
    `  Net benefit: $${sim.net_benefit_usd_m}M\n` +
    `  Overall risk: ${sim.overall_risk}\n` +
    (sim.greenwashing_risk ? `  Greenwashing risk: ${sim.greenwashing_risk} (accuracy ${((sim.accuracy_ratio ?? 1) * 100).toFixed(0)}%)\n` : "") +
    `\nUsing current voluntary carbon market data, return:\n` +
    `{\n` +
    `  "rating": "Strong Buy|Buy|Hold|Avoid",\n` +
    `  "rating_rationale": "<1-2 sentences>",\n` +
    `  "irr_pct": <base-case IRR>,\n` +
    `  "comparable_irr_pct": <benchmark IRR for similar infrastructure>,\n` +
    `  "scenarios": [\n` +
    `    {"label":"Pessimistic","co2_price_usd":<$>,"roi_pct":<>,"npv_usd_m":<>,"payback_years":<>},\n` +
    `    {"label":"Base Case",  "co2_price_usd":<$>,"roi_pct":<>,"npv_usd_m":<>,"payback_years":<>},\n` +
    `    {"label":"Optimistic", "co2_price_usd":<$>,"roi_pct":<>,"npv_usd_m":<>,"payback_years":<>}\n` +
    `  ],\n` +
    `  "key_risks": ["<risk1>","<risk2>","<risk3>"],\n` +
    `  "thesis": "<2-3 sentences>"\n` +
    `}`;

  const raw = await nimChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    { temperature: 0.25, max_tokens: 1000, response_format: { type: "json_object" } }
  );

  const p = JSON.parse(raw) as Record<string, unknown>;
  const ratings = ["Strong Buy", "Buy", "Hold", "Avoid"] as const;

  const rawScenarios = Array.isArray(p.scenarios) ? p.scenarios : [];
  const fbScens = fb.scenarios;

  return {
    rating: ratings.includes(p.rating as (typeof ratings)[number])
      ? (p.rating as InvestorIntelligence["rating"])
      : fb.rating,
    rating_rationale:
      typeof p.rating_rationale === "string" && p.rating_rationale.length > 10
        ? p.rating_rationale
        : fb.rating_rationale,
    irr_pct:            sanitize(p.irr_pct,            0, 100, fb.irr_pct),
    comparable_irr_pct: sanitize(p.comparable_irr_pct, 0, 100, fb.comparable_irr_pct),
    scenarios: [
      parseScenario(rawScenarios[0], fbScens[0]),
      parseScenario(rawScenarios[1], fbScens[1]),
      parseScenario(rawScenarios[2], fbScens[2]),
    ],
    key_risks: Array.isArray(p.key_risks) && p.key_risks.length > 0
      ? (p.key_risks as unknown[]).filter((r): r is string => typeof r === "string").slice(0, 3)
      : fb.key_risks,
    thesis:
      typeof p.thesis === "string" && p.thesis.length > 20
        ? p.thesis
        : fb.thesis,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runInvestorAnalysis(
  intervention: ClimateIntervention,
  sim: SimSummary
): Promise<InvestorIntelligence> {
  const generated_at = new Date().toISOString();

  try {
    const analysis = await nimInvestorAnalysis(intervention, sim);
    return {
      ...analysis,
      model_used: `Nemotron / ${process.env.NEMOTRON_MODEL ?? "nvidia/nemotron-3.5-super-vl-120b-a12b"}`,
      generated_at,
    };
  } catch {
    return {
      ...TYPE_FALLBACKS[intervention.type],
      model_used: "Nemotron (fallback)",
      generated_at,
    };
  }
}
