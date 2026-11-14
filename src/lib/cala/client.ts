/**
 * Cala API Client
 *
 * Adapted from the Venus/Leadline codebase.
 * Used to fetch real climate project data, emissions baselines,
 * and cross-reference project claims with evidence.
 *
 * Endpoints:
 *  POST /v1/knowledge/query  — structured row results
 *  POST /v1/knowledge/search — sources behind claims
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CALA_BASE = "https://api.cala.ai";
const CACHE_DIR = join(process.cwd(), ".planetary-cache");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isCalaConfigured(): boolean {
  const key = process.env.CALA_API_KEY;
  return !!key && key.startsWith("clsk_");
}

function getCacheKey(endpoint: string, input: unknown): string {
  return createHash("sha1")
    .update(endpoint + JSON.stringify(input))
    .digest("hex");
}

function readCache<T>(key: string): T | null {
  try {
    const path = join(CACHE_DIR, `${key}.json`);
    if (!existsSync(path)) return null;
    const { at, data } = JSON.parse(readFileSync(path, "utf-8"));
    if (Date.now() - at > CACHE_TTL_MS) return null;
    return data as T;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: unknown): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(
      join(CACHE_DIR, `${key}.json`),
      JSON.stringify({ at: Date.now(), data }),
      "utf-8"
    );
  } catch {
    // ignore cache write errors
  }
}

export interface CalaQueryResult {
  rows: Record<string, string>[];
  columns: string[];
  question: string;
}

export interface CalaSearchResult {
  sources: {
    name: string;
    document: string;
    snippet: string;
    url?: string;
    confidence: number;
  }[];
  question: string;
}

/** Query Cala knowledge base for structured data */
export async function calaQuery(
  question: string,
  context?: string
): Promise<CalaQueryResult> {
  const input = { question, context };
  const cacheKey = getCacheKey("/v1/knowledge/query", input);
  const cached = readCache<CalaQueryResult>(cacheKey);
  if (cached) return cached;

  if (!isCalaConfigured()) {
    return simulateCalaQuery(question);
  }

  const res = await fetch(`${CALA_BASE}/v1/knowledge/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CALA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, context }),
  });

  if (!res.ok) {
    console.warn(`[Cala] Query failed: ${res.status} — falling back to simulation`);
    return simulateCalaQuery(question);
  }

  const data = await res.json();
  writeCache(cacheKey, data);
  return data;
}

/** Search Cala for sources behind a specific claim */
export async function calaSearch(
  question: string
): Promise<CalaSearchResult> {
  const cacheKey = getCacheKey("/v1/knowledge/search", { question });
  const cached = readCache<CalaSearchResult>(cacheKey);
  if (cached) return cached;

  if (!isCalaConfigured()) {
    return simulateCalaSearch(question);
  }

  const res = await fetch(`${CALA_BASE}/v1/knowledge/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CALA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    console.warn(`[Cala] Search failed: ${res.status} — falling back to simulation`);
    return simulateCalaSearch(question);
  }

  const data = await res.json();
  writeCache(cacheKey, data);
  return data;
}

// ─── Simulation / Demo Mode ──────────────────────────────────────────────────

function simulateCalaQuery(question: string): CalaQueryResult {
  const q = question.toLowerCase();

  if (q.includes("carbon credit") || q.includes("redd")) {
    return {
      question,
      columns: ["project", "type", "location", "claimed_co2_annual", "verified_co2_annual", "certifications"],
      rows: [
        { project: "Kariba REDD+", type: "REDD+", location: "Zimbabwe", claimed_co2_annual: "4900000", verified_co2_annual: "1100000", certifications: "VCS" },
        { project: "Alto Mayo Protected Forest", type: "REDD+", location: "Peru", claimed_co2_annual: "920000", verified_co2_annual: "680000", certifications: "VCS, CCBA" },
        { project: "Tambopata-Bahuaja", type: "REDD+", location: "Peru", claimed_co2_annual: "1200000", verified_co2_annual: "890000", certifications: "VCS" },
        { project: "Kasigau Corridor", type: "REDD+", location: "Kenya", claimed_co2_annual: "450000", verified_co2_annual: "410000", certifications: "VCS, CCBA, Gold Standard" },
      ],
    };
  }

  if (q.includes("reforestation") || q.includes("forest")) {
    return {
      question,
      columns: ["project", "type", "location", "area_hectares", "co2_annual", "cost_per_ton"],
      rows: [
        { project: "Trees for the Future Sahel", type: "Reforestation", location: "West Africa", area_hectares: "90000", co2_annual: "480000", cost_per_ton: "93" },
        { project: "Rimba Raya Biodiversity Reserve", type: "Reforestation", location: "Borneo", area_hectares: "64000", co2_annual: "4700000", cost_per_ton: "63" },
        { project: "Congo Basin Initiative", type: "Reforestation", location: "Congo", area_hectares: "120000", co2_annual: "1400000", cost_per_ton: "71" },
      ],
    };
  }

  if (q.includes("solar")) {
    return {
      question,
      columns: ["project", "capacity_mw", "location", "co2_annual", "investment_usd_m"],
      rows: [
        { project: "Noor Ouarzazate", capacity_mw: "580", location: "Morocco", co2_annual: "760000", investment_usd_m: "900" },
        { project: "Bhadla Solar Park", capacity_mw: "2245", location: "India", co2_annual: "1900000", investment_usd_m: "1200" },
        { project: "Sahara Solar Array", capacity_mw: "500", location: "Tunisia", co2_annual: "714000", investment_usd_m: "200" },
      ],
    };
  }

  return {
    question,
    columns: ["name", "value"],
    rows: [{ name: "No data found", value: "0" }],
  };
}

function simulateCalaSearch(question: string): CalaSearchResult {
  const q = question.toLowerCase();

  if (q.includes("kariba") || q.includes("redd")) {
    return {
      question,
      sources: [
        {
          name: "Carbon Market Watch Investigation 2023",
          document: "Ghost Credits: The Carbon Offset Scandal",
          snippet: "An investigation found that the Kariba REDD+ project issued credits for forest protection that was already protected under existing law, constituting a fundamental additionality failure.",
          url: "https://carbonmarketwatch.org",
          confidence: 0.92,
        },
        {
          name: "Guardian Investigation 2023",
          document: "Revealed: more than 90% of rainforest carbon offsets are worthless",
          snippet: "Analysis of Verra-certified projects found systematic overcrediting. Kariba specifically showed 4.5× overclaim ratio based on independent satellite deforestation data.",
          confidence: 0.89,
        },
        {
          name: "CarbonPlan Database 2023",
          document: "REDD+ Project Assessment",
          snippet: "Baseline deforestation rates used by Kariba were significantly higher than observed rates, inflating the claimed benefits by an estimated 300-400%.",
          url: "https://carbonplan.org",
          confidence: 0.95,
        },
      ],
    };
  }

  return {
    question,
    sources: [
      {
        name: "IPCC AR6 Working Group III",
        document: "Mitigation of Climate Change — Chapter 7",
        snippet: "Land-based mitigation options including reforestation offer significant co-benefits but face challenges of permanence, additionality, and leakage.",
        confidence: 0.88,
      },
      {
        name: "Science 2023",
        document: "Carbon offsetting projects may be less effective than believed",
        snippet: "Independent satellite analysis of 26 REDD+ projects found 73% failed to reduce deforestation at claimed rates, implying systematic overcrediting.",
        confidence: 0.91,
      },
    ],
  };
}
