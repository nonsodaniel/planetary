"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ExternalLink, Download } from "lucide-react";
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
import { usePlanetaryStore } from "@/lib/planetary/store";
import { DEMO_INTERVENTIONS } from "@/lib/planetary/demos";
import {
  interventionLabel,
  scoreTierMeta,
  greenwashingColor,
  fmtNum,
  fmtUSD,
} from "@/lib/utils";
import type { SimulationResult, ClimateIntervention } from "@/lib/planetary/types";

const POLL_INTERVAL = 2000; // 2s

function SkeletonPanel() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-800 rounded w-1/2" />
      <div className="h-32 bg-slate-800 rounded" />
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

  const { simulations, interventions } = usePlanetaryStore();
  const [sim, setSim] = useState<SimulationResult | null>(null);
  const [polling, setPolling] = useState(false);

  // Get intervention from store or demos
  const intervention: ClimateIntervention | null =
    interventionId
      ? (interventions[interventionId] ?? DEMO_INTERVENTIONS.find((i) => i.id === interventionId) ?? null)
      : null;

  // Load from store first
  useEffect(() => {
    const stored = simulations[simId];
    if (stored) setSim(stored);
  }, [simId, simulations]);

  // Poll for updates if simulation is running
  const fetchSim = useCallback(async () => {
    try {
      const res = await fetch(`/api/simulate/${simId}`);
      if (!res.ok) return;
      const data: SimulationResult = await res.json();
      setSim(data);
      return data.status;
    } catch {
      return "error";
    }
  }, [simId]);

  useEffect(() => {
    if (isDemo) return; // demos are pre-computed
    if (sim?.status === "complete" || sim?.status === "error") return;

    setPolling(true);
    const interval = setInterval(async () => {
      const status = await fetchSim();
      if (status === "complete" || status === "error") {
        clearInterval(interval);
        setPolling(false);
      }
    }, POLL_INTERVAL);

    // Initial fetch
    fetchSim();

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [simId, isDemo, fetchSim]);

  const isRunning = sim?.status === "running" || sim?.status === "pending";
  const isComplete = sim?.status === "complete";
  const tierMeta = sim ? scoreTierMeta(sim.score_tier) : null;
  const gwRisk = sim?.claim_verification?.greenwashing_risk;

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-6 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          <Link href="/" className="mt-1 p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-slate-100">
                {intervention?.name ?? "Climate Simulation"}
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
            {intervention && (
              <div className="text-sm text-slate-500 mt-0.5">
                {intervention.region}, {intervention.country}
                {intervention.area_hectares && ` · ${fmtNum(intervention.area_hectares, 0)} ha`}
                {intervention.capacity_mw && ` · ${intervention.capacity_mw} MW`}
                {` · ${fmtUSD(intervention.investment_usd_m)} investment`}
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Simulating...
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Complete
            </div>
          )}
          {sim?.status === "error" && (
            <div className="flex items-center gap-1.5 text-red-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              Error
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left column: Score + Stages + Certifications */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Impact Score */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">
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
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
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
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Certifications</div>
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
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
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
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Key Metrics</div>
            {isComplete && sim && intervention ? (
              <MetricsGrid simulation={sim} intervention={intervention} />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* Comparable projects */}
          {isComplete && sim && sim.comparable_projects.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Comparable Projects</div>
              <div className="space-y-2.5">
                {sim.comparable_projects.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-slate-300 font-medium">{p.name}</div>
                      <div className="text-slate-600">{p.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-slate-300">{fmtNum(p.co2_annual_tons, 0)} tCO₂/yr</div>
                      <div className="text-slate-600">${p.cost_per_ton_usd}/ton</div>
                    </div>
                    {p.impact_score > 0 && (
                      <div className={`w-10 text-center font-mono font-bold text-lg ${
                        p.impact_score >= 70 ? "text-amber-400" :
                        p.impact_score >= 50 ? "text-cyan-400" :
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
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                Claim Verification
              </div>
              <ClaimVerifier verification={sim.claim_verification} />
            </div>
          )}

          {/* Risk matrix */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Risk Assessment</div>
            {isComplete && sim ? (
              <RiskMatrix risks={sim.risks} overallRisk={sim.overall_risk} />
            ) : (
              <SkeletonPanel />
            )}
          </div>

          {/* NVIDIA Model Details */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">NVIDIA Insights</div>
            {isComplete && sim ? (
              <NvidiaInsights
                nim={sim.nim_analysis}
                cosmos={sim.cosmos_world}
                optimization={sim.optimization}
              />
            ) : (
              <SkeletonPanel />
            )}
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <div className="mt-8 pt-6 border-t border-slate-800/40 flex flex-wrap gap-4 justify-between items-center text-xs text-slate-600">
        <div className="font-mono space-x-3">
          <span>NVIDIA NIM</span>
          <span className="text-slate-700">·</span>
          <span>Cosmos World Foundation Model</span>
          <span className="text-slate-700">·</span>
          <span>cuOpt</span>
          <span className="text-slate-700">·</span>
          <span>Cala Knowledge API</span>
        </div>
        {sim?.completed_at && (
          <div>Completed {new Date(sim.completed_at).toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
}
