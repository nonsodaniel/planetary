"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { GlobeHero } from "@/components/planetary/GlobeHero";
import { WorldMapSection } from "@/components/planetary/WorldMapSection";
import { InterventionForm } from "@/components/planetary/InterventionForm";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="bg-zinc-950">

      {/* ── Globe Hero — full viewport ──────────────────────────────────── */}
      <section className="relative h-[calc(100vh-56px)] overflow-hidden bg-zinc-950">
        {/* Title overlay */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute top-8 left-0 right-0 z-10 flex flex-col items-center text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-mono border border-zinc-700 bg-zinc-950/80 text-zinc-400 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            NVIDIA NIM · Cosmos · cuOpt · Cala
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-tight">
            Climate Verification
            <br />
            <span className="text-zinc-400">at Planetary Scale</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-3 max-w-sm leading-relaxed">
            Simulate the 10-year physical effects of any climate investment.
            Detect greenwashing before it costs you.
          </p>
        </motion.div>

        {/* Globe — fills the section */}
        <GlobeHero
          onPointClick={(point) => {
            router.push(
              `/simulate/${point.simId}?intervention=${point.interventionId}&demo=1`
            );
          }}
        />

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-600 pointer-events-none"
        >
          <span className="text-xs font-mono">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── World Map Section ────────────────────────────────────────────── */}
      <WorldMapSection />

      {/* ── Simulation Form ─────────────────────────────────────────────── */}
      <section className="border-t border-zinc-800 max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Run a simulation</h2>
            <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
              Input any climate intervention. Planetary runs a 5-stage NVIDIA
              pipeline and returns a physics-verified Impact Score in seconds.
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

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-700">
        <div>Planetary · Climate Decision Engine · NVIDIA × Cala Hackathon 2024</div>
        <div className="mt-1 font-mono">
          NVIDIA NIM · Cosmos World Foundation Model · cuOpt · Cala Knowledge API
        </div>
      </footer>
    </div>
  );
}
