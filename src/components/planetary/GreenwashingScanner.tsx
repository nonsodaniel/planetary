"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Zap,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanetaryStore } from "@/lib/planetary/store";
import { DEMO_INTERVENTIONS, DEMO_SIMULATIONS } from "@/lib/planetary/demos";
import type { ClimateIntervention } from "@/lib/planetary/types";
import { interventionLabel } from "@/lib/utils";

interface ScanResult {
  intervention: ClimateIntervention;
  source_url: string;
  source_title: string;
  confidence: "high" | "medium" | "low";
  missing_fields: string[];
  demo_id?: string;
  is_demo?: boolean;
}

const EXAMPLE_QUERIES = [
  { label: "Kariba REDD+", query: "Kariba REDD+" },
  { label: "VCS 612", query: "VCS 612" },
  { label: "Congo Reforestation", query: "Congo Basin reforestation" },
];

const CONFIDENCE_STYLE: Record<
  "high" | "medium" | "low",
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  high: { icon: CheckCircle2, color: "text-emerald-400", label: "High confidence" },
  medium: { icon: CircleAlert, color: "text-amber-400", label: "Medium confidence" },
  low: { icon: AlertTriangle, color: "text-orange-400", label: "Partial extraction" },
};

export function GreenwashingScanner() {
  const router = useRouter();
  const { upsertIntervention, upsertSimulation, setActiveSimulation } = usePlanetaryStore();

  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function handleScan(q?: string) {
    const scanQuery = (q ?? query).trim();
    if (!scanQuery) return;

    setScanning(true);
    setError(null);
    setResult(null);
    if (q) setQuery(q);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: scanQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Scan failed");
      }

      setResult(data as ScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleSimulate() {
    if (!result) return;

    // If this matched a demo, load it instantly
    if (result.demo_id) {
      const demoIntervention = DEMO_INTERVENTIONS.find(
        (i) => i.id === result.demo_id
      );
      const demoSim = DEMO_SIMULATIONS.find(
        (s) => s.intervention_id === result.demo_id
      );
      if (demoIntervention && demoSim) {
        upsertIntervention(demoIntervention);
        upsertSimulation(demoSim);
        setActiveSimulation(demoSim.id);
        router.push(`/simulate/${demoSim.id}?intervention=${demoIntervention.id}&demo=1`);
        return;
      }
    }

    // Live simulation
    setSimulating(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.intervention),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Simulation failed");
      }

      const { simulation_id, intervention_id } = await res.json();
      setActiveSimulation(simulation_id);
      router.push(`/simulate/${simulation_id}?intervention=${intervention_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
      setSimulating(false);
    }
  }

  const confStyle = result ? CONFIDENCE_STYLE[result.confidence] : null;
  const ConfIcon = confStyle?.icon;

  return (
    <div className="w-full space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="Verra project ID, URL, or project name…"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <Button
          onClick={() => handleScan()}
          disabled={scanning || !query.trim()}
          className="shrink-0 gap-2 px-4"
          variant="primary"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Scan
            </>
          )}
        </Button>
      </div>

      {/* Quick examples */}
      {!result && !scanning && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-600 self-center">Try:</span>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex.query}
              onClick={() => handleScan(ex.query)}
              className="text-xs px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      {/* Scanning animation */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 text-sm text-zinc-500 py-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>
              Querying carbon registry with{" "}
              <span className="text-zinc-300 font-medium">Context.dev</span>…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-100 leading-snug">
                    {result.intervention.name}
                  </span>
                  {result.is_demo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {result.intervention.region}, {result.intervention.country}
                </div>
              </div>
              {confStyle && ConfIcon && (
                <div className={`flex items-center gap-1 text-xs shrink-0 ${confStyle.color}`}>
                  <ConfIcon className="w-3.5 h-3.5" />
                  <span>{confStyle.label}</span>
                </div>
              )}
            </div>

            {/* Data grid */}
            <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
              <DataRow
                label="Type"
                value={interventionLabel(result.intervention.type)}
              />
              <DataRow
                label="Investment"
                value={`$${result.intervention.investment_usd_m}M USD`}
              />
              {result.intervention.area_hectares && (
                <DataRow
                  label="Area"
                  value={`${result.intervention.area_hectares.toLocaleString()} ha`}
                />
              )}
              {result.intervention.claimed_co2_annual && (
                <DataRow
                  label="Claimed CO₂"
                  value={
                    result.intervention.claimed_co2_annual >= 1_000_000
                      ? `${(result.intervention.claimed_co2_annual / 1_000_000).toFixed(1)}M t/yr`
                      : `${(result.intervention.claimed_co2_annual / 1_000).toFixed(0)}K t/yr`
                  }
                  highlight
                />
              )}
              {result.intervention.certifications.length > 0 && (
                <DataRow
                  label="Certifications"
                  value={result.intervention.certifications.join(", ")}
                />
              )}
              <DataRow
                label="Timeline"
                value={`${result.intervention.timeline_years} years`}
              />
            </div>

            {/* Description */}
            {result.intervention.description && (
              <div className="px-4 pb-3 text-xs text-zinc-500 leading-relaxed">
                {result.intervention.description}
              </div>
            )}

            {/* Missing fields warning */}
            {result.missing_fields.length > 0 && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-500/80">
                  <CircleAlert className="w-3 h-3" />
                  <span>
                    Estimated: {result.missing_fields.join(", ")} — edit below if needed
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <a
                href={result.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{result.source_title ?? result.source_url}</span>
              </a>
              <Button
                onClick={handleSimulate}
                disabled={simulating}
                size="sm"
                variant="primary"
                className="shrink-0 gap-2"
              >
                {simulating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      <div className="text-center text-xs text-zinc-700">
        Live registry data powered by{" "}
        <span className="text-zinc-500">Context.dev</span>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</span>
      <span
        className={`text-xs font-medium mt-0.5 ${highlight ? "text-amber-300" : "text-zinc-300"}`}
      >
        {value}
      </span>
    </div>
  );
}
