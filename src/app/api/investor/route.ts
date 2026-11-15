/**
 * POST /api/investor
 *
 * Generates Nemotron-powered investor intelligence for a completed simulation.
 *
 * Request body: { intervention: ClimateIntervention, sim: SimSummary }
 * Response:     { intelligence: InvestorIntelligence }
 */

import { NextResponse } from "next/server";
import { runInvestorAnalysis } from "@/lib/nvidia/investor";
import type { ClimateIntervention } from "@/lib/planetary/types";
import type { SimSummary } from "@/lib/nvidia/investor";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { intervention, sim } = body as {
      intervention: ClimateIntervention;
      sim: SimSummary;
    };

    if (!intervention?.id || !intervention?.type || typeof sim?.planetary_impact_score !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: intervention.id, intervention.type, sim.planetary_impact_score" },
        { status: 400 }
      );
    }

    const intelligence = await runInvestorAnalysis(intervention, sim);

    return NextResponse.json({ intelligence });
  } catch (err) {
    console.error("[POST /api/investor]", err);
    return NextResponse.json(
      { error: "Investor analysis failed" },
      { status: 500 }
    );
  }
}

export const maxDuration = 30;
