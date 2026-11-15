"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Satellite, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SatelliteVerification } from "@/lib/planetary/types";

interface SatellitePanelProps {
  satellite: SatelliteVerification;
}

const CONFIDENCE_CONFIG = {
  confirmed: { label: "Ground-Truth Confirmed",   bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  partial:   { label: "Partial Corroboration",    bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400"   },
  disputed:  { label: "Data Disputed",            bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400"     },
} as const;

function ndviColor(ndvi: number): string {
  if (ndvi >= 0.6) return "bg-emerald-500";
  if (ndvi >= 0.4) return "bg-lime-500";
  if (ndvi >= 0.25) return "bg-yellow-500";
  if (ndvi >= 0.1) return "bg-orange-500";
  return "bg-zinc-600";
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 55) return "text-amber-400";
  return "text-red-400";
}

function TileImage({ tile }: { tile: SatelliteVerification["tile_urls"][0] }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
        {!loaded && !errored && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
        {errored ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Satellite className="w-5 h-5 text-zinc-600" />
            <span className="text-xs text-zinc-600">NASA GIBS</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tile.url}
            alt={tile.label}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}
      </div>
      <div className="text-xs text-zinc-500 text-center leading-tight">{tile.label}</div>
    </div>
  );
}

export function SatellitePanel({ satellite }: SatellitePanelProps) {
  const cfg = CONFIDENCE_CONFIG[satellite.vegetation_confidence];
  const ndviTrend = satellite.ndvi_change >= 0.05
    ? "up"
    : satellite.ndvi_change <= -0.05
    ? "down"
    : "flat";

  const TrendIcon = ndviTrend === "up" ? TrendingUp : ndviTrend === "down" ? TrendingDown : Minus;
  const trendColor =
    ndviTrend === "up"   ? "text-emerald-400" :
    ndviTrend === "down" ? "text-red-400"      : "text-zinc-400";

  return (
    <div className="space-y-4">
      {/* Header: score + confidence */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium",
              cfg.bg, cfg.border, cfg.text
            )}
          >
            <Satellite className="w-3 h-3" />
            {cfg.label}
          </div>
          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
            {satellite.key_finding}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={cn("text-2xl font-bold font-mono", scoreColor(satellite.ground_truth_score))}>
            {satellite.ground_truth_score}
          </div>
          <div className="text-xs text-zinc-500">GT score</div>
        </div>
      </div>

      {/* NASA GIBS satellite tile gallery */}
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          NASA GIBS · MODIS Imagery
        </div>
        <div className="grid grid-cols-3 gap-2">
          {satellite.tile_urls.map((tile) => (
            <TileImage key={tile.date} tile={tile} />
          ))}
        </div>
      </div>

      {/* NDVI comparison */}
      <div className="space-y-2.5">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">NDVI Comparison</div>

        {/* Baseline */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400">Baseline (2015)</span>
            <span className="text-xs font-mono text-zinc-300">{satellite.ndvi_baseline.toFixed(3)}</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", ndviColor(satellite.ndvi_baseline))}
              initial={{ width: 0 }}
              animate={{ width: `${satellite.ndvi_baseline * 100}%` }}
              transition={{ duration: 0.7, delay: 0.1 }}
            />
          </div>
        </div>

        {/* Current */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400">Current (2024)</span>
            <span className="text-xs font-mono text-zinc-300">{satellite.ndvi_current.toFixed(3)}</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", ndviColor(satellite.ndvi_current))}
              initial={{ width: 0 }}
              animate={{ width: `${satellite.ndvi_current * 100}%` }}
              transition={{ duration: 0.7, delay: 0.25 }}
            />
          </div>
        </div>

        {/* Change badge */}
        <div className={cn("flex items-center gap-1.5 text-xs font-mono", trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>
            {satellite.ndvi_change >= 0 ? "+" : ""}
            {satellite.ndvi_change.toFixed(3)} NDVI over 9 years
          </span>
        </div>
      </div>

      {/* Year-by-year sparkline */}
      {satellite.yearly_ndvi.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Annual NDVI Trend
          </div>
          <div className="flex items-end gap-0.5 h-10">
            {satellite.yearly_ndvi.map((pt, i) => (
              <motion.div
                key={pt.year}
                title={`${pt.year}: ${pt.ndvi.toFixed(3)}`}
                className={cn("flex-1 rounded-sm", ndviColor(pt.ndvi))}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(8, pt.ndvi * 100)}%` }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-zinc-600">{satellite.yearly_ndvi[0]?.year}</span>
            <span className="text-xs text-zinc-600">{satellite.yearly_ndvi[satellite.yearly_ndvi.length - 1]?.year}</span>
          </div>
        </div>
      )}

      {/* Analysis */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Analysis</div>
        <p className="text-xs text-zinc-400 leading-relaxed">{satellite.analysis}</p>
        <div className="mt-2 text-xs font-mono text-zinc-600">{satellite.model_used}</div>
      </div>
    </div>
  );
}
