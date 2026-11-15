"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";
import type { DemoProject } from "@/lib/planetary/demoProjects";
import { useCountries } from "@/lib/planetary/useCountries";
import { COUNTRY_LABELS } from "@/lib/planetary/countryLabels";
import { SpaceBackground } from "./SpaceBackground";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────────
const HOME_VIEW = { lat: 10, lng: 20, altitude: 2.4 };
const CARD_W = 384;      // matches w-96
const CARD_H_EST = 300;  // approx card height, used for viewport clamping
const CARD_GAP = 18;     // distance between pin and card
const HIDE_DELAY = 220;  // grace period to move the cursor from pin onto the card

function detailHref(p: DemoProject) {
  return `/simulate/${p.simId}?intervention=${p.interventionId}&demo=1&project=${p.id}`;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function GlobeHero() {
  const router = useRouter();
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false); // gate for client-only content
  const [hasWebGL, setHasWebGL] = useState(true);
  const [active, setActive] = useState<DemoProject | null>(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const countries = useCountries();

  // Interaction state that drives auto-rotation (refs: no re-render needed)
  const activeRef = useRef<DemoProject | null>(null);
  const overSphere = useRef(false);
  const overCard = useRef(false);
  const dragging = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  /** Rotate only when the user isn't interacting with the globe. */
  const syncRotation = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate =
      !overSphere.current && !overCard.current && !dragging.current && !activeRef.current;
  }, []);

  const show = useCallback((p: DemoProject) => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    activeRef.current = p;
    setActive(p);
    const g = globeRef.current;
    const box = containerRef.current?.getBoundingClientRect();
    if (g && box) {
      const { x, y } = g.getScreenCoords(p.lat, p.lng, 0.08);
      const left = x > box.width / 2 ? x - CARD_W - CARD_GAP : x + CARD_GAP;
      const top = y - CARD_H_EST / 2;
      setAnchor({
        x: Math.max(8, Math.min(left, box.width - CARD_W - 8)),
        y: Math.max(8, Math.min(top, box.height - CARD_H_EST - 8)),
      });
    }
    syncRotation();
  }, [syncRotation]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      if (overCard.current) return;
      activeRef.current = null;
      setActive(null);
      syncRotation();
    }, HIDE_DELAY);
  }, [syncRotation]);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = false;
    controls.minDistance = 100;
    controls.maxDistance = 600;
    controls.enablePan = false;
    globeRef.current.pointOfView(HOME_VIEW, 0);

    const onStart = () => { dragging.current = true; syncRotation(); };
    const onEnd   = () => { dragging.current = false; syncRotation(); };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end",   onEnd);
    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end",   onEnd);
    };
  }, [ready, syncRotation]);

  // Intercept wheel events on the container so OrbitControls never sees them
  // (capture phase fires before the canvas bubble listeners) and relay the
  // delta to window.scrollBy so the page scrolls normally.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const relay = (e: WheelEvent) => {
      e.stopPropagation(); // prevent event reaching canvas / OrbitControls
      e.preventDefault();  // prevent browser double-scroll
      const dy =
        e.deltaMode === 1 ? e.deltaY * 40 :
        e.deltaMode === 2 ? e.deltaY * window.innerHeight :
        e.deltaY;
      window.scrollBy(0, dy);
    };
    container.addEventListener("wheel", relay, { capture: true, passive: false });
    return () => container.removeEventListener("wheel", relay, true);
  }, []);

  // Pause rotation while the cursor is over the sphere itself (not empty space)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const g = globeRef.current;
    if (!g) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let isOver = false;
    try {
      isOver = !!g.toGlobeCoords(e.clientX - rect.left, e.clientY - rect.top);
    } catch { /* globe not ready */ }
    if (isOver !== overSphere.current) {
      overSphere.current = isOver;
      syncRotation();
    }
  }, [syncRotation]);

  const handleMouseLeave = useCallback(() => {
    overSphere.current = false;
    syncRotation();
  }, [syncRotation]);

  const activeId = active?.id;
  const pointsData = useMemo(() => DEMO_PROJECTS.map((p) => ({
    ...p,
    _size:     activeId === p.id ? 1.0 : 0.6,
    _altitude: activeId === p.id ? 0.09 : 0.04,
  })), [activeId]);

  const ringsData = useMemo(() => DEMO_PROJECTS.map((p) => ({
    ...p,
    maxR: 2, propagationSpeed: 1.0, repeatPeriod: 2000,
  })), []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: active ? "pointer" : undefined }}
    >
      {/* Space backdrop — stars, nebulas, planets (client-only to avoid hydration mismatch) */}
      {mounted && <SpaceBackground />}

      {/* WebGL not available fallback */}
      {mounted && !hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-6">
            <div className="text-5xl mb-4">🌍</div>
            <div className="text-zinc-200 font-semibold mb-2">Interactive Globe Unavailable</div>
            <div className="text-zinc-500 text-sm max-w-xs">
              Your browser doesn&apos;t support WebGL. Try Chrome, Firefox, or Edge for the full experience.
            </div>
          </div>
        </div>
      )}

      {/* Loading shimmer */}
      {!ready && hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-80 h-80 rounded-full border border-zinc-800 animate-pulse opacity-30" />
        </div>
      )}

      {/* Globe */}
      {hasWebGL && <Globe
        ref={globeRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? window.innerHeight - 48 : 800}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#60a5fa"
        atmosphereAltitude={0.18}
        polygonsData={countries}
        polygonAltitude={0.001}
        polygonCapColor={(d: any) => {
          const match = DEMO_PROJECTS.find((p) => p.countryCode === String(d.id));
          return match ? match.scoreColor + "28" : "rgba(255,255,255,0.025)";
        }}
        polygonSideColor={() => "rgba(0,0,0,0)"}
        polygonStrokeColor={() => "#3f3f46"}
        polygonLabel={() => ""}
        pointsData={pointsData}
        pointColor={(d: any) => d.scoreColor}
        pointAltitude={(d: any) => d._altitude}
        pointRadius={(d: any) => d._size}
        pointResolution={12}
        pointLabel={() => ""}   // disable globe.gl's built-in tooltip
        onPointHover={(p: any) => {
          if (p) show(p as DemoProject);
          else scheduleHide();
        }}
        onPointClick={(p: any) => router.push(detailHref(p as DemoProject))}
        ringsData={ringsData}
        ringColor={(d: any) => (t: number) =>
          `${d.scoreColor}${Math.round((1 - t) * 160).toString(16).padStart(2, "0")}`
        }
        ringMaxRadius={(d: any) => d.maxR}
        ringPropagationSpeed={(d: any) => d.propagationSpeed}
        ringRepeatPeriod={(d: any) => d.repeatPeriod}
        labelsData={[...COUNTRY_LABELS, ...DEMO_PROJECTS]}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelText={(d: any) => d._type === "country" ? d.name : `${d.score}`}
        labelLabel={() => ""}   // disable globe.gl's built-in tooltip
        labelSize={(d: any) => d._type === "country" ? 1.0 : 1.5}
        labelDotRadius={0}
        labelColor={(d: any) => d._type === "country" ? "rgba(255,255,255,0.45)" : d.scoreColor}
        labelAltitude={(d: any) => d._type === "country" ? 0.01 : 0.05}
        labelResolution={3}
        backgroundColor="rgba(0,0,0,0)"
        rendererConfig={{ antialias: true, alpha: true }}
      />}

      {/* ── Details popup — the single popup, shown on pin hover, click → detail page ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-20 w-96"
            style={{ left: anchor.x, top: anchor.y }}
            onMouseEnter={() => {
              overCard.current = true;
              if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
              syncRotation();
            }}
            onMouseLeave={() => {
              overCard.current = false;
              scheduleHide();
            }}
          >
            <Link
              href={detailHref(active)}
              className="block rounded-2xl border bg-zinc-950 p-5 shadow-2xl shadow-black/60 ring-1 ring-black/40 group"
              style={{ borderColor: active.scoreColor + "50" }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg leading-none">{active.typeIcon}</span>
                    <span className="text-sm font-bold text-zinc-100">{active.name}</span>
                  </div>
                  <div className="text-xs text-zinc-300">{active.country} · {active.type}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-mono text-3xl font-bold leading-none"
                    style={{ color: active.scoreColor }}
                  >
                    {active.score}
                  </div>
                  <div className="text-xs text-zinc-400">/100</div>
                </div>
              </div>

              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: active.scoreColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${active.score}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              <div
                className="inline-block text-xs px-2.5 py-1 rounded-full border font-semibold mb-3"
                style={{
                  color: active.gwColor,
                  borderColor: active.gwColor + "40",
                  background: active.gwColor + "12",
                }}
              >
                {active.gwLabel}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-zinc-900 border border-zinc-700/70 p-3">
                  <div className="text-xs font-semibold text-zinc-200 mb-1">What it does</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{active.simpleExplainer}</p>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-700/70 p-3">
                  <div className="text-xs font-semibold text-zinc-200 mb-1">What we found</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{active.findingSummary}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs mb-4">
                <span className="text-zinc-400">CO₂ (10yr)</span>
                <span className="font-mono font-semibold text-green-400">{active.co2}</span>
                <span className="w-px h-3 bg-zinc-800" />
                <span className="text-zinc-400">Cost</span>
                <span className="font-mono font-semibold text-zinc-300">{active.investment}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 group-hover:bg-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition-colors">
                <span>
                  {active.isExampleOnly
                    ? `See ${active.demoTypeLabel} Analysis`
                    : "View Full Simulation"}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction hint */}
      {!active && ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-200 font-mono pointer-events-none"
        >
          Drag to rotate · Hover a pin for details · Click to open
        </motion.div>
      )}
    </div>
  );
}
