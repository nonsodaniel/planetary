/**
 * Planetary Impact Score™ Algorithm
 *
 * Scores a climate intervention on a 0–100 scale across 6 dimensions.
 * Every point is traceable to a specific input or model output.
 *
 * Score breakdown:
 *   Carbon Effectiveness  0–30  (how much CO₂ is actually reduced/sequestered)
 *   Additionality         0–20  (would it happen without this investment?)
 *   Permanence            0–20  (will it last 10+ years?)
 *   Biodiversity          0–15  (ecosystem health co-benefits)
 *   Community Benefit     0–10  (local livelihood impact)
 *   Verification Quality  0–5   (quality of monitoring + reporting)
 *   ─────────────────────────
 *   TOTAL                 0–100
 */

import type {
  ClimateIntervention,
  NimClimateAnalysis,
  RiskFactor,
  ScoreBreakdown,
  ScoreTier,
  GreenwashingRisk,
  ClaimVerification,
  YearlyMetric,
} from "./types";
import { clamp, scoreToTier } from "../utils";

// ─── Carbon Effectiveness (0–30) ─────────────────────────────────────────────

function scoreCarbonEffectiveness(
  yearly: YearlyMetric[],
  investment_usd_m: number,
  type: string
): number {
  // Benchmark cost-effectiveness by type ($ per ton CO₂, typical range)
  const BENCHMARKS: Record<string, { cheap: number; moderate: number; expensive: number }> = {
    reforestation:            { cheap: 30,   moderate: 80,   expensive: 200  },
    mangrove_restoration:     { cheap: 50,   moderate: 150,  expensive: 400  },
    peatland_restoration:     { cheap: 40,   moderate: 100,  expensive: 250  },
    solar_farm:               { cheap: 30,   moderate: 80,   expensive: 150  },
    wind_farm:                { cheap: 20,   moderate: 60,   expensive: 120  },
    carbon_credit:            { cheap: 5,    moderate: 20,   expensive: 50   },
    direct_air_capture:       { cheap: 500,  moderate: 1000, expensive: 3000 },
    ocean_carbon:             { cheap: 20,   moderate: 60,   expensive: 150  },
    regenerative_agriculture: { cheap: 15,   moderate: 50,   expensive: 120  },
  };

  const totalCO2 = yearly.reduce((s, y) => s + y.co2_sequestered_tons + y.co2_avoided_tons, 0);
  if (totalCO2 === 0 || investment_usd_m === 0) return 0;

  const costPerTon = (investment_usd_m * 1_000_000) / totalCO2;
  const bench = BENCHMARKS[type] ?? BENCHMARKS.reforestation;

  if (costPerTon <= bench.cheap) return 30;
  if (costPerTon <= bench.moderate) {
    return Math.round(30 - ((costPerTon - bench.cheap) / (bench.moderate - bench.cheap)) * 10);
  }
  if (costPerTon <= bench.expensive) {
    return Math.round(20 - ((costPerTon - bench.moderate) / (bench.expensive - bench.moderate)) * 10);
  }
  return clamp(10 - Math.floor((costPerTon - bench.expensive) / bench.expensive) * 3, 2, 10);
}

// ─── Additionality (0–20) ────────────────────────────────────────────────────

function scoreAdditionality(type: string, certifications: string[]): number {
  // How likely is it that the intervention adds CO₂ reduction beyond BAU?
  const BASE_ADDITIONALITY: Record<string, number> = {
    direct_air_capture:       20, // uniquely additional — no BAU equivalent
    mangrove_restoration:     18,
    peatland_restoration:     17,
    solar_farm:               16,
    wind_farm:                16,
    ocean_carbon:             15,
    reforestation:            14,
    regenerative_agriculture: 13,
    carbon_credit:             8, // highest risk of non-additionality
  };

  let score = BASE_ADDITIONALITY[type] ?? 12;

  // Certification bonuses
  if (certifications.includes("Gold Standard")) score = Math.min(20, score + 2);
  if (certifications.includes("VCS") || certifications.includes("Verra")) score = Math.min(20, score + 1);
  if (certifications.includes("Plan Vivo")) score = Math.min(20, score + 1);

  return score;
}

// ─── Permanence (0–20) ───────────────────────────────────────────────────────

