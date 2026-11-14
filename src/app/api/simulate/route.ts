import { NextResponse } from "next/server";
import { startSimulation } from "@/lib/planetary/simulator";
import type { ClimateIntervention } from "@/lib/planetary/types";
import { makeId } from "@/lib/utils";
import { z } from "zod";

const InterventionSchema = z.object({
  type: z.enum([
    "reforestation", "solar_farm", "wind_farm", "carbon_credit",
    "mangrove_restoration", "direct_air_capture", "ocean_carbon",
    "regenerative_agriculture", "peatland_restoration",
  ]),
  name: z.string().min(3),
  description: z.string().default(""),
  region: z.string().min(2),
  country: z.string().min(2),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  area_hectares: z.number().positive().optional(),
  capacity_mw: z.number().positive().optional(),
  investment_usd_m: z.number().positive(),
  claimed_co2_annual: z.number().positive().optional(),
  claimed_co2_lifetime: z.number().positive().optional(),
  timeline_years: z.number().int().min(1).max(100).default(25),
  certifications: z.array(z.string()).default([]),
  proponent: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = InterventionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid intervention data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const intervention: ClimateIntervention = {
      ...parsed.data,
      id: makeId("int"),
      created_at: new Date().toISOString(),
    };

    const simulation = await startSimulation(intervention);

    return NextResponse.json({ simulation_id: simulation.id, intervention_id: intervention.id });
  } catch (err) {
    console.error("[POST /api/simulate]", err);
    return NextResponse.json(
      { error: "Failed to start simulation" },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
