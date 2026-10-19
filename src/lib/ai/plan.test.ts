import { describe, expect, it } from "vitest";
import { planToSuggestions } from "./plan";
import type { WeekPlan } from "./coach";

const sports = [
  { id: "mtb", name: "Mountainbike", category: "endurance" },
  { id: "eh", name: "Kraft Eisenhorn", category: "strength" },
  { id: "gym", name: "Kraft Studio", category: "strength" },
];

const plan: WeekPlan = {
  summary: "Lockere Woche.",
  weeklyLoadTarget: 300,
  sessions: [
    {
      plannedOn: "2026-10-20",
      sport: "mountainbike",
      title: "Grundlage Plaffeien",
      description: "90 min locker",
      durationMin: 90,
      intensity: "endurance",
      equipment: "Scott Spark",
      rationale: "Trocken und mild.",
      variants: [{ label: "Regen", description: "60 min Rolle", durationMin: 60 }],
    },
    { plannedOn: "2026-10-22", sport: "Unbekannt", title: "X", description: "Y", durationMin: 30, intensity: "tempo", equipment: null, rationale: "r", variants: [] },
  ],
  quickSessions: [
    { plannedOn: "2026-10-21", title: "Beine kurz", muscles: ["Beine"], exercises: [{ name: "Kniebeuge", sets: 3, reps: "10" }], durationMin: 8, rationale: "Beine waren nicht dran." },
  ],
};

describe("planToSuggestions", () => {
  it("maps sessions to sports by name, case-insensitive, and quick sessions to the Eisenhorn sport", () => {
    const items = planToSuggestions(plan, sports, "2026-10-19T10:00:00.000Z");
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ sportId: "mtb", plannedOn: "2026-10-20", intensity: "endurance", durationMin: 90 });
    expect(items[0].meta.variants).toHaveLength(1);
    expect(items[0].meta.plan).toEqual({ summary: "Lockere Woche.", weeklyLoadTarget: 300, generatedAt: "2026-10-19T10:00:00.000Z" });
    expect(items[1].sportId).toBeNull();
    expect(items[2]).toMatchObject({ sportId: "eh", intensity: "strength", durationMin: 8, description: "Kniebeuge: 3 × 10" });
    expect(items[2].meta.quick?.muscles).toEqual(["Beine"]);
  });
});