function scorePermanence(
  type: string,
  risks: RiskFactor[],
  timelineYears: number
): number {
  const BASE_PERMANENCE: Record<string, number> = {
    direct_air_capture:       20, // geological storage = permanent
    peatland_restoration:     18,
    mangrove_restoration:     16,
    solar_farm:               17, // panels last 25+ years
    wind_farm:                17,
    ocean_carbon:             14,
    reforestation:            13, // fire, pest, land change risk
    regenerative_agriculture: 11,
    carbon_credit:             9, // reversal risk is highest
  };

  let score = BASE_PERMANENCE[type] ?? 12;

  // Timeline bonus
  if (timelineYears >= 25) score = Math.min(20, score + 2);
  else if (timelineYears >= 15) score = Math.min(20, score + 1);

  // Risk deductions for permanence threats
  const permanenceRisks = risks.filter((r) => r.category === "permanence");
  for (const risk of permanenceRisks) {
    if (risk.severity === "critical") score -= 4;
    else if (risk.severity === "high") score -= 2;
    else if (risk.severity === "medium") score -= 1;
  }

  const physicalRisks = risks.filter((r) => r.category === "physical" && r.severity !== "low");
  for (const risk of physicalRisks) {
    if (risk.severity === "critical") score -= 2;
    else if (risk.severity === "high") score -= 1;
  }

  return clamp(score, 0, 20);
}

// ─── Biodiversity (0–15) ─────────────────────────────────────────────────────

function scoreBiodiversity(
  yearly: YearlyMetric[],
  type: string
): number {
  // Average biodiversity index over 10 years
  const avgBio = yearly.reduce((s, y) => s + y.biodiversity_index, 0) / yearly.length;

  const TYPE_MULTIPLIER: Record<string, number> = {
    mangrove_restoration:     1.3,
    peatland_restoration:     1.2,
    reforestation:            1.1,
    ocean_carbon:             1.0,
    regenerative_agriculture: 0.9,
    solar_farm:               0.5, // limited biodiversity benefit
    wind_farm:                0.4,
    direct_air_capture:       0.2,
    carbon_credit:            1.0,
  };

  const multiplier = TYPE_MULTIPLIER[type] ?? 1.0;
  return clamp(Math.round((avgBio / 100) * 15 * multiplier), 0, 15);
}

// ─── Community Benefit (0–10) ────────────────────────────────────────────────

function scoreCommunityBenefit(
  type: string,
  region: string,
  certifications: string[]
): number {
  const BASE: Record<string, number> = {
    mangrove_restoration:     9,
    reforestation:            8,
    regenerative_agriculture: 8,
    peatland_restoration:     7,
    carbon_credit:            6,
    ocean_carbon:             5,
    wind_farm:                5,
    solar_farm:               4,
    direct_air_capture:       2,
  };

  let score = BASE[type] ?? 5;

  // Community-focused certifications
  if (certifications.includes("CCBA")) score = Math.min(10, score + 1);
  if (certifications.includes("Plan Vivo")) score = Math.min(10, score + 1);

  // Higher developing world co-benefit
  const highBenefitRegions = ["africa", "southeast asia", "central america", "pacific"];
  if (highBenefitRegions.some((r) => region.toLowerCase().includes(r))) {
    score = Math.min(10, score + 1);
  }

  return score;
}

// ─── Verification Quality (0–5) ──────────────────────────────────────────────

function scoreVerificationQuality(certifications: string[]): number {
  if (certifications.length === 0) return 1;

  let score = 1;
  if (certifications.includes("Gold Standard")) score = Math.max(score, 5);
  if (certifications.includes("Plan Vivo")) score = Math.max(score, 5);
  if (certifications.includes("VCS") || certifications.includes("Verra")) score = Math.max(score, 3);
  if (certifications.includes("CCBA")) score = Math.max(score, 4);
  if (certifications.includes("ISO 14064")) score = Math.max(score, 3);

  if (certifications.length >= 3) score = Math.min(5, score + 1);

  return clamp(score, 0, 5);
}

// ─── Greenwashing Risk ────────────────────────────────────────────────────────

export function computeGreenwashingRisk(accuracyRatio: number): GreenwashingRisk {
  if (accuracyRatio >= 0.9) return "none";
  if (accuracyRatio >= 0.75) return "low";
  if (accuracyRatio >= 0.55) return "moderate";
  if (accuracyRatio >= 0.35) return "high";
  return "severe";
}

// ─── Claim Verification ──────────────────────────────────────────────────────

export function buildClaimVerification(
  claimed: number,
  simulated: number,
  evidence: string[],
  sources: ClaimVerification["cala_sources"]
): ClaimVerification {
  const ratio = simulated / claimed;
  return {
    claimed_annual_co2_tons: claimed,
    simulated_annual_co2_tons: simulated,
    accuracy_ratio: parseFloat(ratio.toFixed(3)),
    greenwashing_risk: computeGreenwashingRisk(ratio),
    discrepancy_pct: parseFloat(((1 - ratio) * 100).toFixed(1)),
    evidence,
    cala_sources: sources,
  };
}

// ─── Risk Generator ──────────────────────────────────────────────────────────

