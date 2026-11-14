"use client";

import { motion } from "framer-motion";
import { cn, fmtCO2, fmtUSD, fmtNum } from "@/lib/utils";
import type { SimulationResult } from "@/lib/planetary/types";

interface MetricsGridProps {
  simulation: SimulationResult;
  intervention: {
    investment_usd_m: number;
    type: string;
  };
}

function Metric({
  label,
  value,
  unit,
  color = "text-zinc-200",
  delay = 0,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  delay?: number;
  note?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-900 rounded-lg border border-zinc-800 p-4"
    >
      <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</div>
      <div className={cn("font-mono text-xl font-bold", color)}>
        {value}
        {unit && <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>}
      </div>
      {note && <div className="text-xs text-zinc-600 mt-1">{note}</div>}
    </motion.div>
  );
}

export function MetricsGrid({ simulation, intervention }: MetricsGridProps) {
  const { claim_verification, yearly_metrics } = simulation;

  const year10 = yearly_metrics[yearly_metrics.length - 1];
  const avgBio = yearly_metrics.length
    ? yearly_metrics.reduce((s, y) => s + y.biodiversity_index, 0) / yearly_metrics.length
    : 0;

  const tempDelta = year10?.temperature_delta_c ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Metric
        label="10-Year CO₂ Impact"
        value={fmtNum(simulation.total_co2_10yr_tons, 1)}
        unit="tCO₂"
        color="text-emerald-400"
        delay={0}
        note="Sequestered + avoided"
      />

      <Metric
        label="Cost per Ton"
        value={`$${simulation.cost_per_ton_usd < 1000 ? simulation.cost_per_ton_usd.toFixed(0) : fmtNum(simulation.cost_per_ton_usd, 0)}`}
        unit="/tCO₂"
        color={
          simulation.cost_per_ton_usd < 50 ? "text-emerald-400" :
          simulation.cost_per_ton_usd < 200 ? "text-blue-400" :
          "text-amber-400"
        }
        delay={0.08}
      />

      <Metric
        label="Net Benefit"
        value={fmtUSD(simulation.net_benefit_usd_m)}
        color={simulation.net_benefit_usd_m >= 0 ? "text-emerald-400" : "text-red-400"}
        delay={0.16}
        note="At $50/ton social cost of carbon"
      />

      <Metric
        label="vs Category Avg"
        value={`${simulation.vs_category_avg_pct >= 0 ? "+" : ""}${simulation.vs_category_avg_pct.toFixed(0)}`}
        unit="pts"
        color={simulation.vs_category_avg_pct >= 0 ? "text-blue-400" : "text-amber-400"}
        delay={0.24}
        note="Planetary Impact Score"
      />

      <Metric
        label="Biodiversity Index"
        value={Math.round(avgBio).toString()}
        unit="/ 100"
        color="text-zinc-300"
        delay={0.32}
        note="10-year average"
      />

      <Metric
        label="Temperature Delta"
        value={tempDelta <= 0 ? tempDelta.toFixed(2) : `+${tempDelta.toFixed(2)}`}
        unit="°C"
        color={tempDelta <= 0 ? "text-blue-400" : "text-amber-400"}
        delay={0.4}
        note="Year 10 local effect"
      />

      {claim_verification && (
        <>
          <Metric
            label="Accuracy Ratio"
            value={`${Math.round(claim_verification.accuracy_ratio * 100)}%`}
            color={
              claim_verification.accuracy_ratio >= 0.8 ? "text-emerald-400" :
              claim_verification.accuracy_ratio >= 0.5 ? "text-amber-400" :
              "text-red-400"
            }
            delay={0.48}
            note="Simulated / claimed"
          />
          <Metric
            label="Avoided CO₂ Y10"
            value={fmtNum(simulation.avoided_co2_10yr_tons, 1)}
            unit="tCO₂"
            color="text-blue-400"
            delay={0.56}
          />
        </>
      )}
    </div>
  );
}
