/**
 * POST /api/satellite
 *
 * Runs satellite ground-truth verification for a given climate intervention.
 * Returns a SatelliteVerification object with NASA GIBS tile URLs and
 * NIM-generated NDVI analysis.
 *
 * Request body: ClimateIntervention (full object)
 * Response:     { satellite: SatelliteVerification }
 */

import { NextResponse } from "next/server";
import { runSatelliteVerification } from "@/lib/satellite";
import type { ClimateIntervention, InterventionType } from "@/lib/planetary/types";

const VALID_TYPES = new Set<InterventionType>([
  "reforestation", "solar_farm", "wind_farm", "carbon_credit",
  "mangrove_restoration", "direct_air_capture", "ocean_carbon",
  "regenerative_agriculture", "peatland_restoration",
]);

export async function POST(req: Request) {
  try {
    const intervention: ClimateIntervention = await req.json();

    if (
      !intervention?.id ||
      !intervention?.type ||
      !intervention?.coordinates
    ) {
      return NextResponse.json(
        { error: "Missing required fields: id, type, coordinates" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.has(intervention.type)) {
      return NextResponse.json(
        { error: `Invalid intervention type: ${intervention.type}` },
        { status: 400 }
      );
    }

    if (
      typeof intervention.coordinates.lat !== "number" ||
      typeof intervention.coordinates.lng !== "number" ||
      !Number.isFinite(intervention.coordinates.lat) ||
      !Number.isFinite(intervention.coordinates.lng)
    ) {
      return NextResponse.json(
        { error: "coordinates.lat and coordinates.lng must be finite numbers" },
        { status: 400 }
      );
    }

    const satellite = await runSatelliteVerification(intervention);

    return NextResponse.json({ satellite });
  } catch (err) {
    console.error("[POST /api/satellite]", err);
    return NextResponse.json(
      { error: "Satellite verification failed" },
      { status: 500 }
    );
  }
}

export const maxDuration = 30;
