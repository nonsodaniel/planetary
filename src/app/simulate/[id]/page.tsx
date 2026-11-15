"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ExternalLink, Download, Copy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ImpactScore } from "@/components/planetary/ImpactScore";
import { TimelineChart } from "@/components/planetary/TimelineChart";
import { ClaimVerifier } from "@/components/planetary/ClaimVerifier";
import { RiskMatrix } from "@/components/planetary/RiskMatrix";
import { MetricsGrid } from "@/components/planetary/MetricsGrid";
import { SimulationStages } from "@/components/planetary/SimulationStages";
import { NvidiaInsights } from "@/components/planetary/NvidiaInsights";
import { CosmosWorldView } from "@/components/planetary/CosmosWorldView";
import { SatellitePanel } from "@/components/planetary/SatellitePanel";
import { InvestorPanel } from "@/components/planetary/InvestorPanel";
import { usePlanetaryStore } from "@/lib/planetary/store";
import { DEMO_INTERVENTIONS, DEMO_SIMULATIONS } from "@/lib/planetary/demos";
import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";
import {
  interventionLabel,
  scoreTierMeta,
  greenwashingColor,
  fmtNum,
  fmtUSD,
} from "@/lib/utils";
import type { SimulationResult, ClimateIntervention, SatelliteVerification, InvestorIntelligence } from "@/lib/planetary/types";
import type { SimSummary } from "@/lib/nvidia/investor";

const POLL_INTERVAL        = 2000; // 2s
const MAX_POLLS            = 150;  // 5-minute ceiling at 2s interval
const POST_COMPLETE_POLLS  = 12;   // 24s grace period for async enrichments (Nemotron + satellite)

function SkeletonPanel() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-4 bg-zinc-800 rounded w-1/2" />
      <div className="h-32 bg-zinc-800 rounded" />
    </div>
  );
}

