/**
 * POST /api/scan
 *
 * Greenwashing Scanner powered by Context.dev.
 * Takes a Verra project ID, registry URL, or project name and returns
 * a structured ClimateIntervention extracted from live registry data.
 */

import { NextResponse } from "next/server";
import {
  contextSearch,
  contextScrapeJSON,
  isContextDevConfigured,
} from "@/lib/context/client";
import type { ClimateIntervention, InterventionType } from "@/lib/planetary/types";
import { makeId } from "@/lib/utils";

// ─── JSON schema for registry extraction ─────────────────────────────────────

const PROJECT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Full official project name" },
    proponent: {
      type: "string",
      description: "Project developer, owner, or proponent organization",
    },
    country: { type: "string", description: "Country where the project is located" },
    region: {
      type: "string",
      description: "Region, province, state or area within the country",
    },
    project_type: {
      type: "string",
      description:
        "Type of climate project: REDD+, avoided deforestation, reforestation, afforestation, solar, wind, peatland, mangrove, direct air capture, regenerative agriculture, or other",
    },
    area_hectares: {
      type: "number",
      description: "Project area in hectares if applicable",
    },
    claimed_co2_annual: {
      type: "number",
      description:
        "Annual CO₂ reduction or sequestration claimed by the project (tons per year). Look for 'estimated annual emission reductions' or 'VCUs issued per year'.",
    },
    claimed_co2_lifetime: {
      type: "number",
      description: "Total lifetime CO₂ credits or reductions claimed (tons)",
    },
    certifications: {
      type: "array",
      items: { type: "string" },
      description: "Standards and certifications: VCS, Verra, Gold Standard, CCBA, Plan Vivo, etc.",
    },
    investment_usd_m: {
      type: "number",
      description: "Project investment, funding, or financial value in millions of USD. Estimate if not stated.",
    },
    latitude: {
      type: "number",
      description: "Approximate latitude of the project location",
    },
    longitude: {
      type: "number",
      description: "Approximate longitude of the project location",
    },
    description: {
      type: "string",
      description: "2–3 sentence description of the project, its goals, and methodology",
    },
    timeline_years: {
      type: "number",
      description: "Project crediting period or expected duration in years",
    },
  },
};

const EXTRACTION_INSTRUCTIONS = `
Extract climate project data from this carbon registry page.
Focus on: project name, country, region, type (REDD+/reforestation/solar/wind/etc.),
hectares, annual CO2 credits/reductions, total CO2, certifications, timeline, and location coordinates.
If a value is not explicitly stated, estimate it from context (e.g. typical project investment for the type/size).
For REDD+ / avoided deforestation projects, classify as carbon_credit.
Return numbers as plain numbers without units.
`.trim();

// ─── Type mapping ─────────────────────────────────────────────────────────────

function mapProjectType(raw: string): InterventionType {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("redd") || s.includes("avoided deforestation")) return "carbon_credit";
  if (s.includes("mangrove")) return "mangrove_restoration";
  if (s.includes("peatland") || s.includes("peat")) return "peatland_restoration";
  if (s.includes("solar") || s.includes("photovoltaic") || s.includes("pv")) return "solar_farm";
  if (s.includes("wind")) return "wind_farm";
  if (s.includes("direct air") || s.includes("dac") || s.includes("ccs")) return "direct_air_capture";
  if (s.includes("ocean") || s.includes("blue carbon") || s.includes("seagrass") || s.includes("kelp")) return "ocean_carbon";
  if (s.includes("regenerative") || s.includes("agriculture") || s.includes("soil carbon") || s.includes("agroforestry")) return "regenerative_agriculture";
  if (s.includes("reforest") || s.includes("afforest") || s.includes("forest") || s.includes("tree")) return "reforestation";
  return "carbon_credit";
}

// ─── URL resolution ───────────────────────────────────────────────────────────

function resolveToUrl(query: string): string | null {
  const q = query.trim();

  // Already a URL
  if (q.startsWith("http://") || q.startsWith("https://")) return q;

  // Verra VCS ID: "VCS612", "VCS 612", "612", "1234"
  const vcsFull = q.match(/^(?:VCS\s*)?(\d+)$/i);
  if (vcsFull) {
    return `https://registry.verra.org/app/projectDetail/VCS/${vcsFull[1]}`;
  }

  // Gold Standard: "GS123", "GS 123"
  const gsFull = q.match(/^GS\s*(\d+)$/i);
  if (gsFull) {
    return `https://registry.goldstandard.org/projects/details/${gsFull[1]}`;
  }

  // American Carbon Registry: "ACR123"
  const acrFull = q.match(/^ACR\s*(\d+)$/i);
  if (acrFull) {
    return `https://americancarbonregistry.org/carbon-accounting/standards-and-tools/american-carbon-registry-standard/acr-project/${acrFull[1]}`;
  }

  return null; // Will need to search
}

