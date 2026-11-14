"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClimateIntervention, SimulationResult } from "./types";
import { DEMO_INTERVENTIONS, DEMO_SIMULATIONS } from "./demos";

interface PlanetaryState {
  interventions: Record<string, ClimateIntervention>;
  simulations: Record<string, SimulationResult>;
  activeSimulationId: string | null;
  activeInterventionId: string | null;

  // Actions
  setActiveSimulation: (id: string | null) => void;
  setActiveIntervention: (id: string | null) => void;
  upsertIntervention: (i: ClimateIntervention) => void;
  upsertSimulation: (s: SimulationResult) => void;
  loadDemos: () => void;
  reset: () => void;
}

export const usePlanetaryStore = create<PlanetaryState>()(
  persist(
    (set) => ({
      interventions: Object.fromEntries(DEMO_INTERVENTIONS.map((i) => [i.id, i])),
      simulations: Object.fromEntries(DEMO_SIMULATIONS.map((s) => [s.id, s])),
      activeSimulationId: null,
      activeInterventionId: null,

      setActiveSimulation: (id) => set({ activeSimulationId: id }),
      setActiveIntervention: (id) => set({ activeInterventionId: id }),

      upsertIntervention: (i) =>
        set((state) => ({
          interventions: { ...state.interventions, [i.id]: i },
        })),

      upsertSimulation: (s) =>
        set((state) => ({
          simulations: { ...state.simulations, [s.id]: s },
        })),

      loadDemos: () =>
        set({
          interventions: Object.fromEntries(DEMO_INTERVENTIONS.map((i) => [i.id, i])),
          simulations: Object.fromEntries(DEMO_SIMULATIONS.map((s) => [s.id, s])),
        }),

      reset: () =>
        set({
          interventions: Object.fromEntries(DEMO_INTERVENTIONS.map((i) => [i.id, i])),
          simulations: Object.fromEntries(DEMO_SIMULATIONS.map((s) => [s.id, s])),
          activeSimulationId: null,
          activeInterventionId: null,
        }),
    }),
    {
      name: "planetary-store",
      partialize: (state) => ({
        interventions: state.interventions,
        simulations: state.simulations,
      }),
    }
  )
);
