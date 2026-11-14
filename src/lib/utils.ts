import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ScoreTier, GreenwashingRisk, RiskSeverity } from "./planetary/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format large numbers with SI suffixes */
export function fmtNum(n: number, decimals = 1): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(decimals)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

/** Format tons CO2 with units */
export function fmtCO2(tons: number): string {
  return `${fmtNum(tons)} tCO₂`;
}

/** Format dollars */
export function fmtUSD(usd_m: number): string {
  if (usd_m >= 1000) return `$${(usd_m / 1000).toFixed(1)}B`;
  if (usd_m >= 1) return `$${usd_m.toFixed(0)}M`;
  return `$${(usd_m * 1000).toFixed(0)}K`;
}

/** Format percentage */
export function fmtPct(value: number, decimals = 0): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/** Score tier label and colors */
export function scoreTierMeta(tier: ScoreTier): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  const map: Record<ScoreTier, { label: string; color: string; bg: string; border: string }> = {
    platinum: {
      label: "Platinum",
      color: "text-slate-200",
      bg: "bg-slate-200/10",
      border: "border-slate-200/30",
    },
    gold: {
      label: "Gold",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
    },
    silver: {
      label: "Silver",
      color: "text-slate-400",
      bg: "bg-slate-400/10",
      border: "border-slate-400/30",
    },
    bronze: {
      label: "Bronze",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
    },
    amber: {
      label: "Caution",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    },
    red: {
      label: "Flagged",
      color: "text-red-400",
      bg: "bg-red-400/10",
      border: "border-red-400/30",
    },
  };
  return map[tier];
}

/** Greenwashing risk color */
export function greenwashingColor(risk: GreenwashingRisk): string {
  const map: Record<GreenwashingRisk, string> = {
    none: "text-emerald-400",
    low: "text-emerald-400",
    moderate: "text-amber-400",
    high: "text-orange-400",
    severe: "text-red-400",
  };
  return map[risk];
}

/** Risk severity color */
export function riskSeverityColor(severity: RiskSeverity): string {
  const map: Record<RiskSeverity, string> = {
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };
  return map[severity];
}

/** Get score tier from numeric score */
export function scoreToTier(score: number): ScoreTier {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 45) return "bronze";
  if (score >= 30) return "amber";
  return "red";
}

/** Intervention type labels */
export function interventionLabel(type: string): string {
  const map: Record<string, string> = {
    reforestation: "Reforestation",
    solar_farm: "Solar Farm",
    wind_farm: "Wind Farm",
    carbon_credit: "Carbon Credits",
    mangrove_restoration: "Mangrove Restoration",
    direct_air_capture: "Direct Air Capture",
    ocean_carbon: "Ocean Carbon",
    regenerative_agriculture: "Regenerative Agriculture",
    peatland_restoration: "Peatland Restoration",
  };
  return map[type] ?? type;
}

/** Generate a deterministic ID */
export function makeId(prefix = "pl"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Sleep utility */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Clamp number to range */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Format stage label for display */
export function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    idle: "Ready",
    fetching_baseline: "Fetching Emissions Baseline",
    running_nim: "NVIDIA NIM Climate Inference",
    running_cosmos: "Cosmos World Simulation",
    running_cuopt: "cuOpt Placement Optimization",
    scoring: "Computing Impact Score",
    complete: "Complete",
    error: "Error",
  };
  return map[stage] ?? stage;
}
