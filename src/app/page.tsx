import { InterventionForm } from "@/components/planetary/InterventionForm";
import { Zap, Shield, TrendingUp, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* NVIDIA badge */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5 text-xs font-mono border border-green-500/30 bg-green-500/5 text-green-400 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Powered by NVIDIA NIM · Cosmos · cuOpt
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-4 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            <span className="text-slate-100">Stop trusting</span>
            <br />
            <span
              className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              marketing claims.
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-400 leading-relaxed">
            Planetary simulates the <strong className="text-slate-200">10-year physical downstream effects</strong> of
            any climate intervention using NVIDIA world models —
            and scores investments by actual impact, not promises.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 justify-center mb-12 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-mono">40–90%</span>
            carbon credits overclaim their impact
          </div>
          <div className="text-slate-700">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-mono">$500B+</span>
            flows into climate investments annually
          </div>
          <div className="text-slate-700">·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 font-mono">1 tool</span>
            exists to verify before you invest
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
            <InterventionForm />
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-10 justify-center">
          {[
            { icon: Globe,      label: "NVIDIA Cosmos world simulation",    color: "text-blue-400" },
            { icon: Zap,        label: "cuOpt placement optimization",      color: "text-purple-400" },
            { icon: Shield,     label: "Greenwashing detection",            color: "text-red-400" },
            { icon: TrendingUp, label: "Planetary Impact Score™",           color: "text-cyan-400" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 text-xs border border-slate-700/50 bg-slate-900/40 rounded-full px-3 py-1.5 text-slate-400"
            >
              <f.icon className={`w-3 h-3 ${f.color}`} />
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-800/60 px-6 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest text-center mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[
            { step: "01", title: "Input Intervention", desc: "Define type, location, scale, and any existing claims.", icon: "📍", color: "border-slate-700" },
            { step: "02", title: "Cala Baseline", desc: "Fetch real project data and emissions benchmarks.", icon: "🛰️", color: "border-blue-500/30" },
            { step: "03", title: "NVIDIA NIM", desc: "Climate physics inference: 10-year trajectory via LLM + IPCC.", icon: "🧠", color: "border-cyan-500/30" },
            { step: "04", title: "Cosmos Worlds", desc: "Simulate ecosystem snapshots at years 0 → 1 → 5 → 10.", icon: "🌍", color: "border-purple-500/30" },
            { step: "05", title: "Impact Score", desc: "Planetary Impact Score™ with greenwashing risk flag.", icon: "📊", color: "border-emerald-500/30" },
          ].map((step, i) => (
            <div
              key={step.step}
              className={`relative flex flex-col items-center text-center p-4 rounded-xl border bg-slate-900/40 ${step.color}`}
            >
              {i < 4 && (
                <div className="hidden sm:block absolute top-1/2 -right-2 text-slate-700 text-sm z-10">→</div>
              )}
              <div className="text-2xl mb-2">{step.icon}</div>
              <div className="text-xs font-mono text-slate-600 mb-1">{step.step}</div>
              <div className="text-xs font-semibold text-slate-300 mb-1">{step.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 px-6 py-6 text-center text-xs text-slate-600">
        <div>Planetary · Climate Decision Engine · Built for Global Hackathon 2024</div>
        <div className="mt-1 font-mono">
          NVIDIA NIM · Cosmos · cuOpt · Cala API · Next.js 15
        </div>
      </footer>
    </div>
  );
}
