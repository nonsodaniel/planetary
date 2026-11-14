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

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ProjectCard {
  id: string;
  simId: string;
  interventionId: string;
  countryCode: string; // ISO 3166-1 numeric
  name: string;
  country: string;
  type: string;
  score: number;
  scoreColor: string;
  gwLabel: string;
  gwColor: string;
  co2: string;
  investment: string;
  lat: number;
  lng: number;
  desc: string;
}

const PROJECTS: ProjectCard[] = [
  {
    id: "congo",
    simId: "demo_sim_congo",
    interventionId: "demo_congo",
    countryCode: "180", // DRC
    name: "Congo Basin Reforestation",
    country: "Democratic Republic of Congo",
    type: "Reforestation · 500,000 ha",
    score: 72,
    scoreColor: "#fbbf24",
    gwLabel: "Moderate Overclaim",
    gwColor: "#fbbf24",
    co2: "1.1M tCO₂",
    investment: "$50M · 10yr",
    lat: -2.5,
    lng: 23.8,
    desc: "Claims 2M tCO₂/yr; NVIDIA NIM simulation yields 1.1M tCO₂/yr at forest maturity.",
  },
  {
    id: "sahara",
    simId: "demo_sim_sahara",
    interventionId: "demo_sahara",
    countryCode: "788", // Tunisia
    name: "Saharan Solar Array — 500MW",
    country: "Tunisia",
    type: "Solar Farm · 500 MW · DESERTEC",
    score: 85,
    scoreColor: "#4ade80",
    gwLabel: "Claim Accurate",
    gwColor: "#4ade80",
    co2: "7.2M tCO₂",
    investment: "$200M · 10yr",
    lat: 33.2,
    lng: 9.1,
    desc: "HVDC interconnect to European grid. Modeled capacity factor 26.4% vs claimed 27%. Highly accurate.",
  },
  {
    id: "kariba",
    simId: "demo_sim_kariba",
    interventionId: "demo_kariba",
    countryCode: "716", // Zimbabwe
    name: "Kariba REDD+ Credits",
    country: "Zimbabwe",
    type: "Carbon Credits · 785,000 ha",
    score: 32,
    scoreColor: "#f87171",
    gwLabel: "⚠ Greenwashing Detected",
    gwColor: "#f87171",
    co2: "1.1M tCO₂",
    investment: "$30M · 10yr",
    lat: -16.5,
    lng: 28.5,
    desc: "Claims 4.9M tCO₂/yr based on inflated baselines. Physics simulation: 1.1M tCO₂/yr (4.5× overclaim).",
  },
];

const HIGHLIGHTED = new Set(PROJECTS.map((p) => p.countryCode));

function GeoShape({
  geo,
  project,
  isHighlighted,
  isActive,
  onClick,
}: {
  geo: any;
  project: ProjectCard | undefined;
  isHighlighted: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const fill = isActive
    ? (project?.scoreColor ?? "#3f3f46") + "40"
    : hovered && isHighlighted
    ? (project?.scoreColor ?? "#3f3f46") + "35"
    : isHighlighted
    ? (project?.scoreColor ?? "#3f3f46") + "20"
    : hovered
    ? "#3f3f46"
    : "#27272a";

  const stroke = hovered && isHighlighted
    ? project?.scoreColor ?? "#52525b"
    : isHighlighted
    ? (project?.scoreColor ?? "#52525b") + "80"
    : hovered
    ? "#52525b"
    : "#3f3f46";

  return (
    <Geography
      geography={geo}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        default: { fill, stroke, strokeWidth: isHighlighted ? 1.5 : 0.5, outline: "none", cursor: isHighlighted ? "pointer" : "default", transition: "fill 0.15s ease, stroke 0.15s ease" },
        hover: { fill, stroke, strokeWidth: isHighlighted ? 2 : 0.5, outline: "none", cursor: isHighlighted ? "pointer" : "default" },
        pressed: { fill: (project?.scoreColor ?? "#3f3f46") + "50", outline: "none" },
      } as any}
    />
  );
}

export function WorldMapSection() {
  const [active, setActive] = useState<ProjectCard | null>(null);

  return (
    <section className="border-t border-zinc-800 bg-zinc-950 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Explore by Region</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Click a highlighted country to see its climate analysis
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" /> Accurate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Overclaim
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
                    const project = PROJECTS.find((p) => p.countryCode === id);
                    const isHighlighted = HIGHLIGHTED.has(id);
                    const isActive = active?.countryCode === id;

                    return (
                      <GeoShape
                        key={geo.rsmKey}
                        geo={geo}
                        project={project}
                        isHighlighted={isHighlighted}
                        isActive={isActive}
                        onClick={() => project && setActive(isActive ? null : project)}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Markers */}
              {PROJECTS.map((p) => (
                <Marker
                  key={p.id}
                  coordinates={[p.lng, p.lat]}
                  onClick={() => setActive(active?.id === p.id ? null : p)}
                >
                  <motion.g
                    animate={{ scale: active?.id === p.id ? 1.3 : 1 }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle r={5} fill={p.scoreColor} opacity={0.9} />
                    <circle r={9} fill={p.scoreColor} opacity={0.2} />
                    <circle
                      r={13}
                      fill="none"
                      stroke={p.scoreColor}
                      strokeWidth={1}
                      opacity={0.4}
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-zinc-100 leading-tight mb-1">
                          {active.name}
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

                    {/* Score bar */}
                    <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: active.scoreColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${active.score}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    {/* Type */}
                    <div className="text-xs text-zinc-500">{active.type}</div>

                    {/* Greenwashing label */}
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

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
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

                    {/* Description */}
                    <p className="text-xs text-zinc-500 leading-relaxed">{active.desc}</p>

                    {/* CTA */}
                    <Link
                      href={`/simulate/${active.simId}?intervention=${active.interventionId}&demo=1`}
                      className="flex items-center justify-between w-full rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition-colors group"
                    >
                      <span>View Full Analysis</span>
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
                  className="rounded-xl border border-zinc-800 bg-zinc-900 h-64 flex flex-col items-center justify-center text-center px-6"
                >
                  <div className="text-2xl mb-3">🌍</div>
                  <p className="text-sm text-zinc-500">
                    Click a highlighted country on the map to see its climate analysis
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Project list pills */}
            <div className="mt-4 space-y-2">
              {PROJECTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActive(active?.id === p.id ? null : p)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all",
                    active?.id === p.id
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.scoreColor }} />
                    {p.country}
                  </span>
                  <span className="font-mono" style={{ color: p.scoreColor }}>{p.score}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
