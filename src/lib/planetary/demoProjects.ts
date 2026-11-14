/**
 * Shared demo project data used by GlobeHero and WorldMapSection.
 * 8 real-world locations spanning 5 continents.
 */

export interface DemoProject {
  id: string;
  /** Simulation ID to route to (may be a similar existing demo for newer locations) */
  simId: string;
  interventionId: string;
  /** ISO 3166-1 numeric country code for WorldMapSection highlighting */
  countryCode: string;
  name: string;
  country: string;
  type: string;
  typeIcon: string;
  score: number;
  /** Hex color — green ≥75, amber 50–74, red <50 */
  scoreColor: string;
  gwLabel: string;
  gwColor: string;
  co2: string;
  investment: string;
  lat: number;
  lng: number;
  /** Plain-English "what does this project do?" */
  simpleExplainer: string;
  /** Plain-English "what did our simulation find?" */
  findingSummary: string;
  /** Technical one-liner for WorldMapSection tooltip */
  desc: string;
  /** If true, links to a similar existing demo rather than its own simulation */
  isExampleOnly?: boolean;
  demoTypeLabel?: string; // used in CTA copy for example-only projects
}

export const DEMO_PROJECTS: DemoProject[] = [
  // ── Africa ───────────────────────────────────────────────────────────────
  {
    id: "congo",
    simId: "demo_sim_congo",
    interventionId: "demo_congo",
    countryCode: "180", // DR Congo
    name: "Congo Basin Reforestation",
    country: "DR Congo",
    type: "Reforestation · 500,000 ha",
    typeIcon: "🌳",
    score: 72,
    scoreColor: "#fbbf24",
    gwLabel: "Moderate Overclaim",
    gwColor: "#fbbf24",
    co2: "1.1M tCO₂",
    investment: "$50M · 10yr",
    lat: -2.5,
    lng: 23.8,
    simpleExplainer:
      "Replants 500,000 ha of forest — bigger than Luxembourg — to pull CO₂ out of the air. Real trees, real absorption, but slower than claimed.",
    findingSummary:
      "Claims 2M tons of CO₂ absorbed per year. We found 1.1M tons — roughly half. The trees are real, but the forest takes years to reach full speed.",
    desc: "Claims 2M tCO₂/yr; NVIDIA NIM simulation yields 1.1M tCO₂/yr at forest maturity.",
  },
  {
    id: "sahara",
    simId: "demo_sim_sahara",
    interventionId: "demo_sahara",
    countryCode: "788", // Tunisia
    name: "Saharan Solar Array",
    country: "Tunisia",
    type: "Solar Farm · 500 MW",
    typeIcon: "☀️",
    score: 85,
    scoreColor: "#4ade80",
    gwLabel: "Claim Accurate",
    gwColor: "#4ade80",
    co2: "7.2M tCO₂",
    investment: "$200M · 10yr",
    lat: 33.2,
    lng: 9.1,
    simpleExplainer:
      "Massive solar panels in the Tunisian desert, beaming clean electricity through undersea cables to European homes.",
    findingSummary:
      "Numbers check out. Producing 26.4% of rated capacity vs. the claimed 27%. This is exactly what it says it is — invest with confidence.",
    desc: "HVDC interconnect to European grid. Modeled capacity factor 26.4% vs claimed 27%. Highly accurate.",
  },
  {
    id: "kariba",
    simId: "demo_sim_kariba",
    interventionId: "demo_kariba",
    countryCode: "716", // Zimbabwe
    name: "Kariba REDD+ Credits",
    country: "Zimbabwe",
    type: "Carbon Credits · 785,000 ha",
    typeIcon: "📋",
    score: 32,
    scoreColor: "#f87171",
    gwLabel: "⚠ Greenwashing Detected",
    gwColor: "#f87171",
    co2: "1.1M tCO₂",
    investment: "$30M · 10yr",
    lat: -16.5,
    lng: 28.5,
    simpleExplainer:
      "Pays to protect forests in Zimbabwe from being chopped down — except those forests weren't going to be chopped down anyway.",
    findingSummary:
      "Like buying fire insurance on a house that wasn't going to burn. The forests were already safe. Overclaiming by 4.5×. Avoid.",
    desc: "Claims 4.9M tCO₂/yr based on inflated baselines. Physics: 1.1M tCO₂/yr (4.5× overclaim).",
  },

  // ── South America ─────────────────────────────────────────────────────────
  {
    id: "amazon",
    simId: "demo_sim_congo", // similar reforestation demo
    interventionId: "demo_congo",
    countryCode: "76", // Brazil
    name: "Amazon Buffer Zones",
    country: "Brazil",
    type: "Reforestation · 1.2M ha",
    typeIcon: "🌱",
    score: 78,
    scoreColor: "#4ade80",
    gwLabel: "Mostly Accurate",
    gwColor: "#4ade80",
    co2: "9.4M tCO₂",
    investment: "$180M · 10yr",
    lat: -3.4,
    lng: -62.2,
    simpleExplainer:
      "Creates protected forest buffer zones at the Amazon's edge, where deforestation pressure is highest and every tree counts most.",
    findingSummary:
      "Strong science, strong results. We verified 90% of the claimed impact. One of the most credible large-scale forest projects we've seen.",
    desc: "Amazon edge-effect reforestation. Verified 9.4M tCO₂ vs claimed 10.4M. High additionality.",
    isExampleOnly: true,
    demoTypeLabel: "Reforestation",
  },

  // ── Asia ──────────────────────────────────────────────────────────────────
  {
    id: "rajasthan",
    simId: "demo_sim_sahara", // similar solar demo
    interventionId: "demo_sahara",
    countryCode: "356", // India
    name: "Rajasthan Solar Corridor",
    country: "India",
    type: "Solar Farm · 1.2 GW",
    typeIcon: "☀️",
    score: 69,
    scoreColor: "#fbbf24",
    gwLabel: "Minor Overclaim",
    gwColor: "#fbbf24",
    co2: "4.8M tCO₂",
    investment: "$120M · 10yr",
    lat: 26.9,
    lng: 70.9,
    simpleExplainer:
      "1.2 gigawatts of solar panels across India's Thar Desert, replacing coal power for about 2 million homes.",
    findingSummary:
      "India's grid was already cleaner than the project assumed, so the carbon savings are ~15% less than claimed. Still a solid clean energy investment.",
    desc: "Thar Desert 1.2 GW solar. Grid emission 0.72 kg CO₂/kWh vs claimed 0.85. 15% overclaim.",
    isExampleOnly: true,
    demoTypeLabel: "Solar",
  },
  {
    id: "sundarbans",
    simId: "demo_sim_congo", // similar land carbon demo
    interventionId: "demo_congo",
    countryCode: "50", // Bangladesh
    name: "Sundarbans Mangroves",
    country: "Bangladesh",
    type: "Mangrove Restoration · 14,000 ha",
    typeIcon: "🌊",
    score: 74,
    scoreColor: "#fbbf24",
    gwLabel: "Minor Overclaim",
    gwColor: "#fbbf24",
    co2: "0.8M tCO₂",
    investment: "$22M · 10yr",
    lat: 21.9,
    lng: 89.5,
    simpleExplainer:
      "Restores mangrove forests along Bangladesh's coastline. These trees store carbon AND act as a living barrier protecting coastal villages from storm surges.",
    findingSummary:
      "Carbon storage slightly overstated, but the flood protection benefit is enormous and not counted in the CO₂ price. Genuine community value here.",
    desc: "14,000 ha mangrove replanting. Blue carbon 0.8M tCO₂ vs claimed 1.1M. Coastal resilience co-benefit unquantified.",
    isExampleOnly: true,
    demoTypeLabel: "Carbon Forestry",
  },

  // ── Europe ────────────────────────────────────────────────────────────────
  {
    id: "dogger",
    simId: "demo_sim_sahara", // similar clean energy demo
    interventionId: "demo_sahara",
    countryCode: "826", // United Kingdom
    name: "Dogger Bank Wind Farm",
    country: "United Kingdom",
    type: "Wind Farm · 3.6 GW",
    typeIcon: "💨",
    score: 91,
    scoreColor: "#4ade80",
    gwLabel: "Claim Accurate",
    gwColor: "#4ade80",
    co2: "16.2M tCO₂",
    investment: "$640M · 10yr",
    lat: 54.9,
    lng: 2.0,
    simpleExplainer:
      "World's largest offshore wind farm, 130 km off the Yorkshire coast. 277 turbines powering 6 million UK homes with zero emissions.",
    findingSummary:
      "Exceptional. Measured wind speeds match our models exactly. This is what good climate infrastructure looks like — the gold standard.",
    desc: "3.6 GW offshore wind. Modeled capacity factor 48.2% vs claimed 48%. Exceptional accuracy.",
    isExampleOnly: true,
    demoTypeLabel: "Wind Energy",
  },

  // ── Northern Europe ───────────────────────────────────────────────────────
  {
    id: "finland",
    simId: "demo_sim_congo",
    interventionId: "demo_congo",
    countryCode: "246", // Finland
    name: "Häme Peatland Restoration",
    country: "Finland",
    type: "Peatland Restoration · 50,000 ha",
    typeIcon: "🌿",
    score: 81,
    scoreColor: "#4ade80",
    gwLabel: "Claim Accurate",
    gwColor: "#4ade80",
    co2: "2.1M tCO₂",
    investment: "$38M · 10yr",
    lat: 61.5,
    lng: 24.5,
    simpleExplainer:
      "Restores 50,000 ha of Finland's drained peatlands — ancient bogs that lock away enormous carbon when re-wetted. Like plugging a slow carbon leak that's been open for decades.",
    findingSummary:
      "Peatland carbon accounting is among the most reliable in the field. We verified 92% of the claimed impact. Strong additionality — these bogs would have kept draining without intervention.",
    desc: "50,000 ha peat rewetting. Verified 2.1M tCO₂ vs claimed 2.3M. High permanence.",
    isExampleOnly: true,
    demoTypeLabel: "Peatland Carbon",
  },
  {
    id: "sweden",
    simId: "demo_sim_sahara",
    interventionId: "demo_sahara",
    countryCode: "752", // Sweden
    name: "Baltic Sea Wind Array",
    country: "Sweden",
    type: "Wind Farm · 1.1 GW",
    typeIcon: "💨",
    score: 88,
    scoreColor: "#4ade80",
    gwLabel: "Claim Accurate",
    gwColor: "#4ade80",
    co2: "5.8M tCO₂",
    investment: "$210M · 10yr",
    lat: 57.5,
    lng: 17.5,
    simpleExplainer:
      "Offshore wind turbines in the Baltic Sea feeding clean power to the Swedish grid. Shallow water and consistent winds make this one of Europe's most reliable wind locations.",
    findingSummary:
      "Wind speeds and capacity factors match our atmospheric models almost exactly. Claims are accurate. Sweden's already-clean grid makes every displaced kWh especially valuable.",
    desc: "Baltic offshore 1.1 GW wind. Capacity factor 43.1% vs claimed 43%. Exceptional accuracy.",
    isExampleOnly: true,
    demoTypeLabel: "Wind Energy",
  },

  // ── North America ─────────────────────────────────────────────────────────
  {
    id: "boreal",
    simId: "demo_sim_kariba", // similar REDD+ demo
    interventionId: "demo_kariba",
    countryCode: "124", // Canada
    name: "BC Boreal Forest Credits",
    country: "Canada",
    type: "Carbon Credits · 2M ha",
    typeIcon: "🌲",
    score: 44,
    scoreColor: "#f87171",
    gwLabel: "Significant Overclaim",
    gwColor: "#f87171",
    co2: "0.7M tCO₂",
    investment: "$45M · 10yr",
    lat: 56.1,
    lng: -125.6,
    simpleExplainer:
      "Pays Indigenous communities to protect old-growth forest in British Columbia from logging. Good intent, but weak evidence of real threat.",
    findingSummary:
      "Only 12% of this forest faced any real logging threat. The rest would have stayed intact anyway. Overclaiming by 2.8×.",
    desc: "Boreal old-growth REDD+. Actual logging threat 12% of claimed. 0.7M tCO₂ vs claimed 2.0M (2.8× overclaim).",
    isExampleOnly: true,
    demoTypeLabel: "Forest Carbon",
  },
];
