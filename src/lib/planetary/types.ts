// ─── Intervention ───────────────────────────────────────────────────────────

export type InterventionType =
  | "reforestation"
  | "solar_farm"
  | "wind_farm"
  | "carbon_credit"
  | "mangrove_restoration"
  | "direct_air_capture"
  | "ocean_carbon"
  | "regenerative_agriculture"
  | "peatland_restoration";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ClimateIntervention {
  id: string;
  type: InterventionType;
  name: string;
  description: string;
  region: string;
  country: string;
  coordinates: Coordinates;
  area_hectares?: number;
  capacity_mw?: number;
  investment_usd_m: number;
  /** Annual CO₂ reduction/sequestration claimed by project proponent (tons) */
  claimed_co2_annual?: number;
  /** Total lifetime CO₂ claimed */
  claimed_co2_lifetime?: number;
  timeline_years: number;
  certifications: string[];
  proponent?: string;
  created_at: string;
}

// ─── Simulation Pipeline Stages ─────────────────────────────────────────────

export type SimulationStage =
  | "idle"
  | "fetching_baseline"
  | "running_nim"
  | "running_cosmos"
  | "running_cuopt"
  | "scoring"
  | "complete"
  | "error";

export interface StageStatus {
  stage: SimulationStage;
  label: string;
  model?: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

// ─── Yearly Metrics ──────────────────────────────────────────────────────────

export interface YearlyMetric {
  year: number; // 1-10
  co2_sequestered_tons: number;
  co2_avoided_tons: number;
  cumulative_co2_tons: number;
  temperature_delta_c: number;
  precipitation_delta_mm: number;
  ecosystem_health: number; // 0-100
  biodiversity_index: number; // 0-100
  land_cover_change_pct: number; // % of intervention area showing expected change
}

// ─── Risk Factors ────────────────────────────────────────────────────────────

export type RiskCategory =
  | "physical"
  | "policy"
  | "social"
  | "financial"
  | "permanence"
  | "methodology";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  id: string;
  category: RiskCategory;
  name: string;
  severity: RiskSeverity;
  probability: number; // 0-1
  description: string;
  mitigation?: string;
}

// ─── Optimal Placement (cuOpt) ───────────────────────────────────────────────

export interface OptimalZone {
  id: string;
  coordinates: Coordinates;
  area_hectares: number;
  priority_rank: number; // 1 = highest priority
  impact_multiplier: number; // vs. baseline (1.0 = same, 1.5 = 50% better)
  reasons: string[];
}

export interface OptimizationResult {
  zones: OptimalZone[];
  total_area_hectares: number;
  estimated_impact_gain_pct: number; // % improvement vs. random placement
  vs_suboptimal_co2_gain_tons: number;
  model: "nvidia-cuopt";
  confidence: number;
}

// ─── NVIDIA Model Outputs ────────────────────────────────────────────────────

export interface NimClimateAnalysis {
  yearly_projections: YearlyMetric[];
  key_drivers: string[];
  comparable_projects: ComparableProject[];
  confidence_pct: number;
  model_used: string;
  tokens_used?: number;
}

export interface CosmosWorldState {
  world_state_id: string;
  year_snapshots: {
    year: number;
    description: string;
    ecosystem_state: string;
    atmospheric_co2_ppm: number;
    albedo_change: number;
    surface_temp_delta: number;
  }[];
  physical_model: string;
  simulation_fidelity: "low" | "medium" | "high";
}

// ─── Claim Verification ──────────────────────────────────────────────────────

export type GreenwashingRisk = "none" | "low" | "moderate" | "high" | "severe";

export interface ClaimVerification {
  claimed_annual_co2_tons: number;
  simulated_annual_co2_tons: number;
  accuracy_ratio: number; // simulated / claimed — <1 means overclaiming
  greenwashing_risk: GreenwashingRisk;
  discrepancy_pct: number; // how much claimed exceeds simulated, %
  evidence: string[];
  cala_sources: CalaSource[];
}

export interface CalaSource {
  document: string;
  snippet: string;
  url?: string;
}

// ─── Impact Score ────────────────────────────────────────────────────────────

export type ScoreTier =
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "amber"
  | "red";

export interface ScoreBreakdown {
  carbon_effectiveness: number; // 0-30
  additionality: number; // 0-20
  permanence: number; // 0-20
  biodiversity: number; // 0-15
  community_benefit: number; // 0-10
  verification_quality: number; // 0-5
  total: number; // 0-100
}

export interface ComparableProject {
  name: string;
  type: InterventionType;
  location: string;
  impact_score: number;
  co2_annual_tons: number;
  investment_usd_m: number;
  cost_per_ton_usd: number;
}

// ─── Full Simulation Result ───────────────────────────────────────────────────

export type SimulationStatus =
  | "pending"
  | "running"
  | "complete"
  | "error";

export interface SimulationResult {
  id: string;
  intervention_id: string;
  status: SimulationStatus;
  current_stage: SimulationStage;
  stages_log: StageStatus[];
  created_at: string;
  completed_at?: string;
  error?: string;

  // Core outputs
  planetary_impact_score: number; // 0-100
  score_tier: ScoreTier;
  score_breakdown: ScoreBreakdown;

  // 10-year trajectory
  yearly_metrics: YearlyMetric[];

  // Key aggregates
  total_co2_10yr_tons: number;
  avoided_co2_10yr_tons: number;
  cost_per_ton_usd: number;
  net_benefit_usd_m: number;

  // Claim verification
  claim_verification?: ClaimVerification;

  // NVIDIA outputs
  nim_analysis: NimClimateAnalysis;
  cosmos_world: CosmosWorldState;
  optimization: OptimizationResult;

  // Risk
  risks: RiskFactor[];
  overall_risk: RiskSeverity;

  // Benchmarks
  comparable_projects: ComparableProject[];
  vs_category_avg_pct: number; // % above/below category average score
}

// ─── Store / UI State ────────────────────────────────────────────────────────

export interface PlanetaryStore {
  interventions: Record<string, ClimateIntervention>;
  simulations: Record<string, SimulationResult>;
  activeSimulationId: string | null;

  setActiveSimulation: (id: string) => void;
  upsertIntervention: (i: ClimateIntervention) => void;
  upsertSimulation: (s: SimulationResult) => void;
}
