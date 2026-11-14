"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CosmosWorldState } from "@/lib/planetary/types";

interface CosmosWorldViewProps {
  cosmos: CosmosWorldState;
  className?: string;
}

const YEAR_LABELS: Record<number, string> = {
  0: "Baseline",
  1: "Year 1",
  5: "Year 5",
  10: "Year 10",
};

function DeltaValue({ value, unit, invert = false }: { value: number; unit: string; invert?: boolean }) {
  const isPositive = value > 0;
  // For temperature: positive = bad (warming), negative = good (cooling)
  // For albedo: positive = good (more reflective), negative = bad
  const isGood = invert ? isPositive : !isPositive;
  const colorClass = value === 0
    ? "text-zinc-500"
    : isGood
      ? "text-green-400"
      : "text-amber-400";

  return (
    <span className={cn("font-mono", colorClass)}>
      {value > 0 ? "+" : ""}{value.toFixed(3)}{unit}
    </span>
  );
}

export function CosmosWorldView({ cosmos, className }: CosmosWorldViewProps) {
  const snapshots = cosmos.year_snapshots.sort((a, b) => a.year - b.year);
  const [activeYear, setActiveYear] = useState(snapshots[snapshots.length - 1]?.year ?? 0);
  const activeSnap = snapshots.find((s) => s.year === activeYear) ?? snapshots[0];

  if (!activeSnap) return null;

  // CO₂ change from baseline
  const baseline = snapshots.find((s) => s.year === 0);
  const co2Delta = baseline ? activeSnap.atmospheric_co2_ppm - baseline.atmospheric_co2_ppm : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Cosmos World View</div>
          <div className="text-xs text-zinc-600 font-mono mt-0.5">{cosmos.physical_model}</div>
        </div>
        <div className="text-xs text-zinc-600 border border-zinc-800 rounded px-2 py-0.5 font-mono">
          {cosmos.simulation_fidelity} fidelity
        </div>
      </div>

      {/* Year selector */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
        {snapshots.map((snap) => (
          <button
            key={snap.year}
            onClick={() => setActiveYear(snap.year)}
            className={cn(
              "flex-1 py-1.5 rounded text-xs font-mono transition-all",
              activeYear === snap.year
                ? "bg-zinc-100 text-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {YEAR_LABELS[snap.year] ?? `Y${snap.year}`}
          </button>
        ))}
      </div>

      {/* Active snapshot */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeYear}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Ecosystem state + description */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs border border-zinc-700 rounded px-2 py-0.5 text-zinc-400 font-mono capitalize">
                {activeSnap.ecosystem_state}
              </span>
              <span className="text-xs text-zinc-600">
                {activeYear === 0 ? "Pre-intervention" : `+${activeYear} years`}
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {activeSnap.description}
            </p>
          </div>

          {/* Physical parameters */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-xs text-zinc-600 mb-1 uppercase tracking-wide">CO₂</div>
              <div className="font-mono text-sm text-zinc-200">
                {activeSnap.atmospheric_co2_ppm.toFixed(0)}
                <span className="text-zinc-600 text-xs ml-1">ppm</span>
              </div>
              {activeYear > 0 && co2Delta !== 0 && (
                <div className="text-xs mt-0.5">
                  <DeltaValue value={co2Delta} unit=" ppm" invert={false} />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-xs text-zinc-600 mb-1 uppercase tracking-wide">Temp Δ</div>
              <div className="font-mono text-sm">
                <DeltaValue value={activeSnap.surface_temp_delta} unit="°C" invert={false} />
              </div>
              <div className="text-xs text-zinc-600 mt-0.5">local surface</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-xs text-zinc-600 mb-1 uppercase tracking-wide">Albedo Δ</div>
              <div className="font-mono text-sm">
                <DeltaValue
                  value={parseFloat((activeSnap.albedo_change * 100).toFixed(3))}
                  unit="%"
                  invert={true}
                />
              </div>
              <div className="text-xs text-zinc-600 mt-0.5">reflectivity</div>
            </div>
          </div>

          {/* Timeline progress bar */}
          {snapshots.length > 1 && (
            <div className="relative">
              <div className="flex justify-between text-xs text-zinc-700 font-mono mb-1.5">
                {snapshots.map((s) => (
                  <span
                    key={s.year}
                    className={cn(s.year === activeYear ? "text-zinc-400" : "")}
                  >
                    {s.year === 0 ? "0" : `${s.year}yr`}
                  </span>
                ))}
              </div>
              <div className="h-0.5 bg-zinc-800 rounded-full relative">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-zinc-400 rounded-full"
                  animate={{
                    width: `${((snapshots.findIndex((s) => s.year === activeYear)) / (snapshots.length - 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
