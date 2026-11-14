"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, X, RotateCcw, ZoomIn, ZoomOut, Globe2 } from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";
import type { DemoProject } from "@/lib/planetary/demoProjects";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

function ScoreMeter({ score, color }: { score: number; color: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width="60" height="60" viewBox="0 0 56 56" className="-rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <motion.circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

function ProjectPanel({ project, onClose }: { project: DemoProject; onClose: () => void }) {
  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
      className="absolute top-0 right-0 h-full w-96 bg-zinc-950/98 border-l border-zinc-800 overflow-y-auto"
    >
      {/* Panel header */}
      <div
        className="px-6 pt-6 pb-5 border-b border-zinc-800/60"
        style={{ background: `${project.scoreColor}08` }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{project.typeIcon}</span>
              <span className="text-base font-bold text-zinc-100 leading-tight">
                {project.name}
              </span>
            </div>
            <div className="text-sm text-zinc-400">{project.country}</div>
            <div className="text-xs text-zinc-600 mt-0.5">{project.type}</div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score meter */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <ScoreMeter score={project.score} color={project.scoreColor} />
            <div
              className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold"
              style={{ color: project.scoreColor, transform: "rotate(90deg)" }}
            >
              {project.score}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Impact Score</div>
            <div
              className="text-sm font-semibold px-2.5 py-1 rounded-full border inline-block"
              style={{
                color: project.gwColor,
                borderColor: project.gwColor + "40",
                background: project.gwColor + "12",
              }}
            >
              {project.gwLabel}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: project.scoreColor }}
            initial={{ width: 0 }}
            animate={{ width: `${project.score}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
      </div>

      {/* Panel body */}
      <div className="px-6 py-5 space-y-5">

        {/* Plain-language summary */}
        <div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            What this project does
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {project.simpleExplainer}
          </p>
        </div>

        <div className="h-px bg-zinc-800" />

        <div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            What we found
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {project.findingSummary}
          </p>
        </div>

        <div className="h-px bg-zinc-800" />

        {/* Metrics grid */}
        <div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Key Numbers
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500 mb-1.5">CO₂ Saved (10yr)</div>
              <div className="font-mono text-lg font-bold text-green-400">{project.co2}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500 mb-1.5">Total Investment</div>
              <div className="font-mono text-lg font-bold text-zinc-200">{project.investment}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 col-span-2">
              <div className="text-xs text-zinc-500 mb-1.5">Verdict</div>
              <div className="text-sm font-semibold" style={{ color: project.scoreColor }}>
                {project.score >= 75
                  ? "✓ Passes verification — claims are credible"
                  : project.score >= 50
                  ? "⚠ Partial — some overclaiming detected"
                  : "✗ Fails — significant greenwashing risk"}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/simulate/${project.simId}?intervention=${project.interventionId}&demo=1`}
          className="flex items-center justify-between w-full rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 text-sm text-zinc-200 transition-colors group"
        >
          <span className="font-medium">
            {project.isExampleOnly
              ? `See ${project.demoTypeLabel} Simulation`
              : "Open Full Physics Simulation"}
          </span>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function GlobePage() {
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<DemoProject | null>(null);
  const [selected, setSelected] = useState<DemoProject | null>(null);
  const [dims, setDims] = useState({ w: 1200, h: 800 });
  const selectedRef = useRef<DemoProject | null>(null);
  const isHoveringPin = useRef(false);

  useEffect(() => {
    function update() {
      setDims({ w: window.innerWidth, h: window.innerHeight - 56 });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = true;
    controls.minDistance = 100;
    controls.maxDistance = 700;
    controls.enablePan = false;
    globeRef.current.pointOfView({ lat: 10, lng: 20, altitude: 2.2 }, 0);

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
        { lat: project.lat, lng: project.lng - 15, altitude: 1.4 },
        1000
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
        globeRef.current.pointOfView({ lat: 10, lng: 20, altitude: 2.2 }, 800);
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      globeRef.current.pointOfView({ lat: 10, lng: 20, altitude: 2.2 }, 1000);
    }
  }, []);

  const handleZoom = useCallback((direction: "in" | "out") => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAlt = direction === "in"
      ? Math.max(0.3, pov.altitude * 0.65)
      : Math.min(5, pov.altitude * 1.5);
    globeRef.current.pointOfView({ ...pov, altitude: newAlt }, 500);
  }, []);

  const pointsData = DEMO_PROJECTS.map((p) => ({
    ...p,
    _size: selected?.id === p.id ? 1.2 : hovered?.id === p.id ? 1.0 : 0.65,
    _altitude: selected?.id === p.id ? 0.12 : hovered?.id === p.id ? 0.08 : 0.04,
  }));

  const ringsData = DEMO_PROJECTS.map((p) => ({
    ...p,
    maxR: 2.2,
    propagationSpeed: 1.0,
    repeatPeriod: 2000,
  }));

  return (
    <div className="relative overflow-hidden bg-zinc-950" style={{ height: "calc(100vh - 56px)" }}>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -12 }}
        transition={{ delay: 0.8 }}
        className="absolute top-4 left-4 z-10 flex items-center gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs">
          <Globe2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400 font-medium">{DEMO_PROJECTS.length} Projects Analysed</span>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs font-mono">
          <span className="text-green-400">
            {DEMO_PROJECTS.filter((p) => p.score >= 75).length} Pass
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-amber-400">
            {DEMO_PROJECTS.filter((p) => p.score >= 50 && p.score < 75).length} Partial
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-red-400">
            {DEMO_PROJECTS.filter((p) => p.score < 50).length} Fail
          </span>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: ready ? 1 : 0, x: ready ? 0 : 12 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-6 left-4 z-10 flex flex-col gap-2"
      >
        <button
          onClick={() => handleZoom("in")}
          className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-900/90 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-900/90 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-900/90 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Project list sidebar — left, collapsed when panel is open */}
      <AnimatePresence>
        {!selected && ready && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-6 right-4 z-10 w-56 space-y-1.5"
          >
            {DEMO_PROJECTS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePointClick(p)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span>{p.typeIcon}</span>
                  <span className="text-zinc-400 truncate">{p.country}</span>
                </span>
                <span
                  className="font-mono font-bold flex-shrink-0"
                  style={{ color: p.scoreColor }}
                >
                  {p.score}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading placeholder */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-72 h-72 rounded-full border border-zinc-800/60 animate-pulse" />
            <div className="absolute text-zinc-700 text-xs font-mono">Initialising Earth...</div>
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && !selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 right-4 w-60 rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 pointer-events-none z-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{hovered.typeIcon}</span>
              <span className="text-sm font-semibold text-zinc-100 leading-tight">{hovered.name}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-2xl font-bold" style={{ color: hovered.scoreColor }}>
                {hovered.score}
              </span>
              <span className="text-xs text-zinc-500">/100</span>
              <span
                className="ml-auto text-xs font-semibold"
                style={{ color: hovered.scoreColor }}
              >
                {hovered.gwLabel}
              </span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full"
                style={{ width: `${hovered.score}%`, backgroundColor: hovered.scoreColor }}
              />
            </div>
            <div className="text-xs text-zinc-500">{hovered.country}</div>
            <div className="text-xs text-zinc-700 mt-1.5 italic">Click to open analysis</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction hint */}
      {!hovered && !selected && ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-700 font-mono pointer-events-none"
        >
          Drag · Scroll to zoom · Click a pin to explore
        </motion.div>
      )}

      {/* Globe */}
      <Globe
        ref={globeRef}
        width={selected ? dims.w - 384 : dims.w}
        height={dims.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#60a5fa"
        atmosphereAltitude={0.15}
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
        ringsData={ringsData}
        ringColor={(d: any) => (t: number) =>
          `${d.scoreColor}${Math.round((1 - t) * 160).toString(16).padStart(2, "0")}`
        }
        ringMaxRadius={(d: any) => d.maxR}
        ringPropagationSpeed={(d: any) => d.propagationSpeed}
        ringRepeatPeriod={(d: any) => d.repeatPeriod}
        labelsData={DEMO_PROJECTS}
        labelText={(d: any) => `${d.score}`}
        labelSize={1.5}
        labelDotRadius={0}
        labelColor={(d: any) => d.scoreColor}
        labelAltitude={0.05}
        labelResolution={3}
        rendererConfig={{ antialias: true, alpha: true }}
      />

      {/* Details panel (right side-panel, slides in) */}
      <AnimatePresence>
        {selected && (
          <ProjectPanel project={selected} onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
