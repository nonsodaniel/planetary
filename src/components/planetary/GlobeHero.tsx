"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, ArrowRight, ExternalLink } from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";
import type { DemoProject } from "@/lib/planetary/demoProjects";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export function GlobeHero() {
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<DemoProject | null>(null);
  const [selected, setSelected] = useState<DemoProject | null>(null);
  // Refs to avoid stale closures in event listeners
  const selectedRef = useRef<DemoProject | null>(null);
  const isHoveringPin = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = true;
    controls.minDistance = 100;
    controls.maxDistance = 600;
    controls.enablePan = false;
    globeRef.current.pointOfView({ lat: 10, lng: 20, altitude: 2.4 }, 0);

    // Pause rotation while user is dragging or zooming; resume when they stop
    const onStart = () => { controls.autoRotate = false; };
    const onEnd   = () => {
      if (!selectedRef.current && !isHoveringPin.current) {
        controls.autoRotate = true;
      }
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end",   onEnd);
    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end",   onEnd);
    };
  }, [ready]);

  const handlePointClick = useCallback((p: any) => {
    const project = p as DemoProject;
    selectedRef.current = project;
    setSelected(project);
    setHovered(null);
    isHoveringPin.current = false;
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) controls.autoRotate = false;
      globeRef.current.pointOfView(
        { lat: project.lat - 6, lng: project.lng, altitude: 1.5 },
        900
      );
    }
  }, []);

  const handleClose = useCallback(() => {
    selectedRef.current = null;
    setSelected(null);
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        globeRef.current.pointOfView({ lat: 10, lng: 20, altitude: 2.4 }, 800);
      }
    }
  }, []);

  const pointsData = DEMO_PROJECTS.map((p) => ({
    ...p,
    _size: selected?.id === p.id ? 1.1 : hovered?.id === p.id ? 0.9 : 0.6,
    _altitude: selected?.id === p.id ? 0.11 : hovered?.id === p.id ? 0.07 : 0.04,
  }));

  const ringsData = DEMO_PROJECTS.map((p) => ({
    ...p,
    maxR: 2,
    propagationSpeed: 1.0,
    repeatPeriod: 2000,
  }));

  return (
    <div className="relative w-full h-full">
      {/* Loading shimmer */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-80 rounded-full border border-zinc-800 animate-pulse opacity-40" />
        </div>
      )}

      <Globe
        ref={globeRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? window.innerHeight - 48 : 800}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#60a5fa"
        atmosphereAltitude={0.15}
        // Points
        pointsData={pointsData}
        pointColor={(d: any) => d.scoreColor}
        pointAltitude={(d: any) => d._altitude}
        pointRadius={(d: any) => d._size}
        pointResolution={12}
        onPointHover={(p: any) => {
          if (selected) return;
          const proj = p as DemoProject | null;
          isHoveringPin.current = !!proj;
          setHovered(proj);
          if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) controls.autoRotate = !proj;
          }
        }}
        onPointClick={handlePointClick}
        // Rings (pulsing halos)
        ringsData={ringsData}
        ringColor={(d: any) => (t: number) =>
          `${d.scoreColor}${Math.round((1 - t) * 160).toString(16).padStart(2, "0")}`
        }
        ringMaxRadius={(d: any) => d.maxR}
        ringPropagationSpeed={(d: any) => d.propagationSpeed}
        ringRepeatPeriod={(d: any) => d.repeatPeriod}
        // Score labels
        labelsData={DEMO_PROJECTS}
        labelText={(d: any) => `${d.score}`}
        labelSize={1.5}
        labelDotRadius={0}
        labelColor={(d: any) => d.scoreColor}
        labelAltitude={0.05}
        labelResolution={3}
        rendererConfig={{ antialias: true, alpha: true }}
      />

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && !selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-6 right-6 w-56 rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{hovered.typeIcon}</span>
              <span className="text-xs font-semibold text-zinc-100 leading-tight">{hovered.name}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-2xl font-bold" style={{ color: hovered.scoreColor }}>
                {hovered.score}
              </span>
              <span className="text-xs text-zinc-500">/100</span>
            </div>
            <div className="text-xs font-semibold" style={{ color: hovered.scoreColor }}>
              {hovered.gwLabel}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{hovered.country}</div>
            <div className="text-xs text-zinc-700 mt-2 italic">Click to open analysis</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click details overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-20"
          >
            <div
              className="rounded-2xl border bg-zinc-950/98 p-5 shadow-2xl"
              style={{ borderColor: selected.scoreColor + "50" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg leading-none">{selected.typeIcon}</span>
                    <span className="text-sm font-bold text-zinc-100">{selected.name}</span>
                  </div>
                  <div className="text-xs text-zinc-500">{selected.country} · {selected.type}</div>
                </div>
                <div className="flex items-start gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div
                      className="font-mono text-3xl font-bold leading-none"
                      style={{ color: selected.scoreColor }}
                    >
                      {selected.score}
                    </div>
                    <div className="text-xs text-zinc-600">/100</div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: selected.scoreColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${selected.score}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              {/* Verdict badge */}
              <div
                className="inline-block text-xs px-2.5 py-1 rounded-full border font-semibold mb-3"
                style={{
                  color: selected.gwColor,
                  borderColor: selected.gwColor + "40",
                  background: selected.gwColor + "12",
                }}
              >
                {selected.gwLabel}
              </div>

              {/* Two-column explainers */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                  <div className="text-xs font-semibold text-zinc-400 mb-1">What it does</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{selected.simpleExplainer}</p>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                  <div className="text-xs font-semibold text-zinc-400 mb-1">What we found</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{selected.findingSummary}</p>
                </div>
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-3 text-xs mb-4">
                <span className="text-zinc-600">CO₂ (10yr)</span>
                <span className="font-mono font-semibold text-green-400">{selected.co2}</span>
                <span className="w-px h-3 bg-zinc-800" />
                <span className="text-zinc-600">Cost</span>
                <span className="font-mono font-semibold text-zinc-300">{selected.investment}</span>
              </div>

              {/* CTA row */}
              <div className="flex gap-2">
                <Link
                  href={`/simulate/${selected.simId}?intervention=${selected.interventionId}&demo=1`}
                  className="flex-1 flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition-colors group"
                >
                  <span>
                    {selected.isExampleOnly
                      ? `See ${selected.demoTypeLabel} Analysis`
                      : "View Full Simulation"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/globe"
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Map
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction hint */}
      {!hovered && !selected && ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-700 font-mono pointer-events-none"
        >
          Drag · Scroll to zoom · Click a pin to explore
        </motion.div>
      )}
    </div>
  );
}
