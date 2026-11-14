import { NextResponse } from "next/server";
import { DEMO_INTERVENTIONS, DEMO_SIMULATIONS } from "@/lib/planetary/demos";

/** Returns the list of demo/example projects with their simulation summaries */
export async function GET() {
  const projects = DEMO_INTERVENTIONS.map((intervention) => {
    const sim = DEMO_SIMULATIONS.find(
      (s) => s.intervention_id === intervention.id
    );
    return {
      intervention,
      simulation_id: sim?.id ?? null,
      score: sim?.planetary_impact_score ?? null,
      tier: sim?.score_tier ?? null,
      greenwashing_risk: sim?.claim_verification?.greenwashing_risk ?? null,
      total_co2_10yr: sim?.total_co2_10yr_tons ?? null,
    };
  });

  return NextResponse.json({ projects });
}