export default function SimulatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const simId = params.id as string;
  const interventionId = searchParams.get("intervention");
  const isDemo = searchParams.get("demo") === "1";
  const projectId = searchParams.get("project");

  // When a project ID is supplied (from the globe / landing page CTAs), use that
  // project's display data for the header so example-only projects (which reuse
  // another project's simId/interventionId) show their own name and location.
  const demoProject = projectId ? DEMO_PROJECTS.find((p) => p.id === projectId) ?? null : null;

  const { simulations, interventions, upsertSimulation } = usePlanetaryStore();
  const [sim, setSim] = useState<SimulationResult | null>(null);
  const [polling, setPolling] = useState(false);
  const abortRef              = useRef<AbortController | null>(null);
  const pollCountRef          = useRef(0);
  const postCompletePollsRef  = useRef(0);

  // Get intervention from store or demos
  const intervention: ClimateIntervention | null =
    interventionId
      ? (interventions[interventionId] ?? DEMO_INTERVENTIONS.find((i) => i.id === interventionId) ?? null)
      : null;

  // Load from store; fall back to pre-computed demos for demo mode
  useEffect(() => {
    const stored = simulations[simId];
    if (stored) {
      setSim(stored);
    } else if (isDemo) {
      const demoSim = DEMO_SIMULATIONS.find((s) => s.id === simId);
      if (demoSim) setSim(demoSim);
    }
  }, [simId, simulations, isDemo]);

  // Poll for updates if simulation is running
  const fetchSim = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/simulate/${simId}`, { signal: controller.signal });
      if (!res.ok) return;
      const data: SimulationResult = await res.json();
      setSim(data);
      if (data.status === "complete") upsertSimulation(data);
      return data.status;
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      return "error";
    }
  }, [simId, upsertSimulation]);

  useEffect(() => {
    if (isDemo) return;
    if (sim?.status === "error") return;

    pollCountRef.current = 0;
    postCompletePollsRef.current = 0;
    setPolling(true);
    const interval = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current >= MAX_POLLS) {
        clearInterval(interval);
        setPolling(false);
        return;
      }
      const status = await fetchSim();
      if (status === "error") {
        clearInterval(interval);
        setPolling(false);
      } else if (status === "complete") {
        // Continue polling for POST_COMPLETE_POLLS more cycles so that
        // async enrichments (Nemotron + satellite) can be fetched once ready.
        postCompletePollsRef.current += 1;
        if (postCompletePollsRef.current >= POST_COMPLETE_POLLS) {
          clearInterval(interval);
          setPolling(false);
        }
      }
    }, POLL_INTERVAL);

    fetchSim();

    return () => {
      clearInterval(interval);
      setPolling(false);
      abortRef.current?.abort();
    };
  }, [simId, isDemo, fetchSim]);

  const isRunning = sim?.status === "running" || sim?.status === "pending";
  const isComplete = sim?.status === "complete";

  // Dedicated satellite state — kept separate from `sim` so React can track
  // it reliably. Seeded from sim if the server-side enrichment already ran.
  const [satelliteData, setSatelliteData] = useState<SatelliteVerification | null>(null);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const satelliteFetchedRef = useRef(false);

  // Seed from server enrichment if it arrives via polling
  useEffect(() => {
    if (sim?.satellite_verification && !satelliteData) {
      setSatelliteData(sim.satellite_verification);
    }
  }, [sim?.satellite_verification]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side on-demand fetch — fires once the sim is complete and
  // we have an intervention. Covers demos (no polling) and live sims
  // where background enrichment hasn't finished yet.
  // The ref is set AFTER a successful response (not before the fetch) so
  // React StrictMode's double-invoke correctly retries the aborted fetch.
  useEffect(() => {
    if (!isComplete || !intervention || satelliteFetchedRef.current) return;

    let alive = true;
    setSatelliteLoading(true);
    const controller = new AbortController();

    fetch("/api/satellite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intervention),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { satellite: SatelliteVerification }) => {
        if (!alive) return;
        satelliteFetchedRef.current = true;
        if (data?.satellite) setSatelliteData(data.satellite);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("[Satellite] Client fetch failed:", err);
        }
      })
      .finally(() => { if (alive) setSatelliteLoading(false); });

    return () => { alive = false; controller.abort(); };
  }, [isComplete, intervention]);

  // Investor intelligence — same guard pattern as satellite
  const [investorData, setInvestorData] = useState<InvestorIntelligence | null>(null);
  const [investorLoading, setInvestorLoading] = useState(false);
  const investorFetchedRef = useRef(false);

  useEffect(() => {
    if (!isComplete || !intervention || !sim || investorFetchedRef.current) return;

    let alive = true;
    const simSummary: SimSummary = {
      planetary_impact_score: sim.planetary_impact_score,
      score_tier: sim.score_tier,
      total_co2_10yr_tons: sim.total_co2_10yr_tons,
      cost_per_ton_usd: sim.cost_per_ton_usd,
      net_benefit_usd_m: sim.net_benefit_usd_m,
      overall_risk: sim.overall_risk,
      greenwashing_risk: sim.claim_verification?.greenwashing_risk,
      accuracy_ratio: sim.claim_verification?.accuracy_ratio,
    };

    setInvestorLoading(true);
    const controller = new AbortController();

    fetch("/api/investor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervention, sim: simSummary }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { intelligence: InvestorIntelligence }) => {
        if (!alive) return;
        investorFetchedRef.current = true;
        if (data?.intelligence) setInvestorData(data.intelligence);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("[Investor] Client fetch failed:", err);
        }
      })
      .finally(() => { if (alive) setInvestorLoading(false); });

    return () => { alive = false; controller.abort(); };
  }, [isComplete, intervention, sim]);

  const handleDownload = useCallback(() => {
    if (!sim) return;
    const blob = new Blob([JSON.stringify(sim, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-${simId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sim, simId]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }, []);
  const tierMeta = sim ? scoreTierMeta(sim.score_tier) : null;
  const gwRisk = sim?.claim_verification?.greenwashing_risk;

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-6 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Link href="/" className="mt-1 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-zinc-100">
                {demoProject?.name ?? intervention?.name ?? "Climate Simulation"}
              </h1>
              {intervention && (
                <Badge variant="secondary" className="text-xs">
                  {interventionLabel(intervention.type)}
                </Badge>
              )}
              {tierMeta && isComplete && (
                <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${tierMeta.bg} ${tierMeta.border} ${tierMeta.color}`}>
                  {tierMeta.label}
                </div>
              )}
              {gwRisk && (gwRisk === "high" || gwRisk === "severe") && (
                <div className="px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-400">
                  ⚠️ Greenwashing Risk
                </div>
              )}
            </div>
            {(demoProject || intervention) && (
              <div className="text-sm text-zinc-500 mt-0.5">
                {demoProject
                  ? `${demoProject.country} · ${demoProject.type} · ${demoProject.investment}`
                  : intervention && (
                    <>
                      {intervention.region}, {intervention.country}
                      {intervention.area_hectares && ` · ${fmtNum(intervention.area_hectares, 0)} ha`}
                      {intervention.capacity_mw && ` · ${intervention.capacity_mw} MW`}
                      {` · ${fmtUSD(intervention.investment_usd_m)} investment`}
                    </>
                  )
                }
              </div>
            )}
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0 flex-wrap">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-blue-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              Simulating...
            </div>
          )}
          {sim?.status === "error" && (
            <div className="flex items-center gap-1.5 text-red-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              Error
            </div>
          )}
          {isComplete && (
            <>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Copy link"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy link</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Download simulation JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left column: Score + Stages + Certifications */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Impact Score */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
              Planetary Impact Score™
            </div>
            {isComplete && sim ? (
              <ImpactScore
                score={sim.planetary_impact_score}
                tier={sim.score_tier}
                breakdown={sim.score_breakdown}
              />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* Pipeline */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            {sim ? (
              <SimulationStages
                stages={sim.stages_log}
                currentStage={sim.current_stage}
                status={sim.status}
              />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* Certifications */}
          {intervention?.certifications && intervention.certifications.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Certifications</div>
              <div className="flex flex-wrap gap-2">
                {intervention.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary" className="text-xs">{cert}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Timeline + Metrics */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          {/* Timeline chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            {isComplete && sim?.yearly_metrics.length ? (
              <TimelineChart
                yearly={sim.yearly_metrics}
                claimedAnnual={sim.claim_verification?.claimed_annual_co2_tons}
              />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* Key metrics grid */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Key Metrics</div>
            {isComplete && sim && intervention ? (
              <MetricsGrid simulation={sim} intervention={intervention} />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* Satellite Ground-Truth */}
          {isComplete && (satelliteData || satelliteLoading) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
                Satellite Ground-Truth
              </div>
              {satelliteData ? (
                <SatellitePanel satellite={satelliteData} />
              ) : (
                <SkeletonPanel />
              )}
            </div>
          )}

          {/* Cosmos World View */}
          {isComplete && sim && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <CosmosWorldView cosmos={sim.cosmos_world} />
            </div>
          )}

          {/* Comparable projects */}
          {isComplete && sim && sim.comparable_projects.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Comparable Projects</div>
              <div className="space-y-2.5">
                {sim.comparable_projects.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <div className="text-zinc-300 font-medium">{p.name}</div>
                      <div className="text-zinc-600">{p.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-zinc-300">{fmtNum(p.co2_annual_tons, 0)} tCO₂/yr</div>
                      <div className="text-zinc-600">${p.cost_per_ton_usd}/ton</div>
                    </div>
                    {p.impact_score > 0 && (
                      <div className={`w-10 text-center font-mono font-bold text-lg ${
                        p.impact_score >= 70 ? "text-amber-400" :
                        p.impact_score >= 50 ? "text-blue-400" :
                        "text-red-400"
                      }`}>
                        {p.impact_score}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Claim Verifier + Risks + NVIDIA */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Claim verification */}
          {isComplete && sim?.claim_verification && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
                Claim Verification
              </div>
              <ClaimVerifier verification={sim.claim_verification} />
            </div>
          )}

          {/* Risk matrix */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Risk Assessment</div>
            {isComplete && sim ? (
              <RiskMatrix risks={sim.risks} overallRisk={sim.overall_risk} />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* NVIDIA Model Details */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">NVIDIA Insights</div>
            {isComplete && sim ? (
              <NvidiaInsights
                nim={sim.nim_analysis}
                cosmos={sim.cosmos_world}
                optimization={sim.optimization}
                nemotronConfidence={sim.nemotron_confidence}
              />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* Investor Intelligence */}
          {isComplete && (investorData || investorLoading) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
                Investor Intelligence
              </div>
              {investorData ? (
                <InvestorPanel intelligence={investorData} />
              ) : (
                <SkeletonPanel />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer attribution */}
      <div className="mt-8 pt-6 border-t border-zinc-800/40 text-xs font-mono text-zinc-400">
        Powered by NVIDIA (NIM · Cosmos World Foundation Model · cuOpt) · Context.dev · Cala Knowledge API
      </div>
    </div>
  );
}
