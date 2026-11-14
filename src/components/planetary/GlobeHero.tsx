"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Dynamic import — react-globe.gl uses WebGL, cannot SSR
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface DemoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  color: string;
  gwLabel: string;
  co2: string;
  investment: string;
  simId: string;
  interventionId: string;
}

const DEMO_POINTS: DemoPoint[] = [
  {
    id: "congo",
    name: "Congo Basin Reforestation",
    lat: -2.5,
    lng: 23.8,
    score: 72,
    color: "#fbbf24",
    gwLabel: "Moderate Overclaim",
    co2: "1.1M tCO₂",
    investment: "$50M",
    simId: "demo_sim_congo",
    interventionId: "demo_congo",
  },
  {
    id: "sahara",
    name: "Saharan Solar Array — 500MW",
    lat: 33.2,
    lng: 9.1,
    score: 85,
    color: "#4ade80",
    gwLabel: "Claim Accurate",
    co2: "7.2M tCO₂",
    investment: "$200M",
    simId: "demo_sim_sahara",
    interventionId: "demo_sahara",
  },
  {
    id: "kariba",
    name: "Kariba REDD+ Credits",
    lat: -16.5,
    lng: 28.5,
    score: 32,
    color: "#f87171",
    gwLabel: "Greenwashing Detected",
    co2: "1.1M tCO₂",
    investment: "$30M",
    simId: "demo_sim_kariba",
    interventionId: "demo_kariba",
  },
];

interface GlobeHeroProps {
  onPointClick: (point: DemoPoint) => void;
}

export function GlobeHero({ onPointClick }: GlobeHeroProps) {
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<DemoPoint | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-rotate once globe is ready
  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = false;
    }
    // Start centered on Africa
    globeRef.current.pointOfView({ lat: 5, lng: 20, altitude: 2.2 }, 0);
  }, [ready]);

  const pointsData = DEMO_POINTS.map((p) => ({
    ...p,
    size: hovered?.id === p.id ? 0.9 : 0.6,
    altitude: hovered?.id === p.id ? 0.08 : 0.04,
  }));

  const ringsData = DEMO_POINTS.map((p) => ({
    ...p,
    maxR: 3,
    propagationSpeed: 1.5,
    repeatPeriod: 1200,
  }));

  return (
    <div className="relative w-full h-full">
      <Globe
        ref={globeRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? Math.min(window.innerHeight * 0.85, 800) : 700}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#1d4ed8"
        atmosphereAltitude={0.15}
        // Points
        pointsData={pointsData}
        pointColor={(d: any) => d.color}
        pointAltitude={(d: any) => d.altitude}
        pointRadius={(d: any) => d.size}
        pointResolution={12}
        onPointHover={(p: any) => setHovered(p as DemoPoint | null)}
        onPointClick={(p: any) => onPointClick(p as DemoPoint)}
        // Rings
        ringsData={ringsData}
        ringColor={(d: any) => (t: number) => `${d.color}${Math.round((1 - t) * 200).toString(16).padStart(2, "0")}`}
        ringMaxRadius={(d: any) => d.maxR}
        ringPropagationSpeed={(d: any) => d.propagationSpeed}
        ringRepeatPeriod={(d: any) => d.repeatPeriod}
        // Labels
        labelsData={DEMO_POINTS}
        labelText={(d: any) => `${d.score}`}
        labelSize={1.8}
        labelDotRadius={0}
        labelColor={(d: any) => d.color}
        labelAltitude={0.06}
        labelResolution={3}
        // Settings
        rendererConfig={{ antialias: true, alpha: true }}
      />

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-6 right-6 w-56 rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 pointer-events-none"
          >
            <div className="text-xs font-semibold text-zinc-100 mb-1">{hovered.name}</div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="font-mono text-2xl font-bold"
                style={{ color: hovered.color }}
              >
                {hovered.score}
              </span>
              <span className="text-xs text-zinc-500">/100</span>
            </div>
            <div className="text-xs" style={{ color: hovered.color }}>{hovered.gwLabel}</div>
            <div className="text-xs text-zinc-500 mt-1">{hovered.co2} · {hovered.investment}</div>
            <div className="text-xs text-zinc-600 mt-2">Click to open full analysis →</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction hint */}
      {!hovered && ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-600 font-mono"
        >
          Drag to rotate · Click a marker to explore
        </motion.div>
      )}
    </div>
  );
}
