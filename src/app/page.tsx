import Link from "next/link";
import { ArrowRight, ScanLine, CheckCircle2, AlertTriangle, XCircle, Search, FlaskConical, BarChart3 } from "lucide-react";
import { GlobeHero } from "@/components/planetary/GlobeHero";
import { WorldMapSection } from "@/components/planetary/WorldMapSection";
import { InterventionForm } from "@/components/planetary/InterventionForm";
import { GlobeHeroOverlay } from "@/components/planetary/GlobeHeroOverlay";
import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";

const PASS_COUNT    = DEMO_PROJECTS.filter((p) => p.score >= 75).length;
const PARTIAL_COUNT = DEMO_PROJECTS.filter((p) => p.score >= 50 && p.score < 75).length;
const FAIL_COUNT    = DEMO_PROJECTS.filter((p) => p.score < 50).length;

// One card from each verdict tier for the "Real results" section
const EXAMPLE_FAIL    = DEMO_PROJECTS.find((p) => p.id === "kariba")!;   // score 32
const EXAMPLE_PARTIAL = DEMO_PROJECTS.find((p) => p.id === "congo")!;    // score 72
const EXAMPLE_PASS    = DEMO_PROJECTS.find((p) => p.id === "dogger")!;   // score 91

export default function HomePage() {
  return (
    <div className="bg-zinc-950">

      {/* ── Globe Hero — full viewport ──────────────────────────────── */}
      <section className="relative h-[calc(100vh-48px)] overflow-hidden bg-zinc-950">
        <GlobeHeroOverlay />
        <GlobeHero />
      </section>

      {/* ── THE PROBLEM ─────────────────────────────────────────────── */}
      <section className="border-t border-zinc-800 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">

          <div className="inline-block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-6 px-3 py-1 rounded-full border border-zinc-800">
            The Problem
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-zinc-100 leading-tight mb-6">
            Most climate credits<br />
            <span className="text-red-400">don&apos;t do what they claim.</span>
          </h2>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-5">
            Every year, companies pay billions for <strong className="text-zinc-200">carbon credits</strong> to
            &ldquo;offset&rdquo; their pollution. The idea: pay someone else to plant trees or build solar farms,
            so you don&apos;t have to cut your own emissions.
          </p>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-12">
            The reality:{" "}
            <span className="text-zinc-100 font-semibold">independent research shows most credits overstate their
            impact by 2–5×.</span>{" "}
            Forests that were never at risk. Trees that were already there. Numbers that were simply made up.
            That&apos;s <span className="text-red-400 font-semibold">greenwashing</span> — paying for impact
            that doesn&apos;t exist.
          </p>

          {/* Real-world stat callout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { emoji: "📋", label: "Carbon credits sold", value: "10,000 tCO₂" },
              { emoji: "🔬", label: "CO₂ actually removed", value: "~2,200 tCO₂" },
              { emoji: "❌", label: "Credits that check out", value: "≈ 22%" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="font-mono text-xl font-bold text-zinc-100 mb-1">{item.value}</div>
                <div className="text-xs text-zinc-500 leading-snug">{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-sm text-zinc-700 mt-5">
            Based on independent analyses of Verra-certified REDD+ projects (Science, 2023 · Guardian, 2023)
          </p>
        </div>
      </section>

      {/* ── THE SOLUTION ────────────────────────────────────────────── */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 py-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">
            <div className="inline-block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-6 px-3 py-1 rounded-full border border-zinc-800">
              How Planetary Helps
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-100 leading-tight mb-6">
              We verify climate projects<br />
              <span className="text-green-400">using real physics.</span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Give us any climate project — a forest, a solar farm, a carbon credit scheme.
              We simulate its actual physics using NVIDIA AI models and return a verified score.
              No marketing. Just numbers.
            </p>
          </div>

          {/* 3 simple steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "Step 1",
                icon: Search,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                title: "Find the project",
                desc: "We pull real data directly from official climate registries like Verra and Gold Standard. No self-reported numbers — we go straight to the source.",
              },
              {
                step: "Step 2",
                icon: FlaskConical,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
                title: "Simulate the science",
                desc: "NVIDIA AI models run the actual physics: how many trees survive, how much CO₂ they absorb, what changes in temperature and rainfall over 10 years.",
              },
              {
                step: "Step 3",
                icon: BarChart3,
                color: "text-green-400",
                bg: "bg-green-500/10",
                border: "border-green-500/20",
                title: "Get a verified score",
                desc: "Every project gets a 0–100 Planetary Impact Score. High score = the claims are real. Low score = red flag. No jargon, no guesswork.",
              },
            ].map((s) => (
              <div key={s.step} className={`rounded-2xl border ${s.border} ${s.bg} p-6`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className={`text-xs font-mono ${s.color} mb-2`}>{s.step}</div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL RESULTS ────────────────────────────────────────────── */}
      <section className="border-t border-zinc-800 py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">
            <div className="inline-block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-6 px-3 py-1 rounded-full border border-zinc-800">
              Real Results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Here&apos;s what we found
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
              We ran {DEMO_PROJECTS.length} real climate projects through the pipeline. Hover a pin on
              the globe above to see any of them. Here are three that tell the story.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-center">
            <div>
              <div className="font-mono text-4xl font-bold text-zinc-100 mb-1">{DEMO_PROJECTS.length}</div>
              <div className="text-xs text-zinc-600">Projects analysed</div>
            </div>
            <div className="w-px bg-zinc-800 hidden sm:block" />
            <div>
              <div className="font-mono text-4xl font-bold text-green-400 mb-1">{PASS_COUNT}</div>
              <div className="text-xs text-zinc-600">Claims verified accurate</div>
            </div>
            <div className="w-px bg-zinc-800 hidden sm:block" />
            <div>
              <div className="font-mono text-4xl font-bold text-amber-400 mb-1">{PARTIAL_COUNT}</div>
              <div className="text-xs text-zinc-600">Overclaiming detected</div>
            </div>
            <div className="w-px bg-zinc-800 hidden sm:block" />
            <div>
              <div className="font-mono text-4xl font-bold text-red-400 mb-1">{FAIL_COUNT}</div>
              <div className="text-xs text-zinc-600">Greenwashing flags</div>
            </div>
          </div>

          {/* 3 example project cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[EXAMPLE_FAIL, EXAMPLE_PARTIAL, EXAMPLE_PASS].map((p) => (
              <Link
                key={p.id}
                href={`/simulate/${p.simId}?intervention=${p.interventionId}&demo=1&project=${p.id}`}
                className="group rounded-2xl border bg-zinc-900 p-5 hover:bg-zinc-800/80 transition-colors block"
                style={{ borderColor: p.scoreColor + "40" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xl">{p.typeIcon}</span>
                      <span className="text-sm font-semibold text-zinc-100 leading-tight">{p.name}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{p.country}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-3xl font-bold leading-none" style={{ color: p.scoreColor }}>
                      {p.score}
                    </div>
                    <div className="text-xs text-zinc-600">/100</div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.score}%`, backgroundColor: p.scoreColor }}
                  />
                </div>

                {/* Verdict */}
                <div
                  className="inline-block text-xs px-2.5 py-0.5 rounded-full border mb-3 font-medium"
                  style={{ color: p.gwColor, borderColor: p.gwColor + "40", background: p.gwColor + "12" }}
                >
                  {p.gwLabel}
                </div>

                {/* Finding */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{p.findingSummary}</p>

                {/* CTA */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 group-hover:text-zinc-300 transition-colors">
                  See the full analysis
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/globe"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-all"
            >
              Explore all {DEMO_PROJECTS.length} projects on the globe
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT THE SCORE MEANS ────────────────────────────────────── */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">What does the score mean?</h2>
            <p className="text-sm text-zinc-500">
              Every project gets a single 0–100 number. Here&apos;s how to read it.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                range: "75 – 100",
                emoji: "✅",
                label: "Legit",
                color: "text-green-400",
                border: "border-green-500/20",
                bg: "bg-green-500/5",
                plain: "The project does what it claims. The science checks out. Claims are accurate — safe to invest in.",
                example: `e.g. Dogger Bank Wind Farm — ${EXAMPLE_PASS.score}/100`,
              },
              {
                range: "50 – 74",
                emoji: "⚠️",
                label: "Overclaiming",
                color: "text-amber-400",
                border: "border-amber-500/20",
                bg: "bg-amber-500/5",
                plain: "The project is real but exaggerates the numbers. Some CO₂ is removed, just less than claimed. Invest cautiously.",
                example: `e.g. Congo Basin Reforestation — ${EXAMPLE_PARTIAL.score}/100`,
              },
              {
                range: "0 – 49",
                emoji: "🚨",
                label: "Red Flag",
                color: "text-red-400",
                border: "border-red-500/20",
                bg: "bg-red-500/5",
                plain: "Big gap between claims and reality. The impact either doesn't exist, was always there, or was wildly overstated.",
                example: `e.g. Kariba REDD+ Credits — ${EXAMPLE_FAIL.score}/100`,
              },
            ].map((tier) => (
              <div key={tier.range} className={`rounded-2xl border ${tier.border} ${tier.bg} p-6`}>
                <div className="text-3xl mb-3">{tier.emoji}</div>
                <div className={`font-mono text-2xl font-bold ${tier.color} mb-1`}>{tier.range}</div>
                <div className={`text-sm font-semibold ${tier.color} mb-3`}>{tier.label}</div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{tier.plain}</p>
                <div className="text-xs text-zinc-600 font-mono">{tier.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORLD MAP ───────────────────────────────────────────────── */}
      <WorldMapSection />

      {/* ── TRY IT YOURSELF ─────────────────────────────────────────── */}
      <section id="simulate" className="border-t border-zinc-800 max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <div className="inline-block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4 px-3 py-1 rounded-full border border-zinc-800">
              Try It Yourself
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">Verify any climate project</h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Enter any climate intervention — a forest, solar farm, wind project, or carbon credit.
              Our NVIDIA-powered pipeline runs the physics and returns a verified score, usually in seconds.
            </p>

            {/* Greenwashing scanner callout */}
            <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ScanLine className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Greenwashing Scanner</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono ml-auto">NEW</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Have a Verra project ID? Paste it in and we&apos;ll pull the live registry data
                and run the full pipeline automatically.
              </p>
            </div>

            {/* What you'll get */}
            <div>
              <div className="text-xs text-zinc-600 uppercase tracking-widest font-mono mb-3">You&apos;ll get:</div>
              <div className="space-y-2.5">
                {[
                  "A 0–100 Impact Score",
                  "Actual vs. claimed CO₂ removed",
                  "10-year simulation chart",
                  "Greenwashing risk assessment",
                  "Optimal placement suggestions",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <InterventionForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center">
        <div className="text-sm font-semibold text-zinc-300 mb-1">Planetary · Climate Verification Engine</div>
        <div className="text-xs font-mono text-zinc-500">
          Powered by NVIDIA (NIM · Cosmos World Foundation Model · cuOpt) · Context.dev · Cala Knowledge API
        </div>
      </footer>
    </div>
  );
}
