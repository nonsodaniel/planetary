"use client";

import { usePlanetaryStore } from "@/lib/planetary/store";
import { interventionLabel, scoreTierMeta, fmtNum, fmtUSD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DEMO_INTERVENTIONS, DEMO_SIMULATIONS } from "@/lib/planetary/demos";

export default function PortfolioPage() {
  const { interventions, simulations } = usePlanetaryStore();

  // Build portfolio view
  const projects = Object.values(interventions).map((intervention) => {
    const sim = Object.values(simulations).find(
      (s) => s.intervention_id === intervention.id
    );
    return { intervention, sim };
  });

  const totalCO2 = projects.reduce((s, p) => s + (p.sim?.total_co2_10yr_tons ?? 0), 0);
  const avgScore =
    projects.filter((p) => p.sim?.status === "complete").reduce((s, p) => s + (p.sim?.planetary_impact_score ?? 0), 0) /
    Math.max(1, projects.filter((p) => p.sim?.status === "complete").length);

  const greenwashCount = projects.filter(
    (p) => p.sim?.claim_verification?.greenwashing_risk === "high" || p.sim?.claim_verification?.greenwashing_risk === "severe"
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Climate Portfolio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Planetary Impact Scores across all simulated interventions
          </p>
        </div>
        <Link href="/">
          <Button variant="plasma" size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            Add Intervention
          </Button>
        </Link>
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total CO₂ Impact</div>
          <div className="font-mono text-2xl font-bold text-emerald-400">
            {fmtNum(totalCO2, 1)}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">tCO₂ across 10 years</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Avg Impact Score</div>
          <div className={`font-mono text-2xl font-bold ${
            avgScore >= 70 ? "text-amber-400" :
            avgScore >= 50 ? "text-cyan-400" :
            "text-red-400"
          }`}>
            {Math.round(avgScore)}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">/ 100 Planetary Score</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Greenwashing Flags</div>
          <div className={`font-mono text-2xl font-bold ${greenwashCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {greenwashCount}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">of {projects.length} projects</div>
        </div>
      </div>

      {/* Projects list */}
      <div className="space-y-3">
        {projects.map(({ intervention, sim }, i) => {
          const tierMeta = sim ? scoreTierMeta(sim.score_tier) : null;
          const gwRisk = sim?.claim_verification?.greenwashing_risk;
          const isGreenwash = gwRisk === "high" || gwRisk === "severe";

          return (
            <motion.div
              key={intervention.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={sim ? `/simulate/${sim.id}?intervention=${intervention.id}&demo=1` : "/"}>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900 transition-all p-4 group cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* Score */}
                    <div className="text-center flex-shrink-0 w-16">
                      {sim?.status === "complete" ? (
                        <>
                          <div className={`font-mono text-3xl font-bold ${tierMeta?.color}`}>
                            {sim.planetary_impact_score}
                          </div>
                          <div className="text-xs text-slate-600">/100</div>
                        </>
                      ) : (
                        <div className="text-2xl text-slate-700">—</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-slate-200">{intervention.name}</span>
                        {tierMeta && (
                          <div className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${tierMeta.bg} ${tierMeta.border} ${tierMeta.color}`}>
                            {tierMeta.label}
                          </div>
                        )}
                        {isGreenwash && (
                          <div className="px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-400">
                            ⚠️ Greenwashing
                          </div>
                        )}
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {interventionLabel(intervention.type)}
                        </Badge>
                      </div>

                      <div className="text-sm text-slate-500">
                        {intervention.region}, {intervention.country}
                        {` · ${fmtUSD(intervention.investment_usd_m)}`}
                        {intervention.area_hectares && ` · ${fmtNum(intervention.area_hectares, 0)} ha`}
                      </div>

                      {sim?.status === "complete" && (
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>
                            CO₂: <span className="text-emerald-400 font-mono">{fmtNum(sim.total_co2_10yr_tons, 1)} t</span>
                          </span>
                          <span>
                            Cost: <span className="font-mono text-slate-400">${sim.cost_per_ton_usd.toFixed(0)}/t</span>
                          </span>
                          {sim.claim_verification && (
                            <span>
                              Accuracy: <span className={`font-mono ${
                                sim.claim_verification.accuracy_ratio >= 0.8 ? "text-emerald-400" :
                                sim.claim_verification.accuracy_ratio >= 0.5 ? "text-amber-400" :
                                "text-red-400"
                              }`}>
                                {Math.round(sim.claim_verification.accuracy_ratio * 100)}%
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-4">🌍</div>
          <p className="text-lg mb-2">No projects yet</p>
          <p className="text-sm">Run your first simulation to see your portfolio.</p>
          <Link href="/" className="inline-block mt-4">
            <Button variant="plasma">Start Simulating</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
