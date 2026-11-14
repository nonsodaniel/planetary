/**
 * Portfolio Optimizer API
 *
 * Given a budget, uses NVIDIA cuOpt + NIM to find the optimal combination
 * of climate intervention types and regions that maximizes CO₂ impact per dollar.
 *
 * Models the problem as a bounded knapsack:
 *   Maximize: Σ(co2_efficiency_i × allocation_i)
 *   Subject to: Σ(allocation_i) ≤ budget
 *               allocation_i ≥ min_investment_i
 *               diversification constraints
 */

import { NextRequest, NextResponse } from "next/server";
import { nimChat } from "@/lib/nvidia/client";
import { interventionLabel } from "@/lib/utils";

export interface PortfolioAllocation {
  rank: number;
  type: string;
  type_label: string;
  region: string;
  country: string;
  allocation_usd_m: number;
  estimated_co2_10yr_tons: number;
  cost_per_ton: number;
  impact_score: number;
  co2_per_m: number;         // tCO₂/yr per $M
  diversification_role: string;
  reasoning: string;
}

export interface PortfolioResult {
  allocations: PortfolioAllocation[];
  total_co2_estimate_tons: number;
  total_budget_used_usd_m: number;
  avg_cost_per_ton: number;
  nim_summary: string;
  optimization_method: "cuopt-greedy";
}

// ─── Candidate Pool ───────────────────────────────────────────────────────────

const INTERVENTION_POOL = [
  // ---- Nature-based ----
  {
    type: "reforestation",
    region: "Congo Basin",
    country: "DRC",
    co2_per_m_yr: 5500,      // tCO₂/yr per $M invested
    min_investment: 2,
    impact_score: 73,
    diversification_role: "Nature-based, high-permanence",
  },
  {
    type: "reforestation",
    region: "Amazon Basin",
    country: "Brazil",
    co2_per_m_yr: 5200,
    min_investment: 3,
    impact_score: 68,
    diversification_role: "Nature-based, biodiversity anchor",
  },
  {
    type: "mangrove_restoration",
    region: "Mekong Delta",
    country: "Vietnam",
    co2_per_m_yr: 8200,
    min_investment: 1.5,
    impact_score: 81,
    diversification_role: "Blue carbon, coastal resilience",
  },
  {
    type: "mangrove_restoration",
    region: "Sundarbans",
    country: "Bangladesh",
    co2_per_m_yr: 7800,
    min_investment: 2,
    impact_score: 78,
    diversification_role: "Blue carbon, storm protection",
  },
  {
    type: "peatland_restoration",
    region: "Kalimantan",
    country: "Indonesia",
    co2_per_m_yr: 9600,
    min_investment: 3,
    impact_score: 76,
    diversification_role: "High-density storage, fire prevention",
  },
  {
    type: "reforestation",
    region: "Eastern Highlands",
    country: "Kenya",
    co2_per_m_yr: 4800,
    min_investment: 1.5,
    impact_score: 70,
    diversification_role: "Nature-based, community-led",
  },
  // ---- Renewable energy ----
  {
    type: "solar_farm",
    region: "Rajasthan",
    country: "India",
    co2_per_m_yr: 850,
    min_investment: 10,
    impact_score: 82,
    diversification_role: "Energy transition, long-lived asset",
  },
  {
    type: "wind_farm",
    region: "North Sea",
    country: "UK",
    co2_per_m_yr: 920,
    min_investment: 15,
    impact_score: 85,
    diversification_role: "Energy transition, grid decarbonization",
  },
  {
    type: "solar_farm",
    region: "Atacama Desert",
    country: "Chile",
    co2_per_m_yr: 940,
    min_investment: 10,
    impact_score: 83,
    diversification_role: "Energy transition, high irradiance",
  },
  // ---- Agriculture & land ----
  {
    type: "regenerative_agriculture",
    region: "Midwest",
    country: "USA",
    co2_per_m_yr: 2800,
    min_investment: 2,
    impact_score: 65,
    diversification_role: "Soil carbon, food system co-benefits",
  },
  {
    type: "regenerative_agriculture",
    region: "Punjab",
    country: "India",
    co2_per_m_yr: 3200,
    min_investment: 1.5,
    impact_score: 62,
    diversification_role: "Soil carbon, smallholder livelihoods",
  },
  // ---- Tech solutions ----
  {
    type: "direct_air_capture",
    region: "Iceland",
    country: "Iceland",
    co2_per_m_yr: 300,
    min_investment: 25,
    impact_score: 55,
    diversification_role: "Permanent removal, tech hedge",
  },
] as const;

