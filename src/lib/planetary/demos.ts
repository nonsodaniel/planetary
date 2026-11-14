/**
 * Pre-computed demo scenarios
 *
 * Three carefully crafted examples that showcase the full range of
 * Planetary's analysis — from greenwashing detection to genuine gold-tier projects.
 *
 * These work without any API keys and are immediately compelling for demos.
 */

import type { ClimateIntervention, SimulationResult } from "./types";

// ─── Demo Interventions ───────────────────────────────────────────────────────

export const DEMO_INTERVENTIONS: ClimateIntervention[] = [
  {
    id: "demo_congo",
    type: "reforestation",
    name: "Congo Basin Reforestation Initiative",
    description:
      "Large-scale reforestation of degraded agricultural land across the Congo Basin, targeting 500,000 hectares with native species mix. World's second largest tropical forest ecosystem.",
    region: "Congo Basin",
    country: "Democratic Republic of Congo",
    coordinates: { lat: -2.5, lng: 23.8 },
    area_hectares: 500000,
    investment_usd_m: 50,
    claimed_co2_annual: 2000000,
    claimed_co2_lifetime: 20000000,
    timeline_years: 25,
    certifications: ["VCS", "CCBA"],
    proponent: "Congo Forest Initiative",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo_sahara",
    type: "solar_farm",
    name: "Saharan Solar Array — Tunisia 500MW",
    description:
      "500MW utility-scale bifacial solar farm in southern Tunisia, with direct HVDC interconnect to European grid. Part of the DESERTEC initiative.",
    region: "Southern Sahara",
    country: "Tunisia",
    coordinates: { lat: 33.2, lng: 9.1 },
    area_hectares: 1200,
    capacity_mw: 500,
    investment_usd_m: 200,
    claimed_co2_annual: 800000,
    claimed_co2_lifetime: 20000000,
    timeline_years: 25,
    certifications: ["ISO 14064", "Gold Standard"],
    proponent: "DESERTEC Industrial Initiative",
    created_at: "2024-02-20T10:00:00Z",
  },
  {
    id: "demo_kariba",
    type: "carbon_credit",
    name: "Kariba REDD+ Forest Protection",
    description:
      "REDD+ project protecting 785,000 ha of forest in Zimbabwe's Zambezi Valley. Under investigation for systematic overcrediting based on inflated deforestation baselines.",
    region: "Zambezi Valley",
    country: "Zimbabwe",
    coordinates: { lat: -16.5, lng: 28.5 },
    area_hectares: 785000,
    investment_usd_m: 30,
    claimed_co2_annual: 4900000,
    claimed_co2_lifetime: 73500000,
    timeline_years: 15,
    certifications: ["VCS"],
    proponent: "South Pole Group",
    created_at: "2024-03-10T10:00:00Z",
  },
];

// ─── Demo Simulation Results ──────────────────────────────────────────────────

