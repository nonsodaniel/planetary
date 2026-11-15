"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestorIntelligence, InvestorScenario } from "@/lib/planetary/types";

interface InvestorPanelProps {
  intelligence: InvestorIntelligence;
}

const RATING_CONFIG = {
  "Strong Buy": {
    bg: "bg-emerald-500/10", border: "border-emerald-500/30",
    text: "text-emerald-400", dot: "bg-emerald-400",
    icon: TrendingUp,
  },
  "Buy": {
    bg: "bg-blue-500/10", border: "border-blue-500/30",
    text: "text-blue-400", dot: "bg-blue-400",
    icon: TrendingUp,
  },
  "Hold": {
    bg: "bg-amber-500/10", border: "border-amber-500/30",
    text: "text-amber-400", dot: "bg-amber-400",
    icon: Minus,
  },
  "Avoid": {
    bg: "bg-red-500/10", border: "border-red-500/30",
    text: "text-red-400", dot: "bg-red-400",
    icon: AlertTriangle,
  },
} as const;

const SCENARIO_CONFIG = {
  "Pessimistic": { accent: "text-red-400",    bar: "bg-red-500/50"     },
  "Base Case":   { accent: "text-blue-400",   bar: "bg-blue-500/50"    },
  "Optimistic":  { accent: "text-emerald-400", bar: "bg-emerald-500/50" },
} as const;

function ScenarioCard({ s, index }: { s: InvestorScenario; index: number }) {
  const cfg = SCENARIO_CONFIG[s.label] ?? SCENARIO_CONFIG["Base Case"];
  const roiPositive = s.roi_pct >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 space-y-2"
    >
      <div className={cn("text-xs font-semibold", cfg.accent)}>{s.label}</div>

      <div className="space-y-1.5">
        {/* CO₂ price */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-zinc-500">CO₂ price</span>
          <span className={cn("text-xs font-mono font-bold", cfg.accent)}>
            ${s.co2_price_usd}/t
          </span>
        </div>

        {/* ROI */}
        <div>
          <div className="flex justify-between items-baseline mb-0.5">
            <span className="text-xs text-zinc-500">ROI</span>
            <span className={cn(
              "text-xs font-mono font-bold",
              roiPositive ? cfg.accent : "text-red-400"
            )}>
              {roiPositive ? "+" : ""}{s.roi_pct}%
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", cfg.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, s.roi_pct / 4))}%` }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.08 }}
            />
          </div>
        </div>

        {/* NPV */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-zinc-500">NPV</span>
          <span className="text-xs font-mono text-zinc-300">
            {s.npv_usd_m >= 0 ? "+" : ""}${s.npv_usd_m}M
          </span>
        </div>

        {/* Payback */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-zinc-500">Payback</span>
          <span className="text-xs font-mono text-zinc-400">
            {s.payback_years >= 15 ? ">15 yr" : `${s.payback_years} yr`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function InvestorPanel({ intelligence }: InvestorPanelProps) {
  const cfg = RATING_CONFIG[intelligence.rating] ?? RATING_CONFIG["Hold"];
  const RatingIcon = cfg.icon;

  const irrAboveBenchmark = intelligence.irr_pct >= intelligence.comparable_irr_pct;
  const irrDelta = (intelligence.irr_pct - intelligence.comparable_irr_pct).toFixed(1);
  const maxIrr = Math.max(intelligence.irr_pct, intelligence.comparable_irr_pct, 20);

  return (
    <div className="space-y-4">
      {/* Rating badge */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border",
          cfg.bg, cfg.border
        )}
      >
        <RatingIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", cfg.text)} />
        <div className="flex-1 min-w-0">
          <div className={cn("text-sm font-bold", cfg.text)}>{intelligence.rating}</div>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {intelligence.rating_rationale}
          </p>
        </div>
      </motion.div>

      {/* IRR vs benchmark */}
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          IRR vs Benchmark
        </div>
        <div className="space-y-1.5">
          {/* Project IRR */}
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs text-zinc-400">This project</span>
              <span className={cn(
                "text-xs font-mono font-bold",
                irrAboveBenchmark ? "text-emerald-400" : "text-amber-400"
              )}>
                {intelligence.irr_pct}%
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={irrAboveBenchmark ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-amber-500"}
                initial={{ width: 0 }}
                animate={{ width: `${(intelligence.irr_pct / maxIrr) * 100}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
          </div>

          {/* Benchmark */}
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs text-zinc-500">Infrastructure avg</span>
              <span className="text-xs font-mono text-zinc-500">
                {intelligence.comparable_irr_pct}%
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-600"
                style={{ width: `${(intelligence.comparable_irr_pct / maxIrr) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className={cn(
          "mt-1.5 text-xs font-mono flex items-center gap-1",
          irrAboveBenchmark ? "text-emerald-400" : "text-amber-400"
        )}>
          {irrAboveBenchmark
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />
          }
          {irrAboveBenchmark ? "+" : ""}{irrDelta}% vs benchmark
        </div>
      </div>

      {/* Price scenarios */}
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          CO₂ Price Scenarios (2030)
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {intelligence.scenarios.map((s, i) => (
            <ScenarioCard key={s.label} s={s} index={i} />
          ))}
        </div>
      </div>

      {/* Investment thesis */}
      <div className="border-l-2 border-zinc-700 pl-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">
          Investment Thesis
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {intelligence.thesis}
        </p>
      </div>

      {/* Key risks */}
      {intelligence.key_risks.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Key Risks
          </div>
          <div className="space-y-1.5">
            {intelligence.key_risks.map((risk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex gap-2 text-xs text-zinc-400"
              >
                <span className="text-amber-500/60 flex-shrink-0 mt-0.5">▸</span>
                <span>{risk}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="text-xs font-mono text-zinc-600 pt-1 border-t border-zinc-800">
        {intelligence.model_used}
      </div>
    </div>
  );
}
