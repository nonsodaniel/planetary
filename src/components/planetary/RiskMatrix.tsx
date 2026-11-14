"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RiskFactor, RiskSeverity } from "@/lib/planetary/types";

interface RiskMatrixProps {
  risks: RiskFactor[];
  overallRisk: RiskSeverity;
}

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bg: string; border: string; dot: string }> = {
  low:      { color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20", dot: "bg-emerald-400" },
  medium:   { color: "text-amber-400",   bg: "bg-amber-500/10",    border: "border-amber-500/20",   dot: "bg-amber-400" },
  high:     { color: "text-orange-400",  bg: "bg-orange-500/10",   border: "border-orange-500/20",  dot: "bg-orange-400" },
  critical: { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     dot: "bg-red-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  physical: "Physical",
  policy: "Policy",
  social: "Social",
  financial: "Financial",
  permanence: "Permanence",
  methodology: "Methodology",
};

export function RiskMatrix({ risks, overallRisk }: RiskMatrixProps) {
  const overallCfg = SEVERITY_CONFIG[overallRisk];

  // Sort: critical > high > medium > low
  const severityOrder: RiskSeverity[] = ["critical", "high", "medium", "low"];
  const sorted = [...risks].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <div className="space-y-4">
      {/* Overall risk */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        overallCfg.bg, overallCfg.border
      )}>
        <span className="text-xs text-zinc-500">Overall Risk Level</span>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", overallCfg.dot)} />
          <span className={cn("text-sm font-semibold capitalize", overallCfg.color)}>
            {overallRisk}
          </span>
        </div>
      </div>

      {/* Risk items */}
      <div className="space-y-2">
        {sorted.map((risk, i) => {
          const cfg = SEVERITY_CONFIG[risk.severity];
          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "rounded-lg border p-3",
                cfg.bg, cfg.border
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5", cfg.dot)} />
                    <span className="text-xs font-medium text-zinc-200 leading-tight">
                      {risk.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 pl-3.5">
                    {risk.description}
                  </p>
                  {risk.mitigation && (
                    <p className="text-xs text-zinc-600 mt-1.5 pl-3.5 italic">
                      Mitigation: {risk.mitigation}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={cn("text-xs font-semibold capitalize", cfg.color)}>
                    {risk.severity}
                  </div>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    {Math.round(risk.probability * 100)}% prob.
                  </div>
                  <div className="text-xs text-zinc-700 mt-0.5">
                    {CATEGORY_LABELS[risk.category]}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {risks.length === 0 && (
        <div className="text-center py-6 text-zinc-500 text-sm">
          No significant risks identified
        </div>
      )}
    </div>
  );
}