function makeCongoSimulation(): SimulationResult {
  const yearly = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const maturity = Math.min(1, 0.3 + 0.07 * year);
    const seq = Math.round(500000 * 5.5 * maturity * (1 + 0.03 * Math.sin(year)));
    const avoided = 0;
    return {
      year,
      co2_sequestered_tons: seq,
      co2_avoided_tons: avoided,
      cumulative_co2_tons: 0, // filled below
      temperature_delta_c: parseFloat((-0.001 * year * 0.4).toFixed(4)),
      precipitation_delta_mm: parseFloat((2.5 * Math.sin(year)).toFixed(1)),
      ecosystem_health: Math.round(Math.min(92, 42 + 5 * year)),
      biodiversity_index: Math.round(Math.min(88, 32 + 6 * year)),
      land_cover_change_pct: Math.round(Math.min(100, 10 + 9 * year)),
    };
  });

  let cum = 0;
  for (const y of yearly) {
    cum += y.co2_sequestered_tons + y.co2_avoided_tons;
    y.cumulative_co2_tons = cum;
  }

  const totalCO2 = cum;
  const avgAnnual = totalCO2 / 10;
  const claimed = 2000000;
  const ratio = avgAnnual / claimed;

  return {
    id: "demo_sim_congo",
    intervention_id: "demo_congo",
    status: "complete",
    current_stage: "complete",
    created_at: "2024-01-15T10:00:00Z",
    completed_at: "2024-01-15T10:03:42Z",
    stages_log: makeStageLogs(),
    planetary_impact_score: 72,
    score_tier: "gold",
    score_breakdown: {
      carbon_effectiveness: 20,
      additionality: 14,
      permanence: 12,
      biodiversity: 12,
      community_benefit: 8,
      verification_quality: 6,
      total: 72,
    },
    yearly_metrics: yearly,
    total_co2_10yr_tons: totalCO2,
    avoided_co2_10yr_tons: 0,
    cost_per_ton_usd: parseFloat(((50_000_000) / totalCO2).toFixed(2)),
    net_benefit_usd_m: parseFloat(((totalCO2 * 50) / 1_000_000 - 50).toFixed(2)),
    claim_verification: {
      claimed_annual_co2_tons: claimed,
      simulated_annual_co2_tons: Math.round(avgAnnual),
      accuracy_ratio: parseFloat(ratio.toFixed(3)),
      greenwashing_risk: "moderate",
      discrepancy_pct: parseFloat(((1 - ratio) * 100).toFixed(1)),
      evidence: [
        "Forest carbon accumulation in the Congo Basin is well-established at 4.8–6.2 tCO₂/ha/year at maturity (year 7+).",
        "Ramp-up period of 4–6 years means first-year sequestration is 25–35% of maximum capacity.",
        "The claimed 2M tCO₂/year assumes full immediate maturity — achievable in year 8–10, not year 1.",
        "Additionality confirmed: 94% of target area shows active deforestation pressure.",
      ],
      cala_sources: [
        {
          document: "Congo Basin Forest Carbon Stock Survey 2023",
          snippet: "Above-ground biomass carbon density in secondary forest: 85–145 tC/ha at year 10.",
        },
        {
          document: "IPCC AR6 Chapter 7 — Land-based Mitigation",
          snippet: "Tropical reforestation sequesters 3–8 tCO₂/ha/year depending on species mix and rainfall.",
        },
      ],
    },
    nim_analysis: {
      yearly_projections: yearly,
      key_drivers: [
        "Forest carbon accumulation rate governed by species mix (Acacia, Terminalia) and 1,400mm/year rainfall",
        "Soil organic carbon build-up adds 22% to above-ground biomass carbon by year 10",
        "Canopy closure accelerates from year 4–6, triggering rapid ecosystem restoration",
      ],
      comparable_projects: [
        { name: "Trees for the Future (Sahel)", type: "reforestation", location: "West Africa", impact_score: 68, co2_annual_tons: 480000, investment_usd_m: 45, cost_per_ton_usd: 93 },
        { name: "Alto Mayo Protected Forest", type: "reforestation", location: "Peru", impact_score: 71, co2_annual_tons: 920000, investment_usd_m: 80, cost_per_ton_usd: 87 },
        { name: "Rimba Raya Biodiversity Reserve", type: "reforestation", location: "Borneo", impact_score: 76, co2_annual_tons: 4700000, investment_usd_m: 300, cost_per_ton_usd: 63 },
      ],
      confidence_pct: 78,
      model_used: "NVIDIA NIM / meta/llama-3.3-70b-instruct + IPCC AR6 coefficients",
    },
    cosmos_world: {
      world_state_id: "cosmos_demo_congo",
      year_snapshots: [
        { year: 0, description: "Degraded grassland with fragmented secondary forest patches in the Congo Basin. Soil carbon depleted from 15 years of cassava agriculture. Sparse canopy cover <12%. Active deforestation pressure on 3 fronts from smallholder encroachment.", ecosystem_state: "Degraded", atmospheric_co2_ppm: 421.0, albedo_change: 0, surface_temp_delta: 0 },
        { year: 1, description: "Initial planting complete across 500,000 ha. 73% seedling establishment rate — above target. Pioneer species including Musanga cecropioides establishing first soil networks. Bare ground still 65% of area. First measurable organic matter inputs.", ecosystem_state: "Early Restoration", atmospheric_co2_ppm: 423.5, albedo_change: -0.008, surface_temp_delta: -0.02 },
        { year: 5, description: "Young forest establishing cohesive canopy (45–60% cover). Understory vegetation diversifying with 180+ species recorded. Soil organic matter increasing 0.28%/year. First elephant corridor movements recorded across restoration zone. Local temperature 0.35°C cooler than baseline.", ecosystem_state: "Establishing", atmospheric_co2_ppm: 431.2, albedo_change: -0.028, surface_temp_delta: -0.35 },
        { year: 10, description: "Maturing secondary forest with 72% canopy closure. Standing biomass of 95 tC/ha. 3.1× baseline biodiversity index. Established carbon sink drawing 6.1 tCO₂/ha/year. Watershed protection reducing downstream flooding by 28%. Community forest management delivering sustained employment.", ecosystem_state: "Mature Secondary Forest", atmospheric_co2_ppm: 441.8, albedo_change: -0.045, surface_temp_delta: -0.72 },
      ],
      physical_model: "NVIDIA Cosmos World Foundation Model v1.0",
      simulation_fidelity: "high",
    },
    optimization: {
      zones: [
        { id: "zone_1", coordinates: { lat: -2.2, lng: 23.5 }, area_hectares: 72000, priority_rank: 1, impact_multiplier: 1.42, reasons: ["Optimal rainfall 1,420mm/year", "Deep alluvial soils — highest carbon density potential", "Adjacent to existing forest seed source"] },
        { id: "zone_2", coordinates: { lat: -2.8, lng: 24.1 }, area_hectares: 68000, priority_rank: 2, impact_multiplier: 1.31, reasons: ["River terrace with seasonal flooding — natural reseeding", "Low deforestation pressure — high permanence score"] },
        { id: "zone_3", coordinates: { lat: -2.1, lng: 24.4 }, area_hectares: 64000, priority_rank: 3, impact_multiplier: 1.22, reasons: ["Connecting two existing forest fragments — high biodiversity value", "Community ownership model reduces social risk"] },
        { id: "zone_4", coordinates: { lat: -2.9, lng: 23.3 }, area_hectares: 61000, priority_rank: 4, impact_multiplier: 1.14, reasons: ["Moderate soil quality", "Accessible for monitoring — reduces MRV cost"] },
        { id: "zone_5", coordinates: { lat: -2.6, lng: 24.0 }, area_hectares: 58000, priority_rank: 5, impact_multiplier: 1.08, reasons: ["Buffer zone protection for primary forest", "Carbon accumulation slightly below average for region"] },
      ],
      total_area_hectares: 323000,
      estimated_impact_gain_pct: 24,
      vs_suboptimal_co2_gain_tons: 310000,
      model: "nvidia-cuopt",
      confidence: 82,
    },
    risks: [
      { id: "phys_fire", category: "physical", name: "Wildfire Reversal", severity: "medium", probability: 0.18, description: "Wildfire events can reverse years of carbon sequestration in days. Risk increasing with climate change.", mitigation: "Firebreaks, community fire management, buffer pool insurance" },
      { id: "perm_leakage", category: "permanence", name: "Carbon Leakage", severity: "high", probability: 0.25, description: "Deforestation pressure displaced to unprotected adjacent areas, reducing net impact.", mitigation: "Jurisdictional-scale accounting, nested REDD+ approach" },
      { id: "phys_drought", category: "physical", name: "Drought Stress", severity: "medium", probability: 0.22, description: "Increasing aridity in central Congo Basin threatens long-term productivity of young plantations.", mitigation: "Drought-resistant species selection, supplementary irrigation in establishment years" },
      { id: "soc_conflict", category: "social", name: "Land Rights Conflict", severity: "medium", probability: 0.12, description: "Disputed customary land tenure among 12 Congolese communities within project boundary.", mitigation: "FPIC process, community benefit sharing, independent grievance mechanism" },
    ],
    overall_risk: "medium",
    comparable_projects: [
      { name: "Trees for the Future (Sahel)", type: "reforestation", location: "West Africa", impact_score: 68, co2_annual_tons: 480000, investment_usd_m: 45, cost_per_ton_usd: 93 },
      { name: "Rimba Raya Biodiversity Reserve", type: "reforestation", location: "Borneo", impact_score: 76, co2_annual_tons: 4700000, investment_usd_m: 300, cost_per_ton_usd: 63 },
    ],
    vs_category_avg_pct: 7,
  };
}

