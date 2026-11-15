"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, Shield } from "lucide-react";
import { cn, fmtNum, greenwashingColor } from "@/lib/utils";
import type { ClaimVerification } from "@/lib/planetary/types";

interface ClaimVerifierProps {
  verification: ClaimVerification;
}

const RISK_CONFIG = {
  none:     { icon: CheckCircle, label: "Accurate",        bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  low:      { icon: Shield,      label: "Minor Variance",  bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  moderate: { icon: Info,        label: "Moderate Overclaim", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  high:     { icon: AlertTriangle, label: "High Risk",     bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  severe:   { icon: AlertTriangle, label: "⚠️ GREENWASHING DETECTED", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
};

export function ClaimVerifier({ verification }: ClaimVerifierProps) {
  const cfg = RISK_CONFIG[verification.greenwashing_risk];
  const Icon = cfg.icon;
  const isSevere = verification.greenwashing_risk === "high" || verification.greenwashing_risk === "severe";
  const claimedBar = 100;
  const simulatedBar = Math.min(100, (verification.simulated_annual_co2_tons / (verification.claimed_annual_co2_tons || 1)) * 100);

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border",
          cfg.bg, cfg.border
        )}
      >
        <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", cfg.text)} />
        <div>
          <div className={cn("text-sm font-semibold", cfg.text)}>{cfg.label}</div>
          {isSevere && (
            <div className="text-xs text-zinc-400 mt-0.5">
              Project claims <span className={cfg.text}>{(1 / verification.accuracy_ratio).toFixed(1)}×</span> its physics-simulated impact
            </div>
          )}
        </div>
        <div className={cn("ml-auto text-right")}>
          <div className={cn("text-lg font-mono font-bold", cfg.text)}>
            {Math.round(verification.accuracy_ratio * 100)}%
          </div>
          <div className="text-xs text-zinc-500">accuracy</div>
        </div>
      </motion.div>

      {/* Bar comparison */}
      <div className="space-y-3">
        {/* Claimed */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400">Claimed (by proponent)</span>
            <span className="text-xs font-mono text-amber-400">
              {fmtNum(verification.claimed_annual_co2_tons)} tCO₂/yr
            </span>
          </div>
          <div className="h-6 bg-zinc-800 rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-amber-500/40 border-r-2 border-amber-400 flex items-center justify-end pr-2"
              style={{ width: `${claimedBar}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${claimedBar}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-xs font-mono text-amber-300">Claimed</span>
            </motion.div>
          </div>
        </div>

        {/* Simulated */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400">Simulated (NVIDIA NIM)</span>
            <span className="text-xs font-mono text-blue-400">
              {fmtNum(verification.simulated_annual_co2_tons)} tCO₂/yr
            </span>
          </div>
          <div className="h-6 bg-zinc-800 rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-blue-500/30 border-r-2 border-blue-400 flex items-center justify-end pr-2"
              initial={{ width: 0 }}
              animate={{ width: `${simulatedBar}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {simulatedBar > 20 && (
                <span className="text-xs font-mono text-blue-300">Simulated</span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Discrepancy callout */}
      {verification.discrepancy_pct > 10 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-3"
        >
          <div className="text-xs text-zinc-500 mb-1">Gap Analysis</div>
          <div className="font-mono text-sm text-zinc-200">
            Project <span className={cfg.text}>overclaims by {verification.discrepancy_pct.toFixed(0)}%</span>
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {fmtNum(verification.claimed_annual_co2_tons - verification.simulated_annual_co2_tons)} tCO₂/yr unverifiable
          </div>
        </motion.div>
      )}

      {/* Evidence */}
      {verification.evidence.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Evidence</div>
          <div className="space-y-2">
            {verification.evidence.slice(0, 3).map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex gap-2 text-xs text-zinc-400"
              >
                <span className="text-zinc-500 mt-0.5 flex-shrink-0">▸</span>
                <span>{e}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Cala sources */}
      {verification.cala_sources.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Sources</div>
          <div className="space-y-1.5">
            {verification.cala_sources.slice(0, 2).map((s, i) => (
              <div key={i} className="rounded-md bg-zinc-900 border border-zinc-800 p-2.5">
                <div className="text-xs font-medium text-zinc-300">{s.document}</div>
                <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.snippet}</div>
                <div className="text-xs text-zinc-500 mt-1 font-mono">via Cala</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
