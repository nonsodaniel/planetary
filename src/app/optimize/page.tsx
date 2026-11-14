"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, fmtNum, interventionLabel } from "@/lib/utils";
import type { PortfolioAllocation, PortfolioResult } from "@/app/api/optimize/portfolio/route";

const INTERVENTION_TYPES = [
  { value: "reforestation",            label: "Reforestation" },
  { value: "mangrove_restoration",     label: "Mangrove Restoration" },
  { value: "peatland_restoration",     label: "Peatland Restoration" },
  { value: "solar_farm",               label: "Solar Farm" },
  { value: "wind_farm",                label: "Wind Farm" },
  { value: "regenerative_agriculture", label: "Regen Agriculture" },
  { value: "direct_air_capture",       label: "Direct Air Capture" },
];

const BUDGET_PRESETS = [
  { label: "$10M", value: 10 },
  { label: "$50M", value: 50 },
  { label: "$100M", value: 100 },
  { label: "$500M", value: 500 },
  { label: "$1B", value: 1000 },
];

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            score >= 75 ? "bg-amber-400" :
            score >= 60 ? "bg-zinc-400" :
            score >= 45 ? "bg-orange-400" :
            "bg-red-400"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-mono w-5 text-right",
        score >= 75 ? "text-amber-400" :
        score >= 60 ? "text-zinc-300" :
        "text-zinc-400"
      )}>
        {score}
      </span>
    </div>
  );
}

function CO2Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-green-400 w-14 text-right">
        {fmtNum(value, 1)} t
      </span>
    </div>
  );
}