function makeSaharaSimulation(): SimulationResult {
  const capacityMW = 500;
  const capacityFactor = 0.228;
  const gridEmissionFactor = 0.63; // kg CO2/kWh (MENA grid)

  const yearly = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const degradation = Math.pow(0.996, year); // 0.4%/year
    const annualGenMWh = capacityMW * capacityFactor * 8760 * degradation;
    const avoided = Math.round(annualGenMWh * gridEmissionFactor);
    return {
      year,
      co2_sequestered_tons: 0,
      co2_avoided_tons: avoided,
      cumulative_co2_tons: 0,
      temperature_delta_c: parseFloat((0.01 * year).toFixed(4)),
      precipitation_delta_mm: 0,
      ecosystem_health: 65,
      biodiversity_index: 45,
      land_cover_change_pct: 100,
    };
  });

  let cum = 0;
  for (const y of yearly) {
    cum += y.co2_avoided_tons;
    y.cumulative_co2_tons = cum;
  }

  const claimed = 800000;
  const avgAnnual = cum / 10;
  const ratio = avgAnnual / claimed;

  return {
    id: "demo_sim_sahara",
    intervention_id: "demo_sahara",
    status: "complete",
    current_stage: "complete",
    created_at: "2024-02-20T10:00:00Z",
    completed_at: "2024-02-20T10:04:11Z",
    stages_log: makeStageLogs(),
    planetary_impact_score: 85,
    score_tier: "gold",
    score_breakdown: {
      carbon_effectiveness: 26,
      additionality: 16,
      permanence: 17,
      biodiversity: 7,
      community_benefit: 4,
      verification_quality: 15,
      total: 85,
    },
    yearly_metrics: yearly,
    total_co2_10yr_tons: cum,
    avoided_co2_10yr_tons: cum,
    cost_per_ton_usd: parseFloat(((200_000_000) / cum).toFixed(2)),
    net_benefit_usd_m: parseFloat(((cum * 50) / 1_000_000 - 200).toFixed(2)),
    claim_verification: {
      claimed_annual_co2_tons: claimed,
      simulated_annual_co2_tons: Math.round(avgAnnual),
      accuracy_ratio: parseFloat(ratio.toFixed(3)),
      greenwashing_risk: "low",
      discrepancy_pct: parseFloat(((1 - ratio) * 100).toFixed(1)),
      evidence: [
        "Capacity factor of 22.8% confirmed by PVGIS irradiance data for Gafsa region (2,280 kWh/m²/year).",
        "Tunisian grid emission factor: 0.63 kg CO₂/kWh (IEA 2023) — conservative vs. 0.68 used in project claim.",
        "Bifacial panel gain of 8% factored in — slight overclaim in year 1 as actual is 9%.",
        "Gold Standard certification confirms independent annual MRV — high verification quality.",
      ],
      cala_sources: [
        { document: "IEA Africa Energy Outlook 2023", snippet: "MENA grid emission factors 2022: Tunisia 0.627 kg CO₂/kWh, Algeria 0.571 kg CO₂/kWh, Morocco 0.541 kg CO₂/kWh." },
        { document: "PVGIS EU Irradiance Database", snippet: "Annual global horizontal irradiance at 33.2°N, 9.1°E: 2,284 kWh/m²/year. Optimal tilt angle 32°." },
      ],
    },
    nim_analysis: {
      yearly_projections: yearly,
      key_drivers: [
        "Grid emission factor of 0.63 kg CO₂/kWh × annual generation determines avoided emissions",
        "Capacity factor 22.8% — consistent with PVGIS historical data for this latitude",
        "Panel efficiency degradation 0.4%/year — industry standard for Tier 1 bifacial modules",
      ],
      comparable_projects: [
        { name: "Noor Ouarzazate", type: "solar_farm", location: "Morocco", impact_score: 82, co2_annual_tons: 760000, investment_usd_m: 900, cost_per_ton_usd: 118 },
        { name: "Bhadla Solar Park", type: "solar_farm", location: "India", impact_score: 79, co2_annual_tons: 1900000, investment_usd_m: 1200, cost_per_ton_usd: 63 },
      ],
      confidence_pct: 91,
      model_used: "NVIDIA NIM / meta/llama-3.3-70b-instruct + IPCC AR6 + IEA emission factors",
    },
    cosmos_world: {
      world_state_id: "cosmos_demo_sahara",
      year_snapshots: [
        { year: 0, description: "Arid stony desert (reg) in southern Tunisia. Direct Normal Irradiance 2,284 kWh/m²/year. Sparse vegetation cover <5%. Land owned by STEG (Tunisian state utility). Grid currently 68% fossil gas dependent.", ecosystem_state: "Baseline Terrain", atmospheric_co2_ppm: 421.0, albedo_change: 0, surface_temp_delta: 0 },
        { year: 1, description: "500MW bifacial solar array operational. 2,208 single-axis tracker structures across 1,200 ha. First year generation 968 GWh. HVDC export to Sicily via 450km submarine cable live. Local employment: 420 construction workers, 85 permanent O&M staff.", ecosystem_state: "Full Operation", atmospheric_co2_ppm: 423.5, albedo_change: -0.04, surface_temp_delta: 0.012 },
        { year: 5, description: "5-year performance review: panels generating 97.6% of rated capacity. Automated soiling detection and cleaning system deployed. 7 families growing drought-resistant crops under agrivoltaic rows. Cumulative CO₂ displacement: 3.4M tons.", ecosystem_state: "Full Operation", atmospheric_co2_ppm: 433.5, albedo_change: -0.04, surface_temp_delta: 0.056 },
        { year: 10, description: "Ten-year milestone: cumulative 6.9M tons CO₂ avoided. Panel recycling programme initiated for first generation inverters. BESS expansion (200MWh) operational — smoothing export profile. Second 500MW phase under development 12km north-east.", ecosystem_state: "Long-Term Operation", atmospheric_co2_ppm: 445.0, albedo_change: -0.04, surface_temp_delta: 0.098 },
      ],
      physical_model: "NVIDIA Cosmos World Foundation Model v1.0",
      simulation_fidelity: "high",
    },
    optimization: {
      zones: [
        { id: "zone_1", coordinates: { lat: 33.4, lng: 9.3 }, area_hectares: 180, priority_rank: 1, impact_multiplier: 1.09, reasons: ["DNI 2,310 kWh/m²/year — 1.3% above site average", "Flat terrain — optimal single-axis tracker performance", "No transmission constraints"] },
        { id: "zone_2", coordinates: { lat: 33.2, lng: 9.1 }, area_hectares: 160, priority_rank: 2, impact_multiplier: 1.06, reasons: ["DNI at site average", "Infrastructure ready — reduces capex 4%"] },
        { id: "zone_3", coordinates: { lat: 33.0, lng: 8.9 }, area_hectares: 155, priority_rank: 3, impact_multiplier: 1.02, reasons: ["Slightly lower irradiance — good fallback zone"] },
      ],
      total_area_hectares: 495,
      estimated_impact_gain_pct: 6,
      vs_suboptimal_co2_gain_tons: 42000,
      model: "nvidia-cuopt",
      confidence: 94,
    },
    risks: [
      { id: "pol_curtailment", category: "policy", name: "Grid Curtailment", severity: "medium", probability: 0.15, description: "STEG grid constraints may force curtailment during low-demand periods, reducing actual CO₂ displacement.", mitigation: "BESS co-location, power purchase agreement with curtailment floor" },
      { id: "fin_opex", category: "financial", name: "Water Scarcity for Cleaning", severity: "low", probability: 0.08, description: "Dust soiling reduces output by 2-4%/month in Saharan conditions; cleaning requires water logistics.", mitigation: "Automated dry-cleaning robots already deployed — reduces water need 90%" },
    ],
    overall_risk: "low",
    comparable_projects: [
      { name: "Noor Ouarzazate", type: "solar_farm", location: "Morocco", impact_score: 82, co2_annual_tons: 760000, investment_usd_m: 900, cost_per_ton_usd: 118 },
    ],
    vs_category_avg_pct: 11,
  };
}

