import {
  computeGreenwashingRisk,
  buildClaimVerification,
} from "@/lib/planetary/scoring";

// ── computeGreenwashingRisk ───────────────────────────────────────────────────
describe("computeGreenwashingRisk", () => {
  it("none for ratio ≥0.9",        () => expect(computeGreenwashingRisk(0.95)).toBe("none"));
  it("low for 0.75–0.89",          () => expect(computeGreenwashingRisk(0.80)).toBe("low"));
  it("moderate for 0.55–0.74",     () => expect(computeGreenwashingRisk(0.65)).toBe("moderate"));
  it("high for 0.35–0.54",         () => expect(computeGreenwashingRisk(0.45)).toBe("high"));
  it("severe for <0.35",           () => expect(computeGreenwashingRisk(0.20)).toBe("severe"));
  // Boundaries
  it("exactly 0.9 → none",         () => expect(computeGreenwashingRisk(0.90)).toBe("none"));
  it("exactly 0.75 → low",         () => expect(computeGreenwashingRisk(0.75)).toBe("low"));
  it("exactly 0.55 → moderate",    () => expect(computeGreenwashingRisk(0.55)).toBe("moderate"));
  it("exactly 0.35 → high",        () => expect(computeGreenwashingRisk(0.35)).toBe("high"));
  it("0.0 → severe",               () => expect(computeGreenwashingRisk(0.0)).toBe("severe"));
  it("1.0 → none",                 () => expect(computeGreenwashingRisk(1.0)).toBe("none"));
});

// ── buildClaimVerification ────────────────────────────────────────────────────
describe("buildClaimVerification", () => {
  it("populates all fields correctly", () => {
    const result = buildClaimVerification(1_000_000, 800_000, ["Satellite cross-check"], []);
    expect(result.claimed_annual_co2_tons).toBe(1_000_000);
    expect(result.simulated_annual_co2_tons).toBe(800_000);
    expect(result.accuracy_ratio).toBeCloseTo(0.8, 2);
    expect(result.greenwashing_risk).toBe("low");
    expect(result.discrepancy_pct).toBeCloseTo(20, 1);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]).toBe("Satellite cross-check");
  });

  it("accurate project gets none risk", () => {
    const result = buildClaimVerification(1_000_000, 950_000, [], []);
    expect(result.greenwashing_risk).toBe("none");
    expect(result.accuracy_ratio).toBeCloseTo(0.95, 2);
  });

  it("gross overclaim gets severe risk", () => {
    const result = buildClaimVerification(1_000_000, 100_000, [], []);
    expect(result.greenwashing_risk).toBe("severe");
    expect(result.discrepancy_pct).toBeCloseTo(90, 1);
  });

  it("accuracy_ratio rounds to 3 decimal places", () => {
    const result = buildClaimVerification(3, 1, [], []);
    // 1/3 = 0.3333... → 0.333
    expect(result.accuracy_ratio).toBe(0.333);
  });

  it("discrepancy_pct is 0 when claimed equals simulated", () => {
    const result = buildClaimVerification(500_000, 500_000, [], []);
    expect(result.discrepancy_pct).toBe(0);
    expect(result.greenwashing_risk).toBe("none");
  });
});
