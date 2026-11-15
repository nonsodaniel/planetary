/**
 * POST /api/generate-projects
 *
 * Uses Nemotron 340B to generate realistic synthetic climate intervention
 * specifications. Returns an array of ClimateIntervention objects ready to
 * be fed into POST /api/simulate.
 *
 * Request body:
 *   count   — number of projects to generate (1–20, default 5)
 *   types   — optional array of InterventionType to restrict generation
 *
 * Response:
 *   { projects: GeneratedProject[] }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSyntheticProjects } from "@/lib/nvidia/nemotron";
import type { InterventionType } from "@/lib/planetary/types";

const VALID_TYPES: InterventionType[] = [
  "reforestation",
  "solar_farm",
  "wind_farm",
  "carbon_credit",
  "mangrove_restoration",
  "direct_air_capture",
  "ocean_carbon",
  "regenerative_agriculture",
  "peatland_restoration",
];

const RequestSchema = z.object({
  count: z.number().int().min(1).max(20).default(5),
  types: z
    .array(z.enum(VALID_TYPES as [InterventionType, ...InterventionType[]]))
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { count, types } = parsed.data;

    const projects = await generateSyntheticProjects(count, types);

    return NextResponse.json({ projects, count: projects.length });
  } catch (err) {
    console.error("[POST /api/generate-projects]", err);
    return NextResponse.json(
      { error: "Failed to generate projects" },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
