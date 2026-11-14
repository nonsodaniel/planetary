import { NextResponse } from "next/server";
import { getSimulation } from "@/lib/planetary/simulator";
import { getDemoSimulation } from "@/lib/planetary/demos";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check live simulation store first
  const sim = getSimulation(id);
  if (sim) {
    return NextResponse.json(sim);
  }

  // Fall back to demo simulations
  // Demo sim IDs: demo_sim_congo, demo_sim_sahara, demo_sim_kariba
  const demoInterventionIds = {
    "demo_sim_congo": "demo_congo",
    "demo_sim_sahara": "demo_sahara",
    "demo_sim_kariba": "demo_kariba",
  };

  const intId = demoInterventionIds[id as keyof typeof demoInterventionIds];
  if (intId) {
    const demo = getDemoSimulation(intId);
    if (demo) return NextResponse.json(demo);
  }

  return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
}

export const maxDuration = 10;
