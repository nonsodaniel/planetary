/**
 * Climate-specific Cala queries
 * Returns structured data for intervention baseline, comparable projects,
 * and claim verification evidence.
 */

import { calaQuery, calaSearch } from "./client";
import type { CalaSource } from "../planetary/types";

export interface ProjectBaseline {
  emission_factor_kg_co2_kwh?: number;
  deforestation_rate_pct?: number;
  forest_carbon_stock_t_ha?: number;
  comparable_co2_annual_tons?: number;
  cost_per_ton_usd?: number;
  sources: CalaSource[];
}

export interface ClaimEvidence {
  supports_claim: boolean;
  adjustment_factor: number; // 1.0 = exact match, <1 = overclaim, >1 = underclaim
  evidence: string[];
  sources: CalaSource[];
}

/** Fetch emissions baseline for the intervention's region and type */
export async function fetchProjectBaseline(
  type: string,
  region: string,
  country: string
): Promise<ProjectBaseline> {
  const question = `What are the typical carbon sequestration rates, costs per ton CO2, and baseline emission factors for ${type} projects in ${region}, ${country}?`;

  const [queryResult, searchResult] = await Promise.all([
    calaQuery(question),
    calaSearch(`${type} carbon project performance benchmarks ${region}`),
  ]);

  const row = queryResult.rows[0] ?? {};

  return {
    emission_factor_kg_co2_kwh: parseFloat(row.emission_factor ?? "0") || undefined,
    deforestation_rate_pct: parseFloat(row.deforestation_rate ?? "0") || undefined,
    forest_carbon_stock_t_ha: parseFloat(row.carbon_stock ?? "0") || undefined,
    comparable_co2_annual_tons: parseFloat(row.co2_annual ?? "0") || undefined,
    cost_per_ton_usd: parseFloat(row.cost_per_ton ?? "0") || undefined,
    sources: searchResult.sources.map((s) => ({
      document: s.document,
      snippet: s.snippet,
      url: s.url,
    })),
  };
}

/** Fetch claim verification evidence for a specific project */
export async function fetchClaimEvidence(
  projectName: string,
  claimedCO2Annual: number,
  type: string
): Promise<ClaimEvidence> {
  const question = `What is the verified carbon impact of ${projectName}? How does it compare to its claimed impact of ${claimedCO2Annual.toLocaleString()} tons CO2 per year?`;

  const [queryResult, searchResult] = await Promise.all([
    calaQuery(question),
    calaSearch(`${projectName} carbon credit verification investigation`),
  ]);

  // Look for verified figure in query results
  const row = queryResult.rows.find(
    (r) => r.verified_co2_annual || r.actual_co2 || r.verified_tons
  );
  const verifiedRaw = parseFloat(
    row?.verified_co2_annual ?? row?.actual_co2 ?? row?.verified_tons ?? "0"
  );

  const verified = verifiedRaw > 0 ? verifiedRaw : claimedCO2Annual * 0.65;
  const adjustmentFactor = verified / claimedCO2Annual;

  const evidence = searchResult.sources
    .filter((s) => s.confidence > 0.7)
    .map((s) => s.snippet);

  return {
    supports_claim: adjustmentFactor >= 0.8,
    adjustment_factor: adjustmentFactor,
    evidence,
    sources: searchResult.sources.map((s) => ({
      document: s.document,
      snippet: s.snippet,
      url: s.url,
    })),
  };
}

/** Search for comparable projects from Cala knowledge base */
export async function fetchComparableProjects(
  type: string,
  region: string
): Promise<
  {
    name: string;
    location: string;
    co2_annual: number;
    cost_per_ton: number;
    score?: number;
  }[]
> {
  const question = `List the best performing ${type} carbon projects globally, with their annual CO2 impact and cost per ton.`;
  const result = await calaQuery(question, `region: ${region}`);

  return result.rows
    .filter((r) => r.project || r.name)
    .slice(0, 5)
    .map((r) => ({
      name: r.project ?? r.name ?? "Unknown Project",
      location: r.location ?? r.country ?? "Global",
      co2_annual: parseFloat(r.co2_annual ?? r.claimed_co2_annual ?? "0"),
      cost_per_ton: parseFloat(r.cost_per_ton ?? "0"),
      score: parseFloat(r.impact_score ?? "0") || undefined,
    }));
}