export function generateRisks(
  intervention: ClimateIntervention,
  yearly: YearlyMetric[]
): RiskFactor[] {
  const risks: RiskFactor[] = [];
  const type = intervention.type;

  // Physical risks
  if (["reforestation", "mangrove_restoration", "peatland_restoration"].includes(type)) {
    risks.push({
      id: "phys_fire",
      category: "physical",
      name: "Wildfire Reversal",
      severity: intervention.country.toLowerCase().includes("australia") ? "high" : "medium",
      probability: 0.18,
      description: "Wildfire events can reverse years of carbon sequestration in days. Risk increasing with climate change.",
      mitigation: "Firebreaks, community fire management, buffer pool insurance",
    });
  }

  if (type === "carbon_credit" || type === "reforestation") {
    risks.push({
      id: "perm_leakage",
      category: "permanence",
      name: "Carbon Leakage",
      severity: "high",
      probability: 0.25,
      description: "Deforestation pressure displaced to unprotected adjacent areas, reducing net impact.",
      mitigation: "Jurisdictional-scale accounting, nested REDD+ approach",
    });
  }

  if (["solar_farm", "wind_farm"].includes(type)) {
    risks.push({
      id: "pol_curtailment",
      category: "policy",
      name: "Grid Curtailment",
      severity: "medium",
      probability: 0.15,
      description: "Grid operator may curtail output during low-demand periods, reducing actual CO₂ displacement.",
      mitigation: "Battery storage co-location, grid interconnection agreements",
    });
  }

  if (type === "carbon_credit") {
    risks.push({
      id: "meth_baseline",
      category: "methodology",
      name: "Inflated Baseline",
      severity: "high",
      probability: 0.35,
      description: "REDD+ projects historically use inflated deforestation baselines, overstating their additionality by 2-5×.",
      mitigation: "Independent satellite verification, dynamic baseline adjustment",
    });

    risks.push({
      id: "perm_reversal",
      category: "permanence",
      name: "Political Instability",
      severity: "medium",
      probability: 0.20,
      description: "Policy changes, government turnover, or conflict can void protection agreements.",
      mitigation: "Long-term legal land tenure, international treaty coverage",
    });
  }

  if (["direct_air_capture", "ocean_carbon"].includes(type)) {
    risks.push({
      id: "fin_opex",
      category: "financial",
      name: "Operating Cost Overrun",
      severity: "medium",
      probability: 0.22,
      description: "High operational costs (energy, maintenance) may make long-term operation uneconomic.",
      mitigation: "Long-term offtake agreements, government contracts for removal",
    });
  }

  // Physical climate risk (all types)
  const avgEcosystem = yearly.slice(-3).reduce((s, y) => s + y.ecosystem_health, 0) / 3;
  if (avgEcosystem < 70) {
    risks.push({
      id: "phys_drought",
      category: "physical",
      name: "Chronic Drought Risk",
      severity: avgEcosystem < 50 ? "high" : "medium",
      probability: 0.28,
      description: "Increasing aridity in the target region threatens long-term ecosystem productivity.",
      mitigation: "Drought-resistant species selection, supplementary irrigation in establishment years",
    });
  }

  // Social risk (all)
  risks.push({
    id: "soc_conflict",
    category: "social",
    name: "Land Rights Conflict",
    severity: "medium",
    probability: 0.12,
    description: "Disputed land tenure or indigenous rights concerns can stall or halt the project.",
    mitigation: "FPIC process, community benefit sharing, independent grievance mechanism",
  });

  return risks;
}

// ─── Main Scoring Function ───────────────────────────────────────────────────

export function computePlanetaryScore(
  intervention: ClimateIntervention,
  yearly: YearlyMetric[],
  risks: RiskFactor[]
): { breakdown: ScoreBreakdown; tier: ScoreTier } {
  const carbonEffectiveness = scoreCarbonEffectiveness(
    yearly,
    intervention.investment_usd_m,
    intervention.type
  );

  const additionality = scoreAdditionality(
    intervention.type,
    intervention.certifications
  );

  const permanence = scorePermanence(
    intervention.type,
    risks,
    intervention.timeline_years
  );

  const biodiversity = scoreBiodiversity(yearly, intervention.type);

  const communityBenefit = scoreCommunityBenefit(
    intervention.type,
    intervention.region,
    intervention.certifications
  );

  const verificationQuality = scoreVerificationQuality(intervention.certifications);

  const total = clamp(
    carbonEffectiveness +
      additionality +
      permanence +
      biodiversity +
      communityBenefit +
      verificationQuality,
    0,
    100
  );

  const breakdown: ScoreBreakdown = {
    carbon_effectiveness: carbonEffectiveness,
    additionality,
    permanence,
    biodiversity,
    community_benefit: communityBenefit,
    verification_quality: verificationQuality,
    total,
  };

  return { breakdown, tier: scoreToTier(total) };
}
