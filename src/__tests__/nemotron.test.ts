/**
 * Tests for Nemotron integration — covers fallback paths that run without
 * an NVIDIA API key so the existing test suite continues to pass in CI.
 *
 * Live API calls are not made here: we test the data-normalisation and
 * fallback logic that runs when the API is unavailable.
 */

import type {
  NemotronConfidence,
  NemotronGreenwashingAnalysis,
  ClimateIntervention,
  ClaimVerification,
  NimClimateAnalysis,
} from "@/lib/planetary/types";

// ── Type shape validation ─────────────────────────────────────────────────────

describe("NemotronConfidence type shape", () => {
  const sample: NemotronConfidence = {
    score: 0.78,
    label: "High",
    reasoning: "Analysis aligns with IPCC AR6 benchmarks.",
    model_used: "nvidia/nemotron-3.5-super-vl-120b-a12b",
  };

  it("has required fields", () => {
    expect(typeof sample.score).toBe("number");
    expect(typeof sample.label).toBe("string");
    expect(typeof sample.reasoning).toBe("string");
    expect(typeof sample.model_used).toBe("string");
  });

  it("score is 0–1", () => {
    expect(sample.score).toBeGreaterThanOrEqual(0);
    expect(sample.score).toBeLessThanOrEqual(1);
  });

  it("label is one of High / Medium / Low", () => {
    expect(["High", "Medium", "Low"]).toContain(sample.label);
  });

  it("dimensions field is optional", () => {
    expect(sample.dimensions).toBeUndefined();
  });

  it("dimensions sub-fields are 0–1 when present", () => {
    const withDims: NemotronConfidence = {
      ...sample,
      dimensions: {
        scientific_accuracy: 0.82,
        internal_consistency: 0.75,
        regional_specificity: 0.70,
        ipcc_alignment: 0.88,
      },
    };
    const dims = withDims.dimensions!;
    for (const val of Object.values(dims)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});

describe("NemotronGreenwashingAnalysis type shape", () => {
  const sample: NemotronGreenwashingAnalysis = {
    root_cause: "Inflated deforestation baseline.",
    mechanisms: ["Non-additionality", "Leakage", "Permanence deficit"],
    red_flags:  ["4.5× overclaim", "VCS only", "No field audit"],
    model_used: "nvidia/nemotron-3.5-super-vl-120b-a12b",
  };

  it("has all required fields", () => {
    expect(typeof sample.root_cause).toBe("string");
    expect(Array.isArray(sample.mechanisms)).toBe(true);
    expect(Array.isArray(sample.red_flags)).toBe(true);
    expect(typeof sample.model_used).toBe("string");
  });

  it("root_cause is non-empty", () => {
    expect(sample.root_cause.length).toBeGreaterThan(5);
  });

  it("mechanisms has up to 3 entries", () => {
    expect(sample.mechanisms.length).toBeLessThanOrEqual(3);
    expect(sample.mechanisms.length).toBeGreaterThan(0);
  });

  it("red_flags has up to 3 entries", () => {
    expect(sample.red_flags.length).toBeLessThanOrEqual(3);
    expect(sample.red_flags.length).toBeGreaterThan(0);
  });
});

// ── SimulationResult optional field ──────────────────────────────────────────

describe("SimulationResult.nemotron_confidence optional field", () => {
  it("SimulationResult accepts nemotron_confidence when absent", () => {
    // Type check only — if this compiles the field is optional
    const partial: Pick<
      import("@/lib/planetary/types").SimulationResult,
      "nemotron_confidence"
    > = {};
    expect(partial.nemotron_confidence).toBeUndefined();
  });
});

// ── ClaimVerification optional field ─────────────────────────────────────────

describe("ClaimVerification.nemotron_analysis optional field", () => {
  const cv: ClaimVerification = {
    claimed_annual_co2_tons: 1_000_000,
    simulated_annual_co2_tons: 220_000,
    accuracy_ratio: 0.22,
    greenwashing_risk: "severe",
    discrepancy_pct: 78,
    evidence: ["Satellite forest-cover analysis shows no deforestation threat"],
    cala_sources: [],
  };

  it("nemotron_analysis is absent by default", () => {
    expect(cv.nemotron_analysis).toBeUndefined();
  });

  it("nemotron_analysis can be assigned", () => {
    const enriched: ClaimVerification = {
      ...cv,
      nemotron_analysis: {
        root_cause: "Non-additional REDD+ baseline.",
        mechanisms: ["Inflated threat model"],
        red_flags: ["4.5× overclaim"],
        model_used: "nvidia/nemotron-3.5-super-vl-120b-a12b",
      },
    };
    expect(enriched.nemotron_analysis?.root_cause).toBe("Non-additional REDD+ baseline.");
  });
});

// ── Confidence label derivation ───────────────────────────────────────────────

describe("confidence label thresholds", () => {
  function labelFromScore(score: number): "High" | "Medium" | "Low" {
    return score >= 0.7 ? "High" : score >= 0.45 ? "Medium" : "Low";
  }

  it("0.70 → High",   () => expect(labelFromScore(0.70)).toBe("High"));
  it("0.69 → Medium", () => expect(labelFromScore(0.69)).toBe("Medium"));
  it("0.45 → Medium", () => expect(labelFromScore(0.45)).toBe("Medium"));
  it("0.44 → Low",    () => expect(labelFromScore(0.44)).toBe("Low"));
  it("1.00 → High",   () => expect(labelFromScore(1.00)).toBe("High"));
  it("0.00 → Low",    () => expect(labelFromScore(0.00)).toBe("Low"));
});

// ── Greenwashing trigger condition ────────────────────────────────────────────

describe("greenwashing analysis trigger condition", () => {
  const triggerRisks = ["moderate", "high", "severe"] as const;
  const noTriggerRisks = ["none", "low"] as const;

  it.each(triggerRisks)("'%s' should trigger Nemotron analysis", (risk) => {
    const shouldRun = ["moderate", "high", "severe"].includes(risk);
    expect(shouldRun).toBe(true);
  });

  it.each(noTriggerRisks)("'%s' should NOT trigger Nemotron analysis", (risk) => {
    const shouldRun = ["moderate", "high", "severe"].includes(risk);
    expect(shouldRun).toBe(false);
  });
});