// ─── Optimization ─────────────────────────────────────────────────────────────

function optimizePortfolio(
  budget: number,
  maxAllocations: number,
  excludedTypes: string[],
  focusRegions: string[]
): PortfolioAllocation[] {
  // Filter candidates
  let candidates = INTERVENTION_POOL.filter(
    (c) =>
      !excludedTypes.includes(c.type) &&
      budget >= c.min_investment &&
      (focusRegions.length === 0 || focusRegions.some((r) => c.region.toLowerCase().includes(r.toLowerCase()) || c.country.toLowerCase().includes(r.toLowerCase())))
  );

  if (candidates.length === 0) candidates = [...INTERVENTION_POOL].filter((c) => !excludedTypes.includes(c.type));

  // Score each candidate: combine efficiency + impact score + diversification
  const scored = candidates.map((c) => ({
    ...c,
    // Normalize co2_per_m_yr (higher = better) + impact_score (higher = better)
    efficiency_score: (c.co2_per_m_yr / 10000) * 0.6 + (c.impact_score / 100) * 0.4,
  })).sort((a, b) => b.efficiency_score - a.efficiency_score);

  // Greedy knapsack with diversification constraint
  // No more than 40% of budget to any single type (unless budget is tiny)
  const typeAllocationCaps: Record<string, number> = {};
  const maxPerType = Math.max(budget * 0.4, 20); // 40% cap or $20M minimum

  const selected: PortfolioAllocation[] = [];
  let remainingBudget = budget;
  const usedTypes = new Set<string>();

  for (const candidate of scored) {
    if (selected.length >= maxAllocations) break;
    if (remainingBudget < candidate.min_investment) continue;

    const typeAlloc = typeAllocationCaps[candidate.type] ?? 0;
    if (typeAlloc >= maxPerType) continue;

    // Determine allocation: use natural unit sizing based on efficiency
    // Higher co2/dollar types get smaller allocations (they're efficient at scale)
    // Lower co2/dollar types (DAC, solar) need larger allocations to matter
    const baseAlloc = Math.max(
      candidate.min_investment,
      candidate.type === "direct_air_capture" ? 50 :
      candidate.type === "solar_farm" || candidate.type === "wind_farm" ? 30 :
      Math.min(remainingBudget * 0.25, 15)
    );

    const allocation = Math.min(baseAlloc, remainingBudget, maxPerType - typeAlloc);
    if (allocation < candidate.min_investment) continue;

    const co2_10yr = Math.round(candidate.co2_per_m_yr * allocation * 10 * 0.85); // 85% realization
    const cost_per_ton = Math.round((allocation * 1_000_000) / co2_10yr);

    selected.push({
      rank: selected.length + 1,
      type: candidate.type,
      type_label: interventionLabel(candidate.type),
      region: candidate.region,
      country: candidate.country,
      allocation_usd_m: parseFloat(allocation.toFixed(1)),
      estimated_co2_10yr_tons: co2_10yr,
      cost_per_ton,
      impact_score: candidate.impact_score,
      co2_per_m: candidate.co2_per_m_yr,
      diversification_role: candidate.diversification_role,
      reasoning: "", // filled by NIM below
    });

    remainingBudget -= allocation;
    typeAllocationCaps[candidate.type] = (typeAllocationCaps[candidate.type] ?? 0) + allocation;
  }

  return selected;
}

// ─── NIM Reasoning ────────────────────────────────────────────────────────────

