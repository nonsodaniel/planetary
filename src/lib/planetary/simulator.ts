/**
 * Planetary Simulation Pipeline
 *
 * Orchestrates the full 5-stage simulation:
 *   1. Fetch baseline data (Cala)
 *   2. Run NIM climate analysis (NVIDIA NIM)
 *   3. Run Cosmos world simulation (NVIDIA Cosmos)
 *   4. Run cuOpt placement optimization (NVIDIA cuOpt)
 *   5. Compute Planetary Impact Score + claim verification
 *
 * Stores results in an in-memory map keyed by simulation ID.
 * API routes poll this map for status updates.
 */

import { runNimAnalysis } from "../nvidia/nim";
import { runCosmosSimulation } from "../nvidia/cosmos";
import { runCuOptOptimization } from "../nvidia/cuopt";
import { runNemotronConfidence, runNemotronGreenwashingAnalysis } from "../nvidia/nemotron";
import { runSatelliteVerification } from "../satellite";
import { fetchProjectBaseline, fetchClaimEvidence } from "../cala/climate";
import {
  computePlanetaryScore,
  buildClaimVerification,
  generateRisks,
} from "./scoring";
import type {
  ClimateIntervention,
  SimulationResult,
  SimulationStage,
  StageStatus,
  ClaimVerification,
  NimClimateAnalysis,
} from "./types";
import { makeId } from "../utils";

// In-memory simulation store (server-side)
const simulations = new Map<string, SimulationResult>();

export function getSimulation(id: string): SimulationResult | undefined {
  return simulations.get(id);
}