// ─── Mock fallback for known demo projects (no API key needed) ────────────────

const DEMO_SEEDS: Record<
  string,
  {
    name: string; country: string; region: string; type: InterventionType;
    area: number; co2Annual: number; investment: number;
    lat: number; lng: number; certs: string[];
    description: string; demoId: string;
  }
> = {
  kariba: {
    name: "Kariba REDD+ Forest Protection",
    country: "Zimbabwe",
    region: "Zambezi Valley",
    type: "carbon_credit",
    area: 785000,
    co2Annual: 4900000,
    investment: 60,
    lat: -16.5,
    lng: 28.5,
    certs: ["VCS"],
    description:
      "REDD+ project protecting 785,000 ha of forest in Zimbabwe's Zambezi Valley. Under investigation for systematic overcrediting based on inflated deforestation baselines. Issued ~96M carbon credits before suspension.",
    demoId: "demo_kariba",
  },
  congo: {
    name: "Congo Basin Reforestation Initiative",
    country: "Democratic Republic of Congo",
    region: "Congo Basin",
    type: "reforestation",
    area: 500000,
    co2Annual: 2000000,
    investment: 50,
    lat: -2.5,
    lng: 23.8,
    certs: ["VCS", "CCBA"],
    description:
      "Large-scale reforestation of degraded agricultural land across the Congo Basin, targeting 500,000 hectares with native species. World's second largest tropical forest ecosystem.",
    demoId: "demo_congo",
  },
  sahara: {
    name: "Saharan Solar Array — Tunisia 500MW",
    country: "Tunisia",
    region: "Southern Sahara",
    type: "solar_farm",
    area: 1200,
    co2Annual: 800000,
    investment: 200,
    lat: 33.2,
    lng: 9.1,
    certs: ["ISO 14064", "Gold Standard"],
    description:
      "500MW utility-scale bifacial solar farm in southern Tunisia with direct HVDC interconnect to European grid. Part of the DESERTEC initiative.",
    demoId: "demo_sahara",
  },
};

function matchDemo(query: string) {
  const q = query.toLowerCase().replace(/\s+/g, "");
  const qSpaced = query.toLowerCase();
  if (
    qSpaced.includes("kariba") ||
    q === "612" || q === "vcs612" || q === "vcs1455" ||
    (qSpaced.includes("redd") && qSpaced.includes("zimbab"))
  ) {
    return DEMO_SEEDS.kariba;
  }
  if (qSpaced.includes("congo") || (qSpaced.includes("reforestation") && qSpaced.includes("congo"))) {
    return DEMO_SEEDS.congo;
  }
  if (qSpaced.includes("sahara") || qSpaced.includes("saharan") || qSpaced.includes("tunisia") || qSpaced.includes("desertec")) {
    return DEMO_SEEDS.sahara;
  }
  return null;
}

// ─── Extracted data shape ─────────────────────────────────────────────────────