function makeKaribaSimulation(): SimulationResult {
  const yearly = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const effectiveness = 0.22; // 22% of claimed — severe overclaim
    const seq = Math.round(4900000 * effectiveness * (1 + 0.02 * Math.sin(year * 1.5)));
    return {
      year,
      co2_sequestered_tons: seq,
      co2_avoided_tons: 0,
      cumulative_co2_tons: 0,
      temperature_delta_c: parseFloat((-0.0004 * year).toFixed(4)),
      precipitation_delta_mm: 0,
      ecosystem_health: Math.round(55 + 1.5 * year),
      biodiversity_index: Math.round(50 + 2 * year),
      land_cover_change_pct: Math.round(70 + 2 * year),
    };
  });

  let cum = 0;
  for (const y of yearly) {
    cum += y.co2_sequestered_tons;
    y.cumulative_co2_tons = cum;
  }

  const claimed = 4900000;
  const avgAnnual = cum / 10;
  const ratio = avgAnnual / claimed;

  return {
    id: "demo_sim_kariba",
    intervention_id: "demo_kariba",
    status: "complete",
    current_stage: "complete",
    created_at: "2024-03-10T10:00:00Z",
    completed_at: "2024-03-10T10:05:22Z",
    stages_log: makeStageLogs(),
    planetary_impact_score: 32,
    score_tier: "red",
    score_breakdown: {
      carbon_effectiveness: 6,
      additionality: 5,
      permanence: 8,
      biodiversity: 7,
      community_benefit: 4,
      verification_quality: 2,
      total: 32,
    },
    yearly_metrics: yearly,
    total_co2_10yr_tons: cum,
    avoided_co2_10yr_tons: 0,
    cost_per_ton_usd: parseFloat(((30_000_000) / cum).toFixed(2)),
    net_benefit_usd_m: parseFloat(((cum * 50) / 1_000_000 - 30).toFixed(2)),
    claim_verification: {
      claimed_annual_co2_tons: claimed,
      simulated_annual_co2_tons: Math.round(avgAnnual),
      accuracy_ratio: parseFloat(ratio.toFixed(3)),
      greenwashing_risk: "severe",
      discrepancy_pct: parseFloat(((1 - ratio) * 100).toFixed(1)),
      evidence: [
        "Kariba used 2000–2007 baseline deforestation rates — 10× higher than actual 2008–2020 observed rates (Planet Labs).",
        "Independent CarbonPlan analysis: 4.5× overcrediting confirmed via satellite cross-validation.",
        "Zero-deforestation zones misclassified as 'at risk' — inflating counterfactual by 320%.",
        "South Pole Group withdrew as project developer in 2023 following Guardian investigation.",
      ],
      cala_sources: [
        { document: "Carbon Market Watch Investigation 2023", snippet: "Ghost Credits: The Carbon Offset Scandal. Kariba used wildly inflated baseline deforestation rate of 2.3%/year vs. observed 0.21%/year — a 10× inflation in counterfactual." },
        { document: "CarbonPlan REDD+ Database 2023", snippet: "Independent satellite analysis confirms: Kariba issued credits for 4,900,000 tCO₂/year when actual deforestation prevention measurable by satellite is approximately 1,050,000 tCO₂/year." },
        { document: "The Guardian 2023", snippet: "More than 90% of Verra's rainforest carbon offsets worthless. Kariba specifically identified as example of extreme overcrediting — buyers include major banks and corporations." },
      ],
    },
    nim_analysis: {
      yearly_projections: yearly,
      key_drivers: [
        "Forest in Zambezi Valley is NOT under meaningful deforestation pressure at claimed rate — actual rate 0.21% vs. 2.3% baseline used",
        "Additionality fundamentally compromised — forest was already protected under existing Zimbabwean law",
        "Leakage to surrounding unprotected areas estimated at 25–40% — further reducing net impact",
      ],
      comparable_projects: [
        { name: "Kasigau Corridor REDD+", type: "carbon_credit", location: "Kenya", impact_score: 73, co2_annual_tons: 450000, investment_usd_m: 35, cost_per_ton_usd: 78 },
        { name: "Tambopata-Bahuaja", type: "carbon_credit", location: "Peru", impact_score: 55, co2_annual_tons: 1200000, investment_usd_m: 60, cost_per_ton_usd: 50 },
      ],
      confidence_pct: 95,
      model_used: "NVIDIA NIM / meta/llama-3.3-70b-instruct + CarbonPlan satellite analysis + IPCC AR6",
    },
    cosmos_world: {
      world_state_id: "cosmos_demo_kariba",
      year_snapshots: [
        { year: 0, description: "Miombo woodland in Zambezi Valley. Forest cover stable at 91% over past decade per Sentinel-2 analysis. Deforestation pressure LOW — existing national park boundaries and community conservancy agreements already protect 78% of claimed area.", ecosystem_state: "Baseline Forest", atmospheric_co2_ppm: 421.0, albedo_change: 0, surface_temp_delta: 0 },
        { year: 1, description: "REDD+ monitoring infrastructure deployed. Community forest guards operational. Actual deforestation rate inside project: 0.21% — statistically indistinguishable from pre-project baseline of 0.19%. Carbon credits being issued against inflated counterfactual.", ecosystem_state: "Protection Active", atmospheric_co2_ppm: 423.5, albedo_change: -0.005, surface_temp_delta: -0.008 },
        { year: 5, description: "Satellite analysis: 97.1% forest cover maintained inside Kariba boundary — but this was already 95.8% before project. Net additionality of forest protection is demonstrably small. Credits continue to be sold to major corporate net-zero programs.", ecosystem_state: "Stable Conservation", atmospheric_co2_ppm: 433.4, albedo_change: -0.008, surface_temp_delta: -0.025 },
        { year: 10, description: "Investigation by Carbon Market Watch and Guardian exposes baseline manipulation. Verra initiates review. South Pole withdraws. Project suspended — 73.5M credits in market face retroactive invalidation. Corporate buyers facing accountability for fraudulent offsets.", ecosystem_state: "Long-Term Conservation", atmospheric_co2_ppm: 445.0, albedo_change: -0.009, surface_temp_delta: -0.038 },
      ],
      physical_model: "NVIDIA Cosmos World Foundation Model v1.0 + Planet Labs satellite integration",
      simulation_fidelity: "high",
    },
    optimization: {
      zones: [
        { id: "zone_1", coordinates: { lat: -16.2, lng: 28.3 }, area_hectares: 95000, priority_rank: 1, impact_multiplier: 1.18, reasons: ["Only zone with demonstrated active deforestation pressure", "Adjacent to agricultural frontier — genuine additionality"] },
        { id: "zone_2", coordinates: { lat: -16.8, lng: 28.7 }, area_hectares: 72000, priority_rank: 2, impact_multiplier: 1.06, reasons: ["Moderate pressure zone", "Community co-management reduces social risk"] },
      ],
      total_area_hectares: 167000,
      estimated_impact_gain_pct: 110,
      vs_suboptimal_co2_gain_tons: 490000,
      model: "nvidia-cuopt",
      confidence: 72,
    },
    risks: [
      { id: "meth_baseline", category: "methodology", name: "Inflated Deforestation Baseline", severity: "critical", probability: 0.95, description: "Kariba used 2000–2007 deforestation rate (2.3%/yr) for its 2008–2022 baseline — 10× the actual observed rate, fundamentally inflating all carbon accounting.", mitigation: "Rebaseline using satellite cross-validation; switch to dynamic baselines updated every 5 years" },
      { id: "perm_reversal", category: "permanence", name: "Credit Invalidation Risk", severity: "critical", probability: 0.75, description: "Following the 2023 investigation, 73.5M credits face retroactive review by Verra. Buyers exposed to reputational and financial liability.", mitigation: "Immediate disclosure to investors; seek alternative verified projects" },
      { id: "fin_reputation", category: "financial", name: "Developer Withdrawal", severity: "high", probability: 0.9, description: "South Pole Group has withdrawn as project developer, leaving unclear project management and monitoring continuity.", mitigation: "New developer engagement; independent verification by alternative registry" },
      { id: "soc_community", category: "social", name: "Community Benefit Failure", severity: "high", probability: 0.6, description: "Investigation found community payments significantly below contractual amounts; local buy-in eroding.", mitigation: "Independent community benefit audit; benefit-sharing restructuring" },
    ],
    overall_risk: "critical",
    comparable_projects: [
      { name: "Kasigau Corridor REDD+", type: "carbon_credit", location: "Kenya", impact_score: 73, co2_annual_tons: 450000, investment_usd_m: 35, cost_per_ton_usd: 78 },
    ],
    vs_category_avg_pct: -16,
  };
}

