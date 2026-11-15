import {
  fmtNum,
  fmtUSD,
  fmtPct,
  fmtCO2,
  scoreToTier,
  clamp,
  lerp,
  interventionLabel,
  stageLabel,
} from "@/lib/utils";

// ── fmtNum ────────────────────────────────────────────────────────────────────
describe("fmtNum", () => {
  it("formats billions", () => expect(fmtNum(1_500_000_000)).toBe("1.5B"));
  it("formats millions", () => expect(fmtNum(2_000_000)).toBe("2.0M"));
  it("formats thousands", () => expect(fmtNum(3_500)).toBe("3.5K"));
  it("formats small numbers", () => expect(fmtNum(500)).toBe("500.0"));
  it("respects decimals=0", () => expect(fmtNum(1_500_000, 0)).toBe("2M"));
  it("handles exactly 1B", () => expect(fmtNum(1_000_000_000)).toBe("1.0B"));
  it("handles exactly 1M", () => expect(fmtNum(1_000_000)).toBe("1.0M"));
  it("handles exactly 1K", () => expect(fmtNum(1_000)).toBe("1.0K"));
});

// ── fmtUSD ────────────────────────────────────────────────────────────────────
describe("fmtUSD", () => {
  it("formats billions (≥1000M)", () => expect(fmtUSD(2_000)).toBe("$2.0B"));
  it("formats millions (≥1M)", () => expect(fmtUSD(500)).toBe("$500M"));
  it("formats thousands (<1M)", () => expect(fmtUSD(0.5)).toBe("$500K"));
  it("formats exactly 1B boundary", () => expect(fmtUSD(1_000)).toBe("$1.0B"));
  it("formats 1M exactly", () => expect(fmtUSD(1)).toBe("$1M"));
});

// ── fmtPct ────────────────────────────────────────────────────────────────────
describe("fmtPct", () => {
  it("prefixes positive with +", () => expect(fmtPct(5)).toBe("+5%"));
  it("prefixes negative with -", () => expect(fmtPct(-3)).toBe("-3%"));
  it("zero is positive", () => expect(fmtPct(0)).toBe("+0%"));
  it("respects decimals param", () => expect(fmtPct(5.5, 1)).toBe("+5.5%"));
});

// ── fmtCO2 ────────────────────────────────────────────────────────────────────
describe("fmtCO2", () => {
  it("appends tCO₂ unit", () => expect(fmtCO2(1_500_000)).toBe("1.5M tCO₂"));
  it("works for small amounts", () => expect(fmtCO2(500)).toBe("500.0 tCO₂"));
});

// ── scoreToTier ───────────────────────────────────────────────────────────────
describe("scoreToTier", () => {
  it("platinum for ≥90", () => expect(scoreToTier(95)).toBe("platinum"));
  it("gold for 75–89",    () => expect(scoreToTier(80)).toBe("gold"));
  it("silver for 60–74",  () => expect(scoreToTier(65)).toBe("silver"));
  it("bronze for 45–59",  () => expect(scoreToTier(50)).toBe("bronze"));
  it("amber for 30–44",   () => expect(scoreToTier(35)).toBe("amber"));
  it("red for <30",        () => expect(scoreToTier(20)).toBe("red"));
  // Boundaries
  it("exactly 90 → platinum", () => expect(scoreToTier(90)).toBe("platinum"));
  it("exactly 75 → gold",     () => expect(scoreToTier(75)).toBe("gold"));
  it("exactly 60 → silver",   () => expect(scoreToTier(60)).toBe("silver"));
  it("exactly 45 → bronze",   () => expect(scoreToTier(45)).toBe("bronze"));
  it("exactly 30 → amber",    () => expect(scoreToTier(30)).toBe("amber"));
  it("exactly 29 → red",      () => expect(scoreToTier(29)).toBe("red"));
});

// ── clamp ─────────────────────────────────────────────────────────────────────
describe("clamp", () => {
  it("clamps below min",          () => expect(clamp(-10, 0, 100)).toBe(0));
  it("clamps above max",          () => expect(clamp(150, 0, 100)).toBe(100));
  it("passes through in-range",   () => expect(clamp(50, 0, 100)).toBe(50));
  it("passes through at min",     () => expect(clamp(0, 0, 100)).toBe(0));
  it("passes through at max",     () => expect(clamp(100, 0, 100)).toBe(100));
  it("works with negative range", () => expect(clamp(-5, -10, -1)).toBe(-5));
});

// ── lerp ──────────────────────────────────────────────────────────────────────
describe("lerp", () => {
  it("returns start at t=0",     () => expect(lerp(10, 90, 0)).toBe(10));
  it("returns end at t=1",       () => expect(lerp(10, 90, 1)).toBe(90));
  it("returns midpoint at t=0.5",() => expect(lerp(0, 100, 0.5)).toBe(50));
  it("interpolates at t=0.25",   () => expect(lerp(0, 100, 0.25)).toBe(25));
  it("works with negatives",     () => expect(lerp(-10, 10, 0.5)).toBe(0));
});

// ── interventionLabel ─────────────────────────────────────────────────────────
describe("interventionLabel", () => {
  it("maps solar_farm",               () => expect(interventionLabel("solar_farm")).toBe("Solar Farm"));
  it("maps reforestation",            () => expect(interventionLabel("reforestation")).toBe("Reforestation"));
  it("maps wind_farm",                () => expect(interventionLabel("wind_farm")).toBe("Wind Farm"));
  it("maps carbon_credit",            () => expect(interventionLabel("carbon_credit")).toBe("Carbon Credits"));
  it("maps mangrove_restoration",     () => expect(interventionLabel("mangrove_restoration")).toBe("Mangrove Restoration"));
  it("maps peatland_restoration",     () => expect(interventionLabel("peatland_restoration")).toBe("Peatland Restoration"));
  it("maps direct_air_capture",       () => expect(interventionLabel("direct_air_capture")).toBe("Direct Air Capture"));
  it("passes unknown type through",   () => expect(interventionLabel("unknown_type")).toBe("unknown_type"));
});

// ── stageLabel ────────────────────────────────────────────────────────────────
describe("stageLabel", () => {
  it("maps idle → Ready",        () => expect(stageLabel("idle")).toBe("Ready"));
  it("maps complete → Complete", () => expect(stageLabel("complete")).toBe("Complete"));
  it("maps error → Error",       () => expect(stageLabel("error")).toBe("Error"));
  it("maps running_nim",         () => expect(stageLabel("running_nim")).toBe("NVIDIA NIM Climate Inference"));
  it("maps scoring",             () => expect(stageLabel("scoring")).toBe("Computing Impact Score"));
  it("passes unknown through",   () => expect(stageLabel("unknown_stage")).toBe("unknown_stage"));
});
