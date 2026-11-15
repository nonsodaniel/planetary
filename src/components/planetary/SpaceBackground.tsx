"use client";

import { motion } from "framer-motion";

// ── Deterministic starfield ───────────────────────────────────────────────────
function sr(n: number): number {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}
const STARS = Array.from({ length: 220 }, (_, i) => ({
  id: i,
  x: sr(i * 2.1 + 1) * 100,
  y: sr(i * 3.7 + 2) * 100,
  r: sr(i * 5.3 + 3) * 1.6 + 0.35,
  o: sr(i * 7.9 + 4) * 0.55 + 0.08,
  twinkle: i % 5 === 0,
  dur: sr(i * 11.3 + 5) * 3 + 2,
  delay: sr(i * 13.7 + 6) * 4,
}));

const NEBULAS = [
  { key: "a", x: "6%",  y: "12%", w: 340, h: 280, color: "rgba(96,165,250,0.055)",  blur: 48 },
  { key: "b", x: "68%", y: "52%", w: 260, h: 220, color: "rgba(167,139,250,0.045)", blur: 36 },
  { key: "c", x: "40%", y: "5%",  w: 300, h: 200, color: "rgba(52,211,153,0.03)",   blur: 60 },
];

// Static corner/edge planets (both variants)
const EDGE_PLANETS = [
  {
    key: "mars",
    x: "79%", y: "13%", r: 7,
    bg: "radial-gradient(circle at 35% 32%, #fbbf24, #92400e)",
    shadow: "0 0 14px rgba(251,191,36,0.5), 0 0 4px rgba(251,191,36,0.8)",
  },
  {
    key: "neptune",
    x: "11%", y: "70%", r: 5,
    bg: "radial-gradient(circle at 35% 32%, #a5f3fc, #0369a1)",
    shadow: "0 0 12px rgba(165,243,252,0.45)",
  },
  {
    key: "violet",
    x: "88%", y: "75%", r: 3.5,
    bg: "radial-gradient(circle at 35% 32%, #d8b4fe, #581c87)",
    shadow: "0 0 10px rgba(216,180,254,0.4)",
  },
];

// ── Globe variant: full solar system (five orbit rings) ───────────────────────
type SolarPlanet = {
  key: string; orbitVmin: number; size: number; period: number;
  bg: string; shadow: string; startDeg: number;
  skipRing?: boolean;   // skip drawing the orbit ring (second planet on shared orbit)
  rings?: string[];     // ring band colours outer→inner (Saturn-style)
};

const SOLAR_PLANETS: SolarPlanet[] = [
  { key: "sol_mercury", orbitVmin: 20, size: 4,  period: 8,  bg: "#cbd5e1",           shadow: "0 0 8px rgba(203,213,225,0.9),  0 0 3px rgba(203,213,225,1)",   startDeg: 45  },
  { key: "sol_venus",   orbitVmin: 27, size: 6,  period: 14, bg: "radial-gradient(circle at 38% 35%, #fde68a, #d97706)", shadow: "0 0 10px rgba(253,230,138,0.75), 0 0 4px rgba(251,191,36,0.9)",   startDeg: 200 },
  { key: "sol_mars",    orbitVmin: 35, size: 4.5,period: 22, bg: "radial-gradient(circle at 38% 35%, #fca5a5, #991b1b)", shadow: "0 0 9px rgba(252,165,165,0.75),  0 0 3px rgba(248,113,113,0.9)",  startDeg: 290 },
  { key: "sol_jupiter", orbitVmin: 44, size: 10, period: 37, bg: "radial-gradient(circle at 38% 32%, #fed7aa, #9a3412)", shadow: "0 0 14px rgba(254,215,170,0.55), 0 0 5px rgba(251,146,60,0.7)",   startDeg: 130 },
  // ── Outer orbit — two planets share orbitVmin: 46 ──
  {
    key: "sol_neptune", orbitVmin: 46, size: 9, period: 68,
    bg: "radial-gradient(circle at 36% 32%, #bfdbfe, #1d4ed8 52%, #0c1a4a 88%)",
    shadow: "0 0 18px rgba(147,197,253,0.55), 0 0 6px rgba(96,165,250,0.75)",
    startDeg: 40,
  },
  {
    key: "sol_saturn", orbitVmin: 46, size: 12, period: 86,
    bg: "radial-gradient(circle at 36% 32%, #fef3c7, #ca8a04 46%, #78350f 86%)",
    shadow: "0 0 20px rgba(254,243,199,0.4), 0 0 8px rgba(234,179,8,0.6)",
    startDeg: 215, skipRing: true,
    rings: ["rgba(202,138,4,0.38)", "rgba(202,138,4,0.18)"],
  },
];

