"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Zap, Upload, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { interventionLabel, makeId } from "@/lib/utils";
import { usePlanetaryStore } from "@/lib/planetary/store";
import { DEMO_INTERVENTIONS, DEMO_SIMULATIONS } from "@/lib/planetary/demos";
import type { InterventionType } from "@/lib/planetary/types";

const INTERVENTION_TYPES: { value: InterventionType; label: string; icon: string }[] = [
  { value: "reforestation",            label: "Reforestation",            icon: "🌳" },
  { value: "solar_farm",               label: "Solar Farm",               icon: "☀️" },
  { value: "wind_farm",                label: "Wind Farm",                icon: "💨" },
  { value: "carbon_credit",            label: "Carbon Credits",           icon: "📋" },
  { value: "mangrove_restoration",     label: "Mangrove Restoration",     icon: "🌊" },
  { value: "direct_air_capture",       label: "Direct Air Capture",       icon: "🏭" },
  { value: "peatland_restoration",     label: "Peatland Restoration",     icon: "🪸" },
  { value: "regenerative_agriculture", label: "Regenerative Agriculture", icon: "🌾" },
];

const GREENWASHING_TIERS = {
  none:     { color: "text-emerald-400", bg: "bg-emerald-400" },
  low:      { color: "text-emerald-400", bg: "bg-emerald-400" },
  moderate: { color: "text-amber-400",   bg: "bg-amber-400" },
  high:     { color: "text-orange-400",  bg: "bg-orange-400" },
  severe:   { color: "text-red-400",     bg: "bg-red-400" },
};

export function InterventionForm() {
  const router = useRouter();
  const { upsertIntervention, upsertSimulation, setActiveSimulation } = usePlanetaryStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<InterventionType>("reforestation");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [area, setArea] = useState("");
  const [capacityMW, setCapacityMW] = useState("");
  const [investment, setInvestment] = useState("");
  const [claimedCO2, setClaimedCO2] = useState("");
  const [timeline, setTimeline] = useState("25");
  const [certs, setCerts] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        type,
        name: name || `${interventionLabel(type)} — ${region}`,
        description,
        region,
        country,
        coordinates: {
          lat: parseFloat(lat) || 0,
          lng: parseFloat(lng) || 0,
        },
        ...(area ? { area_hectares: parseFloat(area) } : {}),
        ...(capacityMW ? { capacity_mw: parseFloat(capacityMW) } : {}),
        investment_usd_m: parseFloat(investment),
        ...(claimedCO2 ? { claimed_co2_annual: parseFloat(claimedCO2) } : {}),
        timeline_years: parseInt(timeline),
        certifications: certs
          ? certs.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulation failed");
      }

      const { simulation_id, intervention_id } = await res.json();
      setActiveSimulation(simulation_id);
      router.push(`/simulate/${simulation_id}?intervention=${intervention_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  function loadDemo(interventionId: string) {
    const intervention = DEMO_INTERVENTIONS.find((i) => i.id === interventionId);
    const sim = DEMO_SIMULATIONS.find((s) => s.intervention_id === interventionId);
    if (!intervention || !sim) return;

    upsertIntervention(intervention);
    upsertSimulation(sim);
    setActiveSimulation(sim.id);
    router.push(`/simulate/${sim.id}?intervention=${intervention.id}&demo=1`);
  }

  const isSolar = type === "solar_farm" || type === "wind_farm";
  const isLand = !isSolar && type !== "direct_air_capture";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs defaultValue="new">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="new" className="flex-1 gap-2">
            <Zap className="w-3.5 h-3.5" />
            New Simulation
          </TabsTrigger>
          <TabsTrigger value="demos" className="flex-1 gap-2">
            <FlaskConical className="w-3.5 h-3.5" />
            Demo Projects
          </TabsTrigger>
        </TabsList>

        {/* New Simulation */}
        <TabsContent value="new">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type selector */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                Intervention Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {INTERVENTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all ${
                      type === t.value
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                        : "border-zinc-700/50 bg-zinc-900/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-center leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Core details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-500 mb-1.5 block">Project Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${interventionLabel(type)} — Region`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Region / Area *</label>
                <input
                  required
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Amazon Basin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Country *</label>
                <input
                  required
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Brazil"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Latitude</label>
                <input
                  type="number"
                  step="0.001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. -3.47"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Longitude</label>
                <input
                  type="number"
                  step="0.001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="e.g. -60.02"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              {isLand && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Area (hectares)</label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                  />
                </div>
              )}

              {isSolar && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Capacity (MW)</label>
                  <input
                    type="number"
                    value={capacityMW}
                    onChange={(e) => setCapacityMW(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Investment ($M USD) *</label>
                <input
                  required
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Claimed CO₂ (tons/year)
                  <span className="ml-1 text-zinc-500">for verification</span>
                </label>
                <input
                  type="number"
                  value={claimedCO2}
                  onChange={(e) => setClaimedCO2(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Timeline (years)</label>
                <input
                  type="number"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  min="5"
                  max="50"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  value={certs}
                  onChange={(e) => setCerts(e.target.value)}
                  placeholder="e.g. VCS, Gold Standard, CCBA"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !region || !country || !investment}
              size="lg"
              variant="primary" className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initialising Simulation...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Planetary Simulation
                </>
              )}
            </Button>

            <div className="text-center text-xs text-zinc-600">
              Powered by NVIDIA NIM · Cosmos · cuOpt · Cala
            </div>
          </form>
        </TabsContent>

        {/* Demo Projects */}
        <TabsContent value="demos">
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 mb-4">
              Three pre-computed scenarios showcasing the full range of Planetary&apos;s analysis.
              Works instantly, no API keys required.
            </p>

            {DEMO_INTERVENTIONS.map((intervention) => {
              const sim = DEMO_SIMULATIONS.find((s) => s.intervention_id === intervention.id);
              const scoreColor =
                (sim?.planetary_impact_score ?? 0) >= 75 ? "text-amber-400" :
                (sim?.planetary_impact_score ?? 0) >= 45 ? "text-blue-400" :
                "text-red-400";

              const gwRisk = sim?.claim_verification?.greenwashing_risk ?? "none";
              const gwCfg = GREENWASHING_TIERS[gwRisk];
              const isGreenwash = gwRisk === "high" || gwRisk === "severe";

              return (
                <motion.button
                  key={intervention.id}
                  onClick={() => loadDemo(intervention.id)}
                  className="w-full text-left rounded-xl border border-zinc-700/50 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900 transition-all p-4 group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-200">
                          {intervention.name}
                        </span>
                        {isGreenwash && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400">
                            ⚠️ Greenwashing
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {intervention.region}, {intervention.country}
                      </div>
                      <div className="text-xs text-zinc-600 mt-1">
                        {interventionLabel(intervention.type)} · ${intervention.investment_usd_m}M
                        {intervention.claimed_co2_annual && (
                          <> · Claims {(intervention.claimed_co2_annual / 1000000).toFixed(1)}M tCO₂/yr</>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {sim && (
                        <>
                          <div className={`font-mono text-2xl font-bold ${scoreColor}`}>
                            {sim.planetary_impact_score}
                          </div>
                          <div className="text-xs text-zinc-600">Impact Score</div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
