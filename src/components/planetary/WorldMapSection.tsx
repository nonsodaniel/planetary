"use client";

import { useState, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";
import type { DemoProject } from "@/lib/planetary/demoProjects";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const HIGHLIGHTED = new Set(DEMO_PROJECTS.map((p) => p.countryCode));

// Per-marker label direction so crowded clusters (Europe, South Asia) stay readable.
// nx/ny = country-name text offset; sx/sy = score text offset; anchor = text-anchor.
const LABEL_DIR: Record<string, {
  nx: number; ny: number;
  sx: number; sy: number;
  anchor: "start" | "end" | "middle";
}> = {
  congo:      { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  },
  sahara:     { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  },
  kariba:     { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  },
  amazon:     { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  },
  rajasthan:  { nx:   0, ny: -15, sx:   0, sy:  -6, anchor: "middle" }, // above — clears Bangladesh below
  sundarbans: { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  },
  dogger:     { nx: -15, ny: -12, sx: -15, sy:  -3, anchor: "end"    }, // upper-left into Atlantic
  sweden:     { nx: -15, ny:  -1, sx: -15, sy:   8, anchor: "end"    }, // left — away from Finland
  finland:    { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  }, // right — into eastern space
  boreal:     { nx:  15, ny:  -1, sx:  15, sy:   8, anchor: "start"  },
};

function GeoShape({
  geo,
  project,
  isHighlighted,
  isActive,
  onClick,
}: {
  geo: any;
  project: DemoProject | undefined;
  isHighlighted: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);

  const fill = isActive
    ? (project?.scoreColor ?? "#3f3f46") + "40"
    : hov && isHighlighted
    ? (project?.scoreColor ?? "#3f3f46") + "35"
    : isHighlighted
    ? (project?.scoreColor ?? "#3f3f46") + "20"
    : hov
    ? "#3f3f46"
    : "#27272a";

  const stroke =
    isActive || (hov && isHighlighted)
      ? project?.scoreColor ?? "#52525b"
      : isHighlighted
      ? (project?.scoreColor ?? "#52525b") + "80"
      : "#3f3f46";

  return (
    <Geography
      geography={geo}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        default: {
          fill,
          stroke,
          strokeWidth: isHighlighted ? 1.5 : 0.5,
          outline: "none",
          cursor: isHighlighted ? "pointer" : "default",
          transition: "fill 0.15s, stroke 0.15s",
        },
        hover: { fill, stroke, strokeWidth: isHighlighted ? 2 : 0.5, outline: "none" },
        pressed: { fill: (project?.scoreColor ?? "#3f3f46") + "50", outline: "none" },
      } as any}
    />
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
      {/* Rough continent outlines as placeholder blobs */}
      <div className="relative w-full h-full overflow-hidden opacity-20">
        {[
          { w: "22%", h: "28%", left: "12%", top: "30%", r: "40% 60% 55% 45%/45% 40% 60% 55%" },
          { w: "18%", h: "30%", left: "16%", top: "15%", r: "50% 50% 55% 45%/45% 55% 45% 55%" },
          { w: "28%", h: "35%", left: "43%", top: "10%", r: "45% 55% 50% 50%/50% 45% 55% 50%" },
          { w: "14%", h: "32%", left: "75%", top: "15%", r: "50% 50% 50% 50%/40% 60% 40% 60%" },
          { w: "10%", h: "22%", left: "35%", top: "52%", r: "45% 55% 60% 40%/40% 60% 45% 55%" },
          { w: "20%", h: "30%", left: "60%", top: "50%", r: "50% 50% 55% 45%/50% 45% 55% 50%" },
        ].map((blob, i) => (
          <div
            key={i}
            className="absolute bg-zinc-700 animate-pulse"
            style={{
              width: blob.w,
              height: blob.h,
              left: blob.left,
              top: blob.top,
              borderRadius: blob.r,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-700 font-mono">
        Loading map data…
      </div>
    </div>
  );
}

export function WorldMapSection() {
  const [active, setActive] = useState<DemoProject | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapLoadedRef = useRef(false);

  const toggle = (p: DemoProject) =>
    setActive((prev) => (prev?.id === p.id ? null : p));

  return (
    <section className="border-t border-zinc-800 bg-zinc-950 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Explore by Region</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Click any highlighted country to see what we found
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" /> Accurate claims
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Overclaiming
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Greenwashing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map */}
          <div className="lg:col-span-8 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden relative min-h-[260px]">
            {/* Skeleton shown until geographies load */}
            {!mapLoaded && <MapSkeleton />}

            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "auto", display: mapLoaded ? "block" : "none" }}
              projectionConfig={{ scale: 150, center: [15, 10] }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) => {
                  // Mark map as loaded on first non-empty render
                  if (geographies.length > 0 && !mapLoadedRef.current) {
                    mapLoadedRef.current = true;
                    setTimeout(() => setMapLoaded(true), 0);
                  }
                  return geographies.map((geo) => {
                    const id = geo.id?.toString();
                    const project = DEMO_PROJECTS.find((p) => p.countryCode === id);
                    return (
                      <GeoShape
                        key={geo.rsmKey}
                        geo={geo}
                        project={project}
                        isHighlighted={HIGHLIGHTED.has(id)}
                        isActive={active?.countryCode === id}
                        onClick={() => project && toggle(project)}
                      />
                    );
                  });
                }}
              </Geographies>

              {DEMO_PROJECTS.map((p) => {
                const dir = LABEL_DIR[p.id] ?? { nx: 15, ny: -1, sx: 15, sy: 8, anchor: "start" };
                return (
                  <Marker
                    key={p.id}
                    coordinates={[p.lng, p.lat]}
                    onClick={() => toggle(p)}
                  >
                    <motion.g
                      animate={{ scale: active?.id === p.id ? 1.4 : 1 }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Dot + rings */}
                      <circle r={5} fill={p.scoreColor} opacity={0.9} />
                      <circle r={9} fill={p.scoreColor} opacity={0.18} />
                      <circle
                        r={13}
                        fill="none"
                        stroke={p.scoreColor}
                        strokeWidth={1}
                        opacity={0.35}
                      />

                      {/* Country name */}
                      <text
                        x={dir.nx}
                        y={dir.ny}
                        textAnchor={dir.anchor}
                        style={{
                          fontFamily: "ui-monospace, monospace",
                          fontSize: 7,
                          fontWeight: 700,
                          fill: p.scoreColor,
                          stroke: "#09090b",
                          strokeWidth: 3,
                          paintOrder: "stroke fill",
                          pointerEvents: "none",
                          userSelect: "none",
                        } as React.CSSProperties}
                      >
                        {p.country}
                      </text>

                      {/* Score */}
                      <text
                        x={dir.sx}
                        y={dir.sy}
                        textAnchor={dir.anchor}
                        style={{
                          fontFamily: "ui-monospace, monospace",
                          fontSize: 6,
                          fontWeight: 600,
                          fill: p.scoreColor,
                          stroke: "#09090b",
                          strokeWidth: 2.5,
                          paintOrder: "stroke fill",
                          opacity: 0.85,
                          pointerEvents: "none",
                          userSelect: "none",
                        } as React.CSSProperties}
                      >
                        {p.score}/100
                      </text>
                    </motion.g>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border bg-zinc-900 overflow-hidden"
                  style={{ borderColor: active.scoreColor + "40" }}
                >
                  {/* Score header */}
                  <div
                    className="px-5 py-4"
                    style={{ background: `${active.scoreColor}10` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>{active.typeIcon}</span>
                          <span className="text-sm font-semibold text-zinc-100 leading-tight">
                            {active.name}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500">{active.country}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="font-mono text-3xl font-bold leading-none"
                          style={{ color: active.scoreColor }}
                        >
                          {active.score}
                        </div>
                        <div className="text-xs text-zinc-600">/100</div>
                      </div>
                    </div>
                    <ScoreBar score={active.score} color={active.scoreColor} />
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    {/* Type tag */}
                    <div className="text-xs text-zinc-500">{active.type}</div>

                    {/* Verdict */}
                    <div
                      className="inline-block text-xs px-2.5 py-1 rounded-full border font-semibold"
                      style={{
                        color: active.gwColor,
                        borderColor: active.gwColor + "40",
                        background: active.gwColor + "12",
                      }}
                    >
                      {active.gwLabel}
                    </div>

                    {/* Simple explainers */}
                    <div className="space-y-2">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="text-xs font-semibold text-zinc-500 mb-1">What it does</div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {active.simpleExplainer}
                        </p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="text-xs font-semibold text-zinc-500 mb-1">What we found</div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {active.findingSummary}
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="text-xs text-zinc-600 mb-1">CO₂ (10yr)</div>
                        <div className="font-mono text-sm font-semibold text-green-400">
                          {active.co2}
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="text-xs text-zinc-600 mb-1">Investment</div>
                        <div className="font-mono text-sm font-semibold text-zinc-200">
                          {active.investment}
                        </div>
                      </div>
                    </div>

                    {/* CTA — includes project id so the simulate page shows the right details */}
                    <Link
                      href={`/simulate/${active.simId}?intervention=${active.interventionId}&demo=1&project=${active.id}`}
                      className="flex items-center justify-between w-full rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition-colors group"
                    >
                      <span>
                        {active.isExampleOnly
                          ? `See ${active.demoTypeLabel} Analysis`
                          : "View Full Simulation"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 h-56 flex flex-col items-center justify-center text-center px-6"
                >
                  <div className="text-2xl mb-3">🌍</div>
                  <p className="text-sm text-zinc-500">
                    Click a highlighted country to see what our simulation found
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Project list pills */}
            <div className="mt-4 space-y-1.5">
              {DEMO_PROJECTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggle(p)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all",
                    active?.id === p.id
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{p.typeIcon}</span>
                    <span>{p.country}</span>
                  </span>
                  <span className="font-mono font-semibold" style={{ color: p.scoreColor }}>
                    {p.score}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
