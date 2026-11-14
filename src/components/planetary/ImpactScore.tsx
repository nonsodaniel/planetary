"use client";

import { motion } from "framer-motion";
import { cn, scoreTierMeta } from "@/lib/utils";
import type { ScoreBreakdown, ScoreTier } from "@/lib/planetary/types";

interface ImpactScoreProps {
  score: number;
  tier: ScoreTier;
  breakdown: ScoreBreakdown;
  className?: string;
}

const SCORE_WEIGHTS = [
  { key: "carbon_effectiveness", label: "Carbon Effectiveness", max: 30 },
  { key: "additionality", label: "Additionality", max: 20 },
  { key: "permanence", label: "Permanence", max: 20 },
  { key: "biodiversity", label: "Biodiversity", max: 15 },
  { key: "community_benefit", label: "Community Benefit", max: 10 },
  { key: "verification_quality", label: "Verification Quality", max: 5 },
] as const;

function getScoreColor(score: number): string {
  if (score >= 75) return "#fbbf24"; // gold/amber
  if (score >= 60) return "#94a3b8"; // silver
  if (score >= 45) return "#f97316"; // orange/bronze
  if (score >= 30) return "#f59e0b"; // amber warning
  return "#ef4444"; // red
}

export function ImpactScore({ score, tier, breakdown, className }: ImpactScoreProps) {
  const tierMeta = scoreTierMeta(tier);
  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Radial Score Ring */}
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background track */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* Score arc */}
          <motion.circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={scoreColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            style={{
            }}
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 90].map((tick) => {
            const angle = (tick / 100) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + 46 * Math.cos(rad);
            const y1 = 60 + 46 * Math.sin(rad);
            const x2 = 60 + 54 * Math.cos(rad);
            const y2 = 60 + 54 * Math.sin(rad);
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="font-mono text-4xl font-bold"
            style={{ color: scoreColor }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
            / 100
          </div>
        </div>
      </div>

      {/* Tier badge */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={cn(
          "mt-3 px-4 py-1.5 rounded-full border text-sm font-semibold",
          tierMeta.bg,
          tierMeta.border,
          tierMeta.color
        )}
      >
        {tierMeta.label} Tier
      </motion.div>

      {/* Score breakdown */}
      <div className="mt-6 w-full space-y-2.5">
        {SCORE_WEIGHTS.map((item, i) => {
          const value = breakdown[item.key];
          const pct = (value / item.max) * 100;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-400">{item.label}</span>
                <span className="text-xs font-mono text-zinc-300">
                  {value}<span className="text-zinc-600">/{item.max}</span>
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      pct >= 70 ? "#34d399" :
                      pct >= 40 ? "#fbbf24" :
                      "#ef4444",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.7 + i * 0.08, duration: 0.6 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 w-full pt-3 border-t border-zinc-800 flex justify-between items-center">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Score</span>
        <span className={cn("font-mono font-semibold text-lg", tierMeta.color)}>
          {breakdown.total}<span className="text-zinc-600 text-sm">/100</span>
        </span>
      </div>
    </div>
  );
}