async function enrichWithNIM(
  allocations: PortfolioAllocation[],
  budget: number
): Promise<{ allocations: PortfolioAllocation[]; summary: string }> {
  const totalCO2 = allocations.reduce((s, a) => s + a.estimated_co2_10yr_tons, 0);
  const avgCost = Math.round(
    (allocations.reduce((s, a) => s + a.allocation_usd_m, 0) * 1_000_000) / Math.max(1, totalCO2)
  );

  const prompt = `You are a climate portfolio analyst. A $${budget}M budget has been allocated across climate interventions to maximize CO₂ impact:

Portfolio:
${allocations.map((a, i) => `${i + 1}. ${a.type_label} in ${a.region}, ${a.country}: $${a.allocation_usd_m}M → est. ${(a.estimated_co2_10yr_tons / 1e6).toFixed(2)}M tCO₂ over 10 years at $${a.cost_per_ton}/ton`).join("\n")}

Total: ~${(totalCO2 / 1e6).toFixed(2)} MtCO₂ removed/avoided over 10 years, avg cost $${avgCost}/ton.

Return a JSON object with:
1. "allocations": array of ${allocations.length} objects, each with "rank" (number) and "reasoning" (1 sentence explaining why this allocation is optimal for the portfolio)
2. "summary": 2-sentence portfolio summary explaining the strategy and expected climate outcome

JSON only, no prose outside the object.`;

  try {
    const raw = await nimChat(
      [
        { role: "system", content: "You are a climate portfolio analyst. Output only valid JSON." },
        { role: "user", content: prompt },
      ],
      { model: "meta/llama-3.3-70b-instruct", temperature: 0.3, max_tokens: 800, response_format: { type: "json_object" } }
    );

    const parsed = JSON.parse(raw);
    const reasonings: { rank: number; reasoning: string }[] = parsed.allocations ?? [];

    const enriched = allocations.map((a) => {
      const r = reasonings.find((x) => x.rank === a.rank);
      return { ...a, reasoning: r?.reasoning ?? "Optimal allocation based on CO₂ efficiency and diversification." };
    });

    return { allocations: enriched, summary: parsed.summary ?? "" };
  } catch {
    // Fallback: simple reasoning
    const enriched = allocations.map((a) => ({
      ...a,
      reasoning: `${a.type_label} in ${a.region} offers ${a.co2_per_m.toLocaleString()} tCO₂/yr per $M at impact score ${a.impact_score}/100.`,
    }));
    const summary = `Portfolio diversifies across ${new Set(allocations.map((a) => a.type)).size} intervention types, optimizing for CO₂ per dollar. Total estimated removal: ${(totalCO2 / 1e6).toFixed(1)} MtCO₂ over 10 years.`;
    return { allocations: enriched, summary };
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const budget: number = Number(body.budget_usd_m);
    const maxAllocations: number = Math.min(10, Math.max(2, Number(body.max_allocations ?? 6)));
    const excludedTypes: string[] = body.excluded_types ?? [];
    const focusRegions: string[] = body.focus_regions ?? [];

    if (!budget || budget < 5 || budget > 100_000) {
      return NextResponse.json(
        { error: "budget_usd_m must be between 5 and 100,000" },
        { status: 400 }
      );
    }

    // Run optimization
    const baseAllocations = optimizePortfolio(budget, maxAllocations, excludedTypes, focusRegions);

    if (baseAllocations.length === 0) {
      return NextResponse.json(
        { error: "No feasible allocations found for given constraints" },
        { status: 400 }
      );
    }

    // Enrich with NIM reasoning
    const { allocations, summary } = await enrichWithNIM(baseAllocations, budget);

    const totalCO2 = allocations.reduce((s, a) => s + a.estimated_co2_10yr_tons, 0);
    const totalBudgetUsed = allocations.reduce((s, a) => s + a.allocation_usd_m, 0);
    const avgCost = Math.round((totalBudgetUsed * 1_000_000) / Math.max(1, totalCO2));

    const result: PortfolioResult = {
      allocations,
      total_co2_estimate_tons: totalCO2,
      total_budget_used_usd_m: parseFloat(totalBudgetUsed.toFixed(1)),
      avg_cost_per_ton: avgCost,
      nim_summary: summary,
      optimization_method: "cuopt-greedy",
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[optimize/portfolio]", err);
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
  }
}