interface ExtractedProject {
  name?: string;
  proponent?: string;
  country?: string;
  region?: string;
  project_type?: string;
  area_hectares?: number;
  claimed_co2_annual?: number;
  claimed_co2_lifetime?: number;
  certifications?: string[];
  investment_usd_m?: number;
  latitude?: number;
  longitude?: number;
  description?: string;
  timeline_years?: number;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query: string = (body.query ?? "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // 1. Known demo projects — always use pre-computed data (accurate, instant)
    const demo = matchDemo(query);
    if (demo) {
      const intervention: ClimateIntervention = {
        id: makeId("scanned"),
        type: demo.type,
        name: demo.name,
        description: demo.description,
        region: demo.region,
        country: demo.country,
        coordinates: { lat: demo.lat, lng: demo.lng },
        area_hectares: demo.area,
        investment_usd_m: demo.investment,
        claimed_co2_annual: demo.co2Annual,
        timeline_years: 25,
        certifications: demo.certs,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({
        intervention,
        source_url: `https://registry.verra.org/app/search/VCS/All%20Projects`,
        source_title: demo.name,
        confidence: "high" as const,
        missing_fields: [],
        demo_id: demo.demoId,
        is_demo: true,
      });
    }

    // 2. Require Context.dev API key for live scanning of unknown projects
    if (!isContextDevConfigured()) {
      return NextResponse.json(
        {
          error:
            "CONTEXT_DEV_API_KEY not configured. Add it to .env.local to enable live registry scanning.",
        },
        { status: 503 }
      );
    }

    // 3. Resolve input to a registry URL
    let registryUrl = resolveToUrl(query);
    let sourceTitle: string | null = null;

    if (!registryUrl) {
      // Search for specific project pages (avoid registry homepages)
      const genericHosts = [
        "registry.verra.org/verra/public",
        "registry.verra.org/app/search",
        "goldstandard.org/projects/search",
        "americancarbonregistry.org",
      ];

      const isGeneric = (url: string) =>
        genericHosts.some((h) => url.includes(h)) &&
        !url.includes("projectDetail") &&
        !url.includes("/details/");

      // Try specific project search queries
      const searches = [
        `"${query}" carbon project projectDetail verra registry`,
        `"${query}" REDD+ carbon credits verra registry project detail`,
        `"${query}" carbon offset project verification credits`,
      ];

      for (const sq of searches) {
        const results = await contextSearch(sq, 5);
        const hit = results.find(
          (r) =>
            !isGeneric(r.url) &&
            (r.url.includes("verra") ||
              r.url.includes("goldstandard") ||
              r.url.includes("carbonregistry") ||
              r.url.includes("climate.mit") ||
              r.url.includes("project"))
        );
        if (hit) {
          registryUrl = hit.url;
          sourceTitle = hit.title;
          break;
        }
      }

      if (!registryUrl) {
        return NextResponse.json(
          { error: `No registry project page found for: "${query}". Try a Verra project URL or ID.` },
          { status: 404 }
        );
      }
    }

    // 4. Scrape + structured extract
    const { data, source_url, source_title } = await contextScrapeJSON<ExtractedProject>(
      registryUrl,
      PROJECT_SCHEMA,
      EXTRACTION_INSTRUCTIONS
    );

    if (!data || !data.name) {
      // Fallback: try demo match even with API key
      const demoFallback = matchDemo(query);
      if (demoFallback) {
        const intervention: ClimateIntervention = {
          id: makeId("scanned"),
          type: demoFallback.type,
          name: demoFallback.name,
          description: demoFallback.description,
          region: demoFallback.region,
          country: demoFallback.country,
          coordinates: { lat: demoFallback.lat, lng: demoFallback.lng },
          area_hectares: demoFallback.area,
          investment_usd_m: demoFallback.investment,
          claimed_co2_annual: demoFallback.co2Annual,
          timeline_years: 25,
          certifications: demoFallback.certs,
          created_at: new Date().toISOString(),
        };
        return NextResponse.json({
          intervention,
          source_url,
          source_title: source_title ?? demoFallback.name,
          confidence: "high" as const,
          missing_fields: [],
          demo_id: demoFallback.demoId,
        });
      }
      return NextResponse.json(
        { error: `Could not extract project data from: ${registryUrl}` },
        { status: 422 }
      );
    }

    // 5. Map to ClimateIntervention
    // Sanitize "null" strings from LLM extraction
    const clean = <T>(v: T | undefined | null): T | undefined => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === "string" && (v === "null" || v === "undefined" || v === "N/A")) return undefined;
      return v;
    };

    const country = clean(data.country);
    const region = clean(data.region);
    const co2Annual = clean(data.claimed_co2_annual);
    const lat = clean(data.latitude);
    const lng = clean(data.longitude);

    const missing: string[] = [];
    if (!country) missing.push("country");
    if (!region) missing.push("region");
    if (!co2Annual) missing.push("claimed_co2_annual");
    if (!lat || !lng) missing.push("coordinates");

    const intervention: ClimateIntervention = {
      id: makeId("scanned"),
      type: mapProjectType(data.project_type ?? ""),
      name: clean(data.name) ?? query,
      description: clean(data.description) ?? "",
      region: region ?? country ?? "",
      country: country ?? "",
      coordinates: {
        lat: lat ?? 0,
        lng: lng ?? 0,
      },
      ...(data.area_hectares ? { area_hectares: data.area_hectares } : {}),
      investment_usd_m: clean(data.investment_usd_m) ?? 50,
      ...(co2Annual ? { claimed_co2_annual: co2Annual } : {}),
      ...(clean(data.claimed_co2_lifetime) ? { claimed_co2_lifetime: data.claimed_co2_lifetime! } : {}),
      timeline_years: clean(data.timeline_years) ?? 25,
      certifications: (data.certifications ?? []).filter((c) => c && c !== "null"),
      proponent: clean(data.proponent),
      created_at: new Date().toISOString(),
    };

    const confidence =
      missing.length === 0 ? "high" : missing.length <= 2 ? "medium" : "low";

    return NextResponse.json({
      intervention,
      source_url,
      source_title: source_title ?? data.name ?? query,
      confidence,
      missing_fields: missing,
    });
  } catch (err) {
    console.error("[POST /api/scan]", err);
    const msg = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const maxDuration = 30;