export function listSimulations(): SimulationResult[] {
  return Array.from(simulations.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function updateStage(
  sim: SimulationResult,
  stage: SimulationStage,
  model?: string
): void {
  sim.current_stage = stage;

  // Close previous stage
  const prev = sim.stages_log[sim.stages_log.length - 1];
  if (prev && !prev.completed_at) {
    prev.completed_at = new Date().toISOString();
  }

  // Open new stage
  if (stage !== "complete" && stage !== "error") {
    sim.stages_log.push({
      stage,
      label: stageLabel(stage),
      model,
      started_at: new Date().toISOString(),
    });
  }

  simulations.set(sim.id, { ...sim });
}

function stageLabel(stage: SimulationStage): string {
  const labels: Record<SimulationStage, string> = {
    idle: "Idle",
    fetching_baseline: "Fetching Emissions Baseline via Cala",
    running_nim: "NVIDIA NIM — Climate Physics Inference",
    running_cosmos: "NVIDIA Cosmos — World State Simulation",
    running_cuopt: "NVIDIA cuOpt — Placement Optimization",
    scoring: "Computing Planetary Impact Score",
    complete: "Simulation Complete",
    error: "Simulation Error",
  };
  return labels[stage];
}

/** Start a new simulation and run it in the background */
export async function startSimulation(
  intervention: ClimateIntervention
): Promise<SimulationResult> {
  const simId = makeId("sim");
  const now = new Date().toISOString();

  // Create initial simulation record
  const sim: SimulationResult = {
    id: simId,
    intervention_id: intervention.id,
    status: "running",
    current_stage: "idle",
    stages_log: [],
    created_at: now,
    planetary_impact_score: 0,
    score_tier: "amber",
    score_breakdown: {
      carbon_effectiveness: 0,
      additionality: 0,
      permanence: 0,
      biodiversity: 0,
      community_benefit: 0,
      verification_quality: 0,
      total: 0,
    },
    yearly_metrics: [],
    total_co2_10yr_tons: 0,
    avoided_co2_10yr_tons: 0,
    cost_per_ton_usd: 0,
    net_benefit_usd_m: 0,
    nim_analysis: {
      yearly_projections: [],
      key_drivers: [],
      comparable_projects: [],
      confidence_pct: 0,
      model_used: "",
    },
    cosmos_world: {
      world_state_id: "",
      year_snapshots: [],
      physical_model: "",
      simulation_fidelity: "low",
    },
    optimization: {
      zones: [],
      total_area_hectares: 0,
      estimated_impact_gain_pct: 0,
      vs_suboptimal_co2_gain_tons: 0,
      model: "nvidia-cuopt",
      confidence: 0,
    },
    risks: [],
    overall_risk: "low",
    comparable_projects: [],
    vs_category_avg_pct: 0,
  };

  simulations.set(simId, sim);

  // Run pipeline asynchronously
  runPipeline(sim, intervention).catch((err) => {
    console.error("[Simulator] Pipeline error:", err);
    const current = simulations.get(simId);
    if (current) {
      simulations.set(simId, {
        ...current,
        status: "error",
        current_stage: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return sim;
}

/** Full simulation pipeline */
async function runPipeline(
  sim: SimulationResult,
  intervention: ClimateIntervention
): Promise<void> {
  // Stage 1: Fetch Cala baseline
  updateStage(sim, "fetching_baseline", "Cala Knowledge API");

  const baseline = await fetchProjectBaseline(
    intervention.type,
    intervention.region,
    intervention.country
  );

  // Enrich intervention with baseline data if not already set
  if (!intervention.claimed_co2_annual && baseline.comparable_co2_annual_tons) {
    intervention = {
      ...intervention,
      claimed_co2_annual: baseline.comparable_co2_annual_tons,
    };
  }

  // Stage 2: NIM climate analysis
  updateStage(sim, "running_nim", "NVIDIA NIM / meta/llama-3.3-70b-instruct");

  const nimAnalysis = await runNimAnalysis(intervention);

  // Stage 3: Cosmos world simulation
  updateStage(sim, "running_cosmos", "NVIDIA Cosmos World Foundation Model");

  const avgAnnualCO2 =
    nimAnalysis.yearly_projections.reduce(
      (s, y) => s + y.co2_sequestered_tons + y.co2_avoided_tons,
      0
    ) / Math.max(1, nimAnalysis.yearly_projections.length);

  const cosmosWorld = await runCosmosSimulation(intervention, avgAnnualCO2);

  // Stage 4: cuOpt optimization
  updateStage(sim, "running_cuopt", "NVIDIA cuOpt");

  const optimization = await runCuOptOptimization(intervention);

  // Stage 5: Score + verify
  updateStage(sim, "scoring", "Planetary Impact Engine");

  const yearly = nimAnalysis.yearly_projections;
  const risks = generateRisks(intervention, yearly);
  const { breakdown, tier } = computePlanetaryScore(intervention, yearly, risks);

  // Aggregate metrics
  const totalSeq = yearly.reduce((s, y) => s + y.co2_sequestered_tons, 0);
  const totalAvoided = yearly.reduce((s, y) => s + y.co2_avoided_tons, 0);
  const totalCO2 = totalSeq + totalAvoided;
  const costPerTon =
    totalCO2 > 0 ? (intervention.investment_usd_m * 1_000_000) / totalCO2 : 0;

  // Carbon price @ $50/ton social cost
  const netBenefit =
    (totalCO2 * 50) / 1_000_000 - intervention.investment_usd_m;

  // Claim verification
  let claimVerification;
  if (intervention.claimed_co2_annual) {
    const simulatedAnnual =
      yearly.reduce((s, y) => s + y.co2_sequestered_tons + y.co2_avoided_tons, 0) /
      Math.max(1, yearly.length);

    const evidence = await fetchClaimEvidence(
      intervention.name,
      intervention.claimed_co2_annual,
      intervention.type
    );

    claimVerification = buildClaimVerification(
      intervention.claimed_co2_annual,
      simulatedAnnual,
      evidence.evidence,
      evidence.sources
    );
  }

  // Overall risk level
  const criticalRisks = risks.filter((r) => r.severity === "critical").length;
  const highRisks = risks.filter((r) => r.severity === "high").length;
  const overallRisk =
    criticalRisks > 0
      ? "critical"
      : highRisks >= 2
      ? "high"
      : highRisks === 1
      ? "medium"
      : "low";

  // Category average comparison
  const categoryAvgScore = getCategoryAvgScore(intervention.type);
  const vsCategoryAvg = breakdown.total - categoryAvgScore;

  // Finalize
  const finalSim: SimulationResult = {
    ...sim,
    status: "complete",
    current_stage: "complete",
    completed_at: new Date().toISOString(),
    planetary_impact_score: breakdown.total,
    score_tier: tier,
    score_breakdown: breakdown,
    yearly_metrics: yearly,
    total_co2_10yr_tons: totalCO2,
    avoided_co2_10yr_tons: totalAvoided,
    cost_per_ton_usd: parseFloat(costPerTon.toFixed(2)),
    net_benefit_usd_m: parseFloat(netBenefit.toFixed(2)),
    claim_verification: claimVerification,
    nim_analysis: nimAnalysis,
    cosmos_world: cosmosWorld,
    optimization,
    risks,
    overall_risk: overallRisk,
    comparable_projects: nimAnalysis.comparable_projects,
    vs_category_avg_pct: parseFloat(vsCategoryAvg.toFixed(1)),
  };

  // Close scoring stage
  const lastStage = finalSim.stages_log[finalSim.stages_log.length - 1];
  if (lastStage && !lastStage.completed_at) {
    lastStage.completed_at = new Date().toISOString();
  }

  simulations.set(sim.id, finalSim);

  // Kick off Nemotron enrichment first, then satellite sequentially so that
  // satellite always reads the already-patched map entry — eliminates the
  // last-write-wins race condition when both would spread from a stale snapshot.
  enrichWithNemotron(finalSim, intervention, nimAnalysis, claimVerification)
    .catch((err) => console.warn("[Nemotron] Background enrichment failed:", err))
    .finally(() => {
      enrichWithSatellite(finalSim, intervention).catch(
        (err) => console.warn("[Satellite] Background enrichment failed:", err)
      );
    });
}

/**
 * Asynchronously enriches a completed simulation with Nemotron outputs.
 * Runs after the pipeline is marked complete so the base result is always
 * available regardless of Nemotron API availability.
 */
async function enrichWithNemotron(
  sim: SimulationResult,
  intervention: ClimateIntervention,
  nimAnalysis: NimClimateAnalysis,
  claimVerification: ClaimVerification | undefined
): Promise<void> {
  // Run confidence scoring and greenwashing analysis in parallel
  const shouldRunGreenwashing =
    claimVerification !== undefined &&
    (claimVerification.greenwashing_risk === "moderate" ||
      claimVerification.greenwashing_risk === "high" ||
      claimVerification.greenwashing_risk === "severe");

  const [confidenceResult, greenwashingResult] = await Promise.allSettled([
    runNemotronConfidence(intervention, nimAnalysis),
    shouldRunGreenwashing
      ? runNemotronGreenwashingAnalysis(intervention, claimVerification!)
      : Promise.resolve(undefined),
  ]);

  // Re-read current state — another request might have updated it
  const current = simulations.get(sim.id);
  if (!current || current.status !== "complete") return;

  const patch: Partial<SimulationResult> = {};

  if (confidenceResult.status === "fulfilled") {
    patch.nemotron_confidence = confidenceResult.value;
  }

  if (
    greenwashingResult.status === "fulfilled" &&
    greenwashingResult.value !== undefined &&
    current.claim_verification
  ) {
    patch.claim_verification = {
      ...current.claim_verification,
      nemotron_analysis: greenwashingResult.value,
    };
  }

  if (Object.keys(patch).length > 0) {
    simulations.set(sim.id, { ...current, ...patch });
  }
}

/**
 * Asynchronously enriches a completed simulation with satellite ground-truth data.
 * Runs after the pipeline is marked complete so it never delays the base result.
 */
async function enrichWithSatellite(
  sim: SimulationResult,
  intervention: ClimateIntervention
): Promise<void> {
  const satelliteVerification = await runSatelliteVerification(intervention);

  // Re-read state — another enrichment may have patched it in the meantime
  const current = simulations.get(sim.id);
  if (!current || current.status !== "complete") return;

  simulations.set(sim.id, { ...current, satellite_verification: satelliteVerification });
}

function getCategoryAvgScore(type: string): number {
  const averages: Record<string, number> = {
    reforestation: 65,
    mangrove_restoration: 72,
    peatland_restoration: 69,
    solar_farm: 74,
    wind_farm: 73,
    carbon_credit: 48,
    direct_air_capture: 76,
    ocean_carbon: 61,
    regenerative_agriculture: 63,
  };
  return averages[type] ?? 62;
}
