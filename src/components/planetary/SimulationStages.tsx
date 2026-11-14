"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationStage, StageStatus } from "@/lib/planetary/types";

interface SimulationStagesProps {
  stages: StageStatus[];
  currentStage: SimulationStage;
  status: "pending" | "running" | "complete" | "error";
}

const PIPELINE_STAGES: { stage: SimulationStage; label: string; model: string; icon: string }[] = [
  { stage: "fetching_baseline", label: "Emissions Baseline", model: "Cala API", icon: "🛰️" },
  { stage: "running_nim", label: "Climate Inference", model: "NVIDIA NIM", icon: "🧠" },
  { stage: "running_cosmos", label: "World Simulation", model: "NVIDIA Cosmos", icon: "🌍" },
  { stage: "running_cuopt", label: "Placement Optimization", model: "NVIDIA cuOpt", icon: "⚡" },
  { stage: "scoring", label: "Impact Scoring", model: "Planetary Engine", icon: "📊" },
];

function getStageState(
  pipelineStage: SimulationStage,
  currentStage: SimulationStage,
  status: string,
  stages: StageStatus[]
): "pending" | "running" | "complete" | "error" {
  if (status === "complete") return "complete";
  if (status === "error" && currentStage === pipelineStage) return "error";

  const stageOrder: SimulationStage[] = [
    "fetching_baseline",
    "running_nim",
    "running_cosmos",
    "running_cuopt",
    "scoring",
    "complete",
  ];

  const currentIdx = stageOrder.indexOf(currentStage);
  const thisIdx = stageOrder.indexOf(pipelineStage);

  if (thisIdx < currentIdx) return "complete";
  if (thisIdx === currentIdx) return "running";
  return "pending";
}

function getDurationMs(stageStatus: StageStatus | undefined): number | null {
  if (!stageStatus?.started_at || !stageStatus.completed_at) return null;
  return (
    new Date(stageStatus.completed_at).getTime() -
    new Date(stageStatus.started_at).getTime()
  );
}

export function SimulationStages({ stages, currentStage, status }: SimulationStagesProps) {
  const isComplete = status === "complete";
  const totalMs = stages.reduce((s, st) => s + (getDurationMs(st) ?? 0), 0);

  return (
    <div className="space-y-1">
      {/* Pipeline header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">
          Simulation Pipeline
        </div>
        {isComplete && totalMs > 0 && (
          <div className="text-xs font-mono text-zinc-500">
            {(totalMs / 1000).toFixed(1)}s total
          </div>
        )}
        {!isComplete && status === "running" && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running...
          </div>
        )}
      </div>

      {/* Stage list */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-800" />

        <div className="space-y-1">
          {PIPELINE_STAGES.map((ps, i) => {
            const stageStatus = stages.find((s) => s.stage === ps.stage);
            const state = getStageState(ps.stage, currentStage, status, stages);
            const duration = getDurationMs(stageStatus);

            return (
              <motion.div
                key={ps.stage}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "relative flex items-start gap-3 pl-2 py-2.5 pr-3 rounded-lg transition-all",
                  state === "running" && "bg-zinc-800/50 border border-zinc-700",
                  state === "complete" && "opacity-70",
                  state === "pending" && "opacity-40",
                )}
              >
                {/* Stage icon */}
                <div className="relative z-10 flex-shrink-0">
                  {state === "complete" ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  ) : state === "running" ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <Circle className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Stage info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium",
                      state === "complete" ? "text-zinc-400" :
                      state === "running" ? "text-zinc-200" :
                      "text-zinc-600"
                    )}>
                      {ps.label}
                    </span>
                    {duration && (
                      <span className="text-xs font-mono text-zinc-600">
                        {(duration / 1000).toFixed(1)}s
                      </span>
                    )}
                    {state === "running" && (
                      <span className="text-xs text-blue-400 animate-pulse">running</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-600 mt-0.5">{ps.model}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Complete summary */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">All models complete</span>
        </motion.div>
      )}
    </div>
  );
}
