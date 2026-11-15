"use client";

import { motion } from "framer-motion";
import type {
  NimClimateAnalysis,
  CosmosWorldState,
  OptimizationResult,
  NemotronConfidence,
} from "@/lib/planetary/types";
import { fmtNum } from "@/lib/utils";

interface NvidiaInsightsProps {
  nim: NimClimateAnalysis;
  cosmos: CosmosWorldState;
  optimization: OptimizationResult;
  /** Optional — populated asynchronously by Nemotron after the main pipeline completes */
  nemotronConfidence?: NemotronConfidence;
}

export function NvidiaInsights({ nim, cosmos, optimization, nemotronConfidence }: NvidiaInsightsProps) {
  const year10 = cosmos.year_snapshots.find((s) => s.year === 10);
  const year0 = cosmos.year_snapshots.find((s) => s.year === 0);
  const year5 = cosmos.year_snapshots.find((s) => s.year === 5);

  return (
    <div className="space-y-5">
      {/* NIM Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-xs">🧠</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">NVIDIA NIM</div>
            <div className="text-xs text-zinc-500 font-mono">{nim.model_used}</div>
          </div>
          <div className="ml-auto text-xs font-mono text-zinc-500">
            {nim.confidence_pct}% confidence
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Key Climate Drivers</div>
          {nim.key_drivers.map((driver, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-2 text-xs"
            >
              <span className="text-emerald-500/60 flex-shrink-0 mt-0.5">▸</span>
              <span className="text-zinc-400">{driver}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cosmos Section */}
      <div className="border-t border-zinc-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-xs">🌍</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">NVIDIA Cosmos</div>
            <div className="text-xs text-zinc-500 font-mono">{cosmos.physical_model}</div>
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
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              </div>
              {/* Timeline line */}
              {i < cosmos.year_snapshots.length - 1 && (
                <div className="absolute left-1.5 top-5 bottom-0 w-px bg-zinc-800" style={{ height: "calc(100% + 12px)" }} />
              )}

              <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-zinc-400">
                    {snap.year === 0 ? "Baseline" : `Year ${snap.year}`}
                  </span>
                  <span className="text-xs text-zinc-600 border border-zinc-700 px-1.5 rounded">
                    {snap.ecosystem_state}
                  </span>
                  <span className="text-xs font-mono text-zinc-600 ml-auto">
                    {snap.atmospheric_co2_ppm.toFixed(0)} ppm
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {snap.description}
                </p>
                {snap.surface_temp_delta !== 0 && (
                  <div className="mt-1 text-xs font-mono">
                    <span className="text-zinc-600">ΔT: </span>
                    <span className={snap.surface_temp_delta < 0 ? "text-blue-400" : "text-amber-400"}>
                      {snap.surface_temp_delta > 0 ? "+" : ""}{snap.surface_temp_delta.toFixed(3)}°C
                    </span>
                    {snap.albedo_change !== 0 && (
                      <>
                        <span className="text-zinc-700 mx-1">·</span>
                        <span className="text-zinc-600">Δα: </span>
                        <span className="text-zinc-400">{(snap.albedo_change * 100).toFixed(2)}%</span>
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
      <div className="border-t border-zinc-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-xs">⚡</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">NVIDIA cuOpt</div>
            <div className="text-xs text-zinc-500 font-mono">Spatial placement optimization</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs font-mono text-blue-400">+{optimization.estimated_impact_gain_pct}%</div>
            <div className="text-xs text-zinc-600">vs random</div>
          </div>
        </div>

        <div className="space-y-2">
          {optimization.zones.slice(0, 3).map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex gap-3 items-start rounded-lg bg-zinc-900/60 border border-zinc-800 p-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-mono text-blue-400">{zone.priority_rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-300 font-mono">
                    {zone.coordinates.lat.toFixed(2)}°N, {zone.coordinates.lng.toFixed(2)}°E
                  </span>
                  <span className="text-xs font-mono text-blue-400">
                    {zone.impact_multiplier.toFixed(2)}×
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {fmtNum(zone.area_hectares, 0)} ha · {zone.reasons[0]}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-400">
            Optimal placement adds{" "}
            <span className="text-blue-400 font-mono">
              {fmtNum(optimization.vs_suboptimal_co2_gain_tons, 0)} tCO₂
            </span>{" "}
            vs. random placement
          </div>
        </div>
      </div>

      {/* Nemotron Confidence Section — renders only when available */}
      {nemotronConfidence && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border-t border-zinc-800 pt-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
              <span className="text-xs">⚖️</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">Nemotron Peer Review</div>
              <div className="text-xs text-zinc-500 font-mono">{nemotronConfidence.model_used}</div>
            </div>
            <div className="ml-auto text-right">
              <div
                className={`text-sm font-bold font-mono ${
                  nemotronConfidence.label === "High"
                    ? "text-emerald-400"
                    : nemotronConfidence.label === "Medium"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {nemotronConfidence.label}
              </div>
              <div className="text-xs text-zinc-600">
                {Math.round(nemotronConfidence.score * 100)}% confidence
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden mb-3">
            <motion.div
              className={`h-full rounded-full ${
                nemotronConfidence.label === "High"
                  ? "bg-emerald-500"
                  : nemotronConfidence.label === "Medium"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${nemotronConfidence.score * 100}%` }}
              transition={{ duration: 0.8, delay: 0.1 }}
            />
          </div>

          {/* Dimension breakdown — only when present */}
          {nemotronConfidence.dimensions && (
            <div className="space-y-1.5 mb-3">
              {(
                [
                  ["Scientific Accuracy",    nemotronConfidence.dimensions.scientific_accuracy],
                  ["Internal Consistency",   nemotronConfidence.dimensions.internal_consistency],
                  ["Regional Specificity",   nemotronConfidence.dimensions.regional_specificity],
                  ["IPCC Alignment",         nemotronConfidence.dimensions.ipcc_alignment],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-36 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500/60"
                      style={{ width: `${val * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 w-8 text-right">
                    {Math.round(val * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-zinc-500 leading-relaxed">
            {nemotronConfidence.reasoning}
          </p>
        </motion.div>
      )}
    </div>
  );
}
