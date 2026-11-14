"use client";

import { useState } from "react";
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

export function WorldMapSection() {
  const [active, setActive] = useState<DemoProject | null>(null);

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
          <div className="lg:col-span-8 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "auto" }}
              projectionConfig={{ scale: 150, center: [15, 10] }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo) => {
                    const id = geo.id?.toString();
                    const project = DEMO_PROJECTS.find(
                      (p) => p.countryCode === id
                    );
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
                  })
                }
              </Geographies>

              {DEMO_PROJECTS.map((p) => (
                <Marker
                  key={p.id}
                  coordinates={[p.lng, p.lat]}
                  onClick={() => toggle(p)}
                >
                  <motion.g
                    animate={{ scale: active?.id === p.id ? 1.4 : 1 }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle r={5} fill={p.scoreColor} opacity={0.9} />
                    <circle r={9} fill={p.scoreColor} opacity={0.18} />
                    <circle
                      r={13}
                      fill="none"
                      stroke={p.scoreColor}
                      strokeWidth={1}
                      opacity={0.35}
                    />
                  </motion.g>
                </Marker>
              ))}
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

                    {/* CTA */}
                    <Link
                      href={`/simulate/${active.simId}?intervention=${active.interventionId}&demo=1`}
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
