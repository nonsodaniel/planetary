"use client";

import { motion } from "framer-motion";
import { ChevronDown, ExternalLink, ScanLine } from "lucide-react";
import Link from "next/link";
import { GlobeHero } from "@/components/planetary/GlobeHero";
import { WorldMapSection } from "@/components/planetary/WorldMapSection";
import { InterventionForm } from "@/components/planetary/InterventionForm";

export default function HomePage() {
  return (
    <div className="bg-zinc-950">

      {/* ── Globe Hero — full viewport ──────────────────────────────────── */}
      <section className="relative h-[calc(100vh-48px)] overflow-hidden bg-zinc-950">
        {/* Title overlay */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute top-3 left-0 right-0 z-10 flex flex-col items-center text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono border border-zinc-800 bg-zinc-950/70 text-zinc-500 rounded-full px-2.5 py-0.5 mb-1.5">
            <span className="w-1 h-1 rounded-full bg-green-400" />
            NVIDIA NIM · Cosmos · cuOpt · Cala
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-200 leading-tight">
            Climate Verification
            <span className="text-zinc-500"> at Planetary Scale</span>
          </h1>
        </motion.div>

        {/* Globe — fills the section */}
        <GlobeHero />

        {/* Full globe CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute top-6 right-6 z-10"
        >
          <Link
            href="/globe"
            className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Full Globe View
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 text-zinc-700 pointer-events-none"
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

            {/* Scanner callout */}
            <div className="mb-5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-3">
              <div className="flex items-center gap-2 mb-1">
                <ScanLine className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-300">Greenwashing Scanner</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">NEW</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Paste a Verra project ID or name. Planetary scrapes the live registry
                via <span className="text-zinc-400">Context.dev</span> and auto-runs
                the full simulation pipeline.
              </p>
            </div>

            <div className="space-y-3 text-xs text-zinc-600">
              {[
                { n: "01", label: "Context.dev scrapes live registry" },
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
