"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterventionForm } from "@/components/planetary/InterventionForm";
import { cn } from "@/lib/utils";

// Hard-coded from demo scenarios — scores are pre-computed physics results
const DEMO_CARDS = [
  {
    id: "demo_sim_congo",
    interventionId: "demo_congo",
    name: "Congo Basin Reforestation",
    location: "Democratic Republic of Congo",
    type: "Reforestation · 500,000 ha",
    investment: "$50M",
    score: 72,
    tierLabel: "Gold",
    tierColor: "text-amber-400",
    tierBg: "bg-amber-400/10",
    tierBorder: "border-amber-400/30",
    co2: "1.1M tCO₂",
    costPerTon: "$23/t",
    greenwashing: "moderate" as const,
    gwLabel: "Moderate Overclaim",
    gwColor: "text-amber-400",
    gwBg: "bg-amber-400/10",
    gwBorder: "border-amber-400/30",
    claimedRatio: null,
    desc: "Claims 2M tCO₂/yr; physics simulation yields 1.1M tCO₂/yr at maturity.",
  },
  {
    id: "demo_sim_sahara",
    interventionId: "demo_sahara",
    name: "Saharan Solar Array — 500MW",
    location: "Tunisia",
    type: "Solar Farm · 500 MW",
    investment: "$200M",
    score: 85,
    tierLabel: "Gold",
    tierColor: "text-amber-400",
    tierBg: "bg-amber-400/10",
    tierBorder: "border-amber-400/30",
    co2: "7.2M tCO₂",
    costPerTon: "$28/t",
    greenwashing: "none" as const,
    gwLabel: "Claim Accurate",
    gwColor: "text-green-400",
    gwBg: "bg-green-400/10",
    gwBorder: "border-green-400/30",
    claimedRatio: null,
    desc: "DESERTEC HVDC interconnect to European grid. Modeled capacity factor 26.4% vs claimed 27%.",
  },
  {
    id: "demo_sim_kariba",
    interventionId: "demo_kariba",
    name: "Kariba REDD+ Forest Credits",
    location: "Zimbabwe",
    type: "Carbon Credits · 785,000 ha",
    investment: "$30M",
    score: 32,
    tierLabel: "Flagged",
    tierColor: "text-red-400",
    tierBg: "bg-red-400/10",
    tierBorder: "border-red-400/30",
    co2: "1.1M tCO₂",
    costPerTon: "$85/t",
    greenwashing: "severe" as const,
    gwLabel: "Greenwashing Detected",
    gwColor: "text-red-400",
    gwBg: "bg-red-500/10",
    gwBorder: "border-red-500/30",
    claimedRatio: 4.5,
    desc: "Claims 4.9M tCO₂/yr; inflated deforestation baseline. Physics simulation: 1.1M tCO₂/yr.",
  },
];

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width="52" height="52" viewBox="0 0 48 48" className="-rotate-90 flex-shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <motion.circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-56px)]">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left: Headline + CTA */}
          <div className="flex flex-col justify-center lg:sticky lg:top-20 lg:py-8">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono border border-zinc-700 bg-zinc-900 text-zinc-400 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                NVIDIA NIM · Cosmos · cuOpt
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.08] text-zinc-100 mb-5">
              Stop trusting<br />
              <span className="text-zinc-400">marketing</span><br />
              claims.
            </h1>

            <p className="text-base text-zinc-500 leading-relaxed mb-8 max-w-md">
              Planetary uses NVIDIA world models to simulate the{" "}
              <span className="text-zinc-300">10-year physical effects</span> of any climate investment —
              detecting greenwashing before it costs you.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Globe,      label: "Cosmos world simulation" },
                { icon: Zap,        label: "cuOpt placement optimizer" },
                { icon: Shield,     label: "Greenwashing detection" },
                { icon: TrendingUp, label: "Impact Score™" },
              ].map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 border border-zinc-800 rounded-full px-3 py-1.5"
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </span>
              ))}
            </div>

            <div className="space-y-3 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="text-zinc-200 font-mono num font-semibold">40–90%</span>
                of carbon credits overclaim their actual impact
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-200 font-mono num font-semibold">$500B+</span>
                flows into climate investments annually
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono num font-semibold">0</span>
                independent physics-based verification tools existed — until now
              </div>
            </div>
          </div>

          {/* Right: Live Demo cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Live Analysis Examples</div>
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                Run your own <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {DEMO_CARDS.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                >
                  <Link
                    href={`/simulate/${card.id}?intervention=${card.interventionId}&demo=1`}
                    className="block rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all p-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Score ring */}
                      <div className="relative flex-shrink-0">
                        <ScoreRing
                          score={card.score}
                          color={
                            card.score >= 75 ? "#fbbf24" :
                            card.score >= 60 ? "#a1a1aa" :
                            card.score >= 45 ? "#f97316" :
                            "#ef4444"
                          }
                        />
                        <div
                          className={cn("absolute inset-0 flex items-center justify-center font-mono text-xs font-bold", card.tierColor)}
                          style={{ transform: "rotate(0deg)" }}
                        >
                          {card.score}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors leading-tight">
                            {card.name}
                          </span>
                          <span className={cn(
                            "flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold",
                            card.gwBg, card.gwBorder, card.gwColor
                          )}>
                            {card.gwLabel}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-500 mb-2">
                          {card.type} · {card.location} · {card.investment}
                        </div>

                        {/* Score bar */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              className={cn(
                                "h-full rounded-full",
                                card.score >= 75 ? "bg-amber-400" :
                                card.score >= 45 ? "bg-orange-400" :
                                "bg-red-400"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${card.score}%` }}
                              transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-xs text-zinc-600 font-mono">/100</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>
                            <span className="text-green-400 font-mono num">{card.co2}</span>
                            {" "}simulated (10yr)
                          </span>
                          <span className="text-zinc-700">·</span>
                          <span>{card.costPerTon}</span>
                          {card.claimedRatio && (
                            <>
                              <span className="text-zinc-700">·</span>
                              <span className="text-red-400 font-mono">Claims {card.claimedRatio}× real</span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-zinc-600 mt-1.5 line-clamp-1">{card.desc}</p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-3 text-center text-xs text-zinc-700">
              Click any card to see the full physics simulation
            </div>
          </div>
        </div>
      </section>

      {/* ── Simulation Form ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Run a simulation</h2>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
              Input any climate intervention. Planetary runs a 5-stage NVIDIA pipeline and
              returns a physics-verified Impact Score in seconds.
            </p>
            <div className="space-y-3 text-xs text-zinc-600">
              {[
                { n: "01", label: "Cala fetches real emissions baseline" },
                { n: "02", label: "NIM runs climate physics inference" },
                { n: "03", label: "Cosmos simulates world state at yr 0→10" },
                { n: "04", label: "cuOpt finds optimal placement zones" },
                { n: "05", label: "Planetary Impact Score™ computed" },
              ].map((s) => (
                <div key={s.n} className="flex gap-3 items-center">
                  <span className="font-mono text-zinc-700">{s.n}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <InterventionForm />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-700">
        <div>Planetary · Climate Decision Engine · NVIDIA × Cala Hackathon 2024</div>
        <div className="mt-1 font-mono">
          NVIDIA NIM · Cosmos World Foundation Model · cuOpt · Cala Knowledge API
        </div>
      </footer>
    </div>
  );
}