// ── Compact realistic moon (used in globe-page background) ────────────────────
function BackgroundMoon() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top: "10%", left: "6%" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        style={{
          filter:
            "drop-shadow(0 0 12px rgba(210,210,200,0.52)) drop-shadow(0 0 5px rgba(220,220,210,0.65))",
        }}
      >
        <div
          style={{
            width: 58, height: 58,
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            background: `radial-gradient(circle at 36% 30%,
              #f0efec 0%, #d8d4cc 16%, #c0bab0 32%,
              #a09890 50%, #787070 66%, #484040 80%, #181010 96%)`,
            boxShadow:
              "inset -5px -4px 16px rgba(0,0,0,0.55), 0 0 24px rgba(210,210,200,0.18)",
          }}
        >
          {/* Mare Imbrium */}
          <div style={{ position:"absolute", top:"16%", left:"10%", width:"35%", height:"30%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(50,46,42,0.62) 0%, transparent 72%)", filter:"blur(2px)" }}/>
          {/* Mare Serenitatis */}
          <div style={{ position:"absolute", top:"10%", left:"44%", width:"24%", height:"22%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(46,42,38,0.55) 0%, transparent 70%)", filter:"blur(1.5px)" }}/>
          {/* Mare Tranquillitatis */}
          <div style={{ position:"absolute", top:"30%", left:"45%", width:"26%", height:"22%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(48,44,40,0.5) 0%, transparent 70%)", filter:"blur(1.5px)" }}/>
          {/* Oceanus Procellarum */}
          <div style={{ position:"absolute", top:"26%", left:"4%", width:"30%", height:"38%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(46,42,38,0.48) 0%, transparent 70%)", filter:"blur(3px)" }}/>
          {/* Crater Tycho */}
          <div style={{ position:"absolute", top:"60%", left:"30%", width:"11%", height:"11%", borderRadius:"50%", background:"radial-gradient(circle, #686460 0%, #aaa 45%, rgba(210,206,200,0.35) 72%, transparent 100%)" }}/>
          {/* Crater Copernicus */}
          <div style={{ position:"absolute", top:"36%", left:"20%", width:"9%", height:"9%", borderRadius:"50%", background:"radial-gradient(circle, #646260 0%, #a8a4a0 50%, transparent 80%)" }}/>
          {/* Shadow overlay */}
          <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(ellipse at 65% 62%, transparent 22%, rgba(0,0,0,0.24) 52%, rgba(0,0,0,0.58) 80%)" }}/>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SpaceBackground({ variant = "basic" }: { variant?: "basic" | "globe" }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Nebula blobs */}
      {NEBULAS.map((n) => (
        <div
          key={n.key}
          className="absolute rounded-full"
          style={{
            left: n.x, top: n.y,
            width: n.w, height: n.h,
            background: `radial-gradient(ellipse, ${n.color} 0%, transparent 70%)`,
            filter: `blur(${n.blur}px)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Stars */}
      {STARS.map((s) =>
        s.twinkle ? (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2 }}
            animate={{ opacity: [s.o, s.o * 0.15, s.o] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ) : (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, opacity: s.o }}
          />
        )
      )}

      {/* Edge planetary bodies (both variants) */}
      {EDGE_PLANETS.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-full"
          style={{
            left: p.x, top: p.y,
            width: p.r * 2, height: p.r * 2,
            background: p.bg,
            boxShadow: p.shadow,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* ── Globe variant: full solar system + moon ── */}
      {variant === "globe" && (
        <>
          <BackgroundMoon />
          {SOLAR_PLANETS.map((planet) => (
            <div key={planet.key}>
              {/* Orbit ring — rendered only once per orbital radius */}
              {!planet.skipRing && (
                <div
                  className="absolute rounded-full"
                  style={{
                    left: "50%", top: "50%",
                    width: `${planet.orbitVmin * 2}vmin`,
                    height: `${planet.orbitVmin * 2}vmin`,
                    transform: "translate(-50%, -50%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                />
              )}
              {/* Rotating arm */}
              <motion.div
                className="absolute"
                style={{
                  left: "50%", top: "50%",
                  width: `${planet.orbitVmin * 2}vmin`,
                  height: `${planet.orbitVmin * 2}vmin`,
                  marginLeft: `-${planet.orbitVmin}vmin`,
                  marginTop: `-${planet.orbitVmin}vmin`,
                  transformOrigin: "center",
                }}
                initial={{ rotate: planet.startDeg }}
                animate={{ rotate: planet.startDeg + 360 }}
                transition={{ repeat: Infinity, duration: planet.period, ease: "linear" }}
              >
                {planet.rings ? (
                  /* Ringed planet (Saturn-style) */
                  <div
                    className="absolute"
                    style={{
                      top: 0, left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: planet.size * 2.6,
                      height: planet.size * 2.6,
                    }}
                  >
                    {/* Ring bands — flattened ellipse (scaleY simulates orbital tilt) */}
                    {planet.rings.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          inset: `${i * 14}%`,
                          borderRadius: "50%",
                          border: `${3 - i}px solid ${color}`,
                          transform: "scaleY(0.28)",
                        }}
                      />
                    ))}
                    {/* Planet sphere on top of rings */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: planet.size, height: planet.size,
                        borderRadius: "50%",
                        background: planet.bg,
                        boxShadow: planet.shadow,
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="absolute rounded-full"
                    style={{
                      top: 0, left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: planet.size, height: planet.size,
                      background: planet.bg,
                      boxShadow: planet.shadow,
                    }}
                  />
                )}
              </motion.div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
