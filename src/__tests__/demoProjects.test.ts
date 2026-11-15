import { DEMO_PROJECTS } from "@/lib/planetary/demoProjects";

const GREEN = "#4ade80";
const AMBER = "#fbbf24";
const RED   = "#f87171";

// ── Existence ─────────────────────────────────────────────────────────────────
describe("DEMO_PROJECTS existence", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(DEMO_PROJECTS)).toBe(true);
    expect(DEMO_PROJECTS.length).toBeGreaterThan(0);
  });
});

// ── Required fields ───────────────────────────────────────────────────────────
describe("required fields", () => {
  it.each(DEMO_PROJECTS)("$name has all required string fields", (p) => {
    expect(typeof p.id).toBe("string");
    expect(p.id.length).toBeGreaterThan(0);
    expect(typeof p.name).toBe("string");
    expect(p.name.length).toBeGreaterThan(0);
    expect(typeof p.country).toBe("string");
    expect(p.country.length).toBeGreaterThan(0);
    expect(typeof p.simId).toBe("string");
    expect(p.simId.length).toBeGreaterThan(0);
    expect(typeof p.interventionId).toBe("string");
    expect(p.interventionId.length).toBeGreaterThan(0);
    expect(typeof p.scoreColor).toBe("string");
    expect(typeof p.gwLabel).toBe("string");
    expect(typeof p.simpleExplainer).toBe("string");
    expect(p.simpleExplainer.length).toBeGreaterThan(10);
    expect(typeof p.findingSummary).toBe("string");
    expect(p.findingSummary.length).toBeGreaterThan(10);
  });
});

// ── Score range ───────────────────────────────────────────────────────────────
describe("score range", () => {
  it.each(DEMO_PROJECTS)("$name score is 0–100", (p) => {
    expect(p.score).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThanOrEqual(100);
  });
});

// ── Coordinates ───────────────────────────────────────────────────────────────
describe("coordinates", () => {
  it.each(DEMO_PROJECTS)("$name has valid lat/lng", (p) => {
    expect(p.lat).toBeGreaterThanOrEqual(-90);
    expect(p.lat).toBeLessThanOrEqual(90);
    expect(p.lng).toBeGreaterThanOrEqual(-180);
    expect(p.lng).toBeLessThanOrEqual(180);
  });
});

// ── No duplicate IDs ──────────────────────────────────────────────────────────
describe("unique IDs", () => {
  it("no two projects share an id", () => {
    const ids = DEMO_PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Score colour consistency ──────────────────────────────────────────────────
describe("scoreColor consistency", () => {
  it.each(DEMO_PROJECTS)("$name scoreColor matches its score tier", (p) => {
    if (p.score >= 75) {
      expect(p.scoreColor).toBe(GREEN);
    } else if (p.score >= 50) {
      expect(p.scoreColor).toBe(AMBER);
    } else {
      expect(p.scoreColor).toBe(RED);
    }
  });
});

// ── Example-only projects ─────────────────────────────────────────────────────
describe("isExampleOnly", () => {
  it("example-only projects have a demoTypeLabel", () => {
    DEMO_PROJECTS.filter((p) => p.isExampleOnly).forEach((p) => {
      expect(typeof p.demoTypeLabel).toBe("string");
      expect((p.demoTypeLabel ?? "").length).toBeGreaterThan(0);
    });
  });

  it("non-example projects have no demoTypeLabel by default", () => {
    DEMO_PROJECTS.filter((p) => !p.isExampleOnly).forEach((p) => {
      // demoTypeLabel may be absent or undefined — just not a non-empty string
      expect(p.demoTypeLabel ?? "").toBe("");
    });
  });
});

// ── At least one of each verdict tier ────────────────────────────────────────
describe("verdict tier coverage", () => {
  it("has at least one passing project (score ≥75)", () => {
    expect(DEMO_PROJECTS.some((p) => p.score >= 75)).toBe(true);
  });
  it("has at least one overclaiming project (50–74)", () => {
    expect(DEMO_PROJECTS.some((p) => p.score >= 50 && p.score < 75)).toBe(true);
  });
  it("has at least one failing project (score <50)", () => {
    expect(DEMO_PROJECTS.some((p) => p.score < 50)).toBe(true);
  });
});