function makeStageLogs(): SimulationResult["stages_log"] {
  const base = new Date("2024-01-15T10:00:00Z").getTime();
  return [
    { stage: "fetching_baseline", label: "Fetching Emissions Baseline via Cala", model: "Cala Knowledge API", started_at: new Date(base).toISOString(), completed_at: new Date(base + 12000).toISOString() },
    { stage: "running_nim", label: "NVIDIA NIM — Climate Physics Inference", model: "meta/llama-3.3-70b-instruct", started_at: new Date(base + 12000).toISOString(), completed_at: new Date(base + 72000).toISOString() },
    { stage: "running_cosmos", label: "NVIDIA Cosmos — World State Simulation", model: "Cosmos World Foundation Model v1.0", started_at: new Date(base + 72000).toISOString(), completed_at: new Date(base + 155000).toISOString() },
    { stage: "running_cuopt", label: "NVIDIA cuOpt — Placement Optimization", model: "NVIDIA cuOpt", started_at: new Date(base + 155000).toISOString(), completed_at: new Date(base + 198000).toISOString() },
    { stage: "scoring", label: "Computing Planetary Impact Score", model: "Planetary Engine v1", started_at: new Date(base + 198000).toISOString(), completed_at: new Date(base + 222000).toISOString() },
  ];
}

export const DEMO_SIMULATIONS: SimulationResult[] = [
  makeCongoSimulation(),
  makeSaharaSimulation(),
  makeKaribaSimulation(),
];

export function getDemoSimulation(interventionId: string): SimulationResult | undefined {
  return DEMO_SIMULATIONS.find((s) => s.intervention_id === interventionId);
}

export function getDemoIntervention(id: string): ClimateIntervention | undefined {
  return DEMO_INTERVENTIONS.find((i) => i.id === id);
}
