"use client";

import { motion } from "framer-motion";
import type { NimClimateAnalysis, CosmosWorldState, OptimizationResult } from "@/lib/planetary/types";
import { fmtNum } from "@/lib/utils";

interface NvidiaInsightsProps {
  nim: NimClimateAnalysis;
  cosmos: CosmosWorldState;
  optimization: OptimizationResult;
}

export function NvidiaInsights({ nim, cosmos, optimization }: NvidiaInsightsProps) {
  const year10 = cosmos.year_snapshots.find((s) => s.year === 10);
  const year0 = cosmos.year_snapshots.find((s) => s.year === 0);
  const year5 = cosmos.year_snapshots.find((s) => s.year === 5);

  return (
    <div className="space-y-5">
      {/* NIM Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
            <span className="text-xs">🧠</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">NVIDIA NIM</div>
            <div className="text-xs text-slate-500 font-mono">{nim.model_used}</div>
          </div>
          <div className="ml-auto text-xs font-mono text-slate-500">
            {nim.confidence_pct}% confidence
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Key Climate Drivers</div>
          {nim.key_drivers.map((driver, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-2 text-xs"
            >
              <span className="text-emerald-500/60 flex-shrink-0 mt-0.5">▸</span>
              <span className="text-slate-400">{driver}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cosmos Section */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
            <span className="text-xs">🌍</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">NVIDIA Cosmos</div>
            <div className="text-xs text-slate-500 font-mono">{cosmos.physical_model}</div>
          </div>
        </div>

        {/* Year snapshots timeline */}
        <div className="space-y-3">
          {cosmos.year_snapshots.map((snap, i) => (
            <motion.div
              key={snap.year}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="relative pl-6"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              </div>
              {/* Timeline line */}
              {i < cosmos.year_snapshots.length - 1 && (
                <div className="absolute left-1.5 top-5 bottom-0 w-px bg-slate-800" style={{ height: "calc(100% + 12px)" }} />
              )}

              <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-400">
                    {snap.year === 0 ? "Baseline" : `Year ${snap.year}`}
                  </span>
                  <span className="text-xs text-slate-600 border border-slate-700 px-1.5 rounded">
                    {snap.ecosystem_state}
                  </span>
                  <span className="text-xs font-mono text-slate-600 ml-auto">
                    {snap.atmospheric_co2_ppm.toFixed(0)} ppm
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {snap.description}
                </p>
                {snap.surface_temp_delta !== 0 && (
                  <div className="mt-1 text-xs font-mono">
                    <span className="text-slate-600">ΔT: </span>
                    <span className={snap.surface_temp_delta < 0 ? "text-cyan-400" : "text-amber-400"}>
                      {snap.surface_temp_delta > 0 ? "+" : ""}{snap.surface_temp_delta.toFixed(3)}°C
                    </span>
                    {snap.albedo_change !== 0 && (
                      <>
                        <span className="text-slate-700 mx-1">·</span>
                        <span className="text-slate-600">Δα: </span>
                        <span className="text-slate-400">{(snap.albedo_change * 100).toFixed(2)}%</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* cuOpt Section */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
            <span className="text-xs">⚡</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">NVIDIA cuOpt</div>
            <div className="text-xs text-slate-500 font-mono">Spatial placement optimization</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs font-mono text-purple-400">+{optimization.estimated_impact_gain_pct}%</div>
            <div className="text-xs text-slate-600">vs random</div>
          </div>
        </div>

        <div className="space-y-2">
          {optimization.zones.slice(0, 3).map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex gap-3 items-start rounded-lg bg-slate-900/60 border border-slate-800 p-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-mono text-purple-400">{zone.priority_rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-mono">
                    {zone.coordinates.lat.toFixed(2)}°N, {zone.coordinates.lng.toFixed(2)}°E
                  </span>
                  <span className="text-xs font-mono text-purple-400">
                    {zone.impact_multiplier.toFixed(2)}×
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {fmtNum(zone.area_hectares, 0)} ha · {zone.reasons[0]}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <div className="text-xs text-slate-400">
            Optimal placement adds{" "}
            <span className="text-purple-400 font-mono">
              {fmtNum(optimization.vs_suboptimal_co2_gain_tons, 0)} tCO₂
            </span>{" "}
            vs. random placement
          </div>
        </div>
      </div>
    </div>
  );
}