export default function OptimizePage() {
  const [budget, setBudget] = useState(100);
  const [budgetInput, setBudgetInput] = useState("100");
  const [maxAllocations, setMaxAllocations] = useState(6);
  const [excludedTypes, setExcludedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: string) {
    setExcludedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function runOptimization() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/optimize/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_usd_m: budget,
          max_allocations: maxAllocations,
          excluded_types: excludedTypes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Optimization failed");
      }

      const data: PortfolioResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const maxCO2 = result
    ? Math.max(...result.allocations.map((a) => a.estimated_co2_10yr_tons))
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Portfolio Optimizer</h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
          Given a budget, NVIDIA cuOpt finds the optimal combination of climate interventions
          to maximize CO₂ impact per dollar. NVIDIA NIM justifies each allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Configuration</div>

            {/* Budget */}
            <div className="mb-5">
              <label className="text-xs text-zinc-500 mb-2 block">Total Budget</label>
              <div className="flex gap-2 flex-wrap mb-3">
                {BUDGET_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setBudget(p.value); setBudgetInput(String(p.value)); }}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-mono border transition-all",
                      budget === p.value
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">$</span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    const n = parseFloat(e.target.value);
                    if (!isNaN(n) && n >= 5) setBudget(n);
                  }}
                  placeholder="Custom amount"
                  min="5"
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
                <span className="text-zinc-500 text-sm">M USD</span>
              </div>
            </div>

            {/* Max allocations */}
            <div className="mb-5">
              <label className="text-xs text-zinc-500 mb-2 block">
                Max Allocations: <span className="text-zinc-200 font-mono">{maxAllocations}</span>
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={maxAllocations}
                onChange={(e) => setMaxAllocations(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-zinc-700 font-mono mt-0.5">
                <span>2</span><span>10</span>
              </div>
            </div>

            {/* Exclude types */}
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Exclude Intervention Types</label>
              <div className="space-y-1.5">
                {INTERVENTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => toggleType(t.value)}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-3 py-2 rounded text-xs border transition-all",
                      excludedTypes.includes(t.value)
                        ? "border-red-500/30 bg-red-500/5 text-zinc-500 line-through"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                    )}
                  >
                    {t.label}
                    {excludedTypes.includes(t.value) && (
                      <span className="text-red-400 text-xs">excluded</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Run */}
            <div className="mt-5">
              <Button
                variant="primary"
                size="lg"
                className="w-full gap-2"
                disabled={loading || budget < 5}
                onClick={runOptimization}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running cuOpt...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Optimize Portfolio
                  </>
                )}
              </Button>
              <div className="text-center text-xs text-zinc-600 mt-2">
                NVIDIA cuOpt · NIM reasoning
              </div>
            </div>

            {error && (
              <div className="mt-3 flex gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 h-64 flex flex-col items-center justify-center text-center px-8">
                <TrendingUp className="w-8 h-8 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">
                  Configure a budget and click <span className="text-zinc-300">Optimize Portfolio</span> to
                  find the optimal climate investment mix.
                </p>
              </div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-zinc-800 bg-zinc-900 h-64 flex flex-col items-center justify-center gap-3"
              >
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <div className="text-sm text-zinc-400">Running cuOpt optimization...</div>
                <div className="text-xs text-zinc-600 font-mono">NIM generating allocation rationale</div>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total CO₂ (10yr)</div>
                    <div className="font-mono text-xl font-bold text-green-400">
                      {fmtNum(result.total_co2_estimate_tons, 1)}
                      <span className="text-zinc-600 text-xs font-normal ml-1">t</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avg Cost / Ton</div>
                    <div className="font-mono text-xl font-bold text-zinc-200">
                      ${result.avg_cost_per_ton}
                      <span className="text-zinc-600 text-xs font-normal ml-1">/tCO₂</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Budget Used</div>
                    <div className="font-mono text-xl font-bold text-zinc-200">
                      ${result.total_budget_used_usd_m}M
                      <span className="text-zinc-600 text-xs font-normal ml-1">
                        of ${budget}M
                      </span>
                    </div>
                  </div>
                </div>

                {/* NIM summary */}
                {result.nim_summary && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-600 uppercase tracking-wider mb-2 font-mono">NIM Analysis</div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{result.nim_summary}</p>
                  </div>
                )}

                {/* Allocations table */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
                    <div className="col-span-1 text-xs text-zinc-600 font-mono">#</div>
                    <div className="col-span-4 text-xs text-zinc-600 uppercase tracking-wide">Project</div>
                    <div className="col-span-2 text-xs text-zinc-600 uppercase tracking-wide">Alloc.</div>
                    <div className="col-span-3 text-xs text-zinc-600 uppercase tracking-wide">CO₂ (10yr)</div>
                    <div className="col-span-2 text-xs text-zinc-600 uppercase tracking-wide">Score</div>
                  </div>

                  {result.allocations.map((alloc, i) => (
                    <motion.div
                      key={alloc.rank}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-zinc-800 last:border-0"
                    >
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 items-start hover:bg-zinc-800/50 transition-colors">
                        <div className="col-span-1 font-mono text-sm text-zinc-600">{alloc.rank}</div>
                        <div className="col-span-4">
                          <div className="text-xs font-medium text-zinc-200">{alloc.type_label}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{alloc.region}, {alloc.country}</div>
                          <div className="text-xs text-zinc-700 mt-0.5 italic">{alloc.diversification_role}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="font-mono text-sm text-zinc-200">${alloc.allocation_usd_m}M</div>
                          <div className="text-xs text-zinc-600">${alloc.cost_per_ton}/t</div>
                        </div>
                        <div className="col-span-3">
                          <CO2Bar value={alloc.estimated_co2_10yr_tons} max={maxCO2} />
                        </div>
                        <div className="col-span-2">
                          <ScoreBar score={alloc.impact_score} />
                        </div>
                      </div>
                      {alloc.reasoning && (
                        <div className="px-4 pb-3 ml-5">
                          <p className="text-xs text-zinc-600 leading-relaxed">
                            ▸ {alloc.reasoning}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Budget breakdown */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <div className="text-xs text-zinc-600 uppercase tracking-wider mb-3">Budget Allocation</div>
                  <div className="space-y-2">
                    {result.allocations.map((alloc) => {
                      const pct = (alloc.allocation_usd_m / result.total_budget_used_usd_m) * 100;
                      return (
                        <div key={alloc.rank} className="flex items-center gap-3 text-xs">
                          <span className="text-zinc-500 w-32 truncate">{alloc.type_label}</span>
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                            />
                          </div>
                          <span className="font-mono text-zinc-400 w-14 text-right">${alloc.allocation_usd_m}M</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
