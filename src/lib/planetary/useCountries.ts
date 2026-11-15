"use client";

import { useState, useEffect } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

export interface CountryFeature {
  type: "Feature";
  id: string | number;
  geometry: any;
  properties: any;
}

let cached: CountryFeature[] | null = null;

export function useCountries() {
  const [countries, setCountries] = useState<CountryFeature[]>(cached ?? []);

  useEffect(() => {
    if (cached) { setCountries(cached); return; }
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo: Topology) => {
        const geo = feature(topo, (topo.objects as any).countries) as any;
        cached = geo.features as CountryFeature[];
        setCountries(cached);
      })
      .catch(() => {/* silently degrade — globe still works without borders */});
  }, []);

  return countries;
}
