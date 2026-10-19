import { describe, expect, it } from "vitest";
import { buildCoachContext, homeGymContext, latestPerformance, recentWeeksBySport, type CoachContextInput } from "./coach-context";

const now = new Date("2026-10-19T10:00:00Z"); // Montag
const eisenhornSettings = { model: "Eisenhorn", piston: "16", levels: 10, halfSteps: false, cablePulley: false, accessories: ["griffstange", "griffband", "karabiner"] };

const input: CoachContextInput = {
  now,
  today: "2026-10-19",
  season: "autumn",
  goals: ["Fitness"],
  sports: [
    {
      name: "Mountainbike",
      category: "endurance",
      active: true,
      notes: "Trails",
      preferences: [
        { season: "autumn", weight: 6, targetSessionsPerWeek: 2, notes: "nur trocken" },
        { season: "winter", weight: 1, targetSessionsPerWeek: null, notes: null },
      ],
    },
    { name: "Ski", category: "other", active: false, notes: null, preferences: [{ season: "autumn", weight: 5, targetSessionsPerWeek: null, notes: null }] },
    { name: "Kraft Eisenhorn", category: "strength", active: true, notes: null, preferences: [] },
    { name: "Eishockey", category: "team", active: true, selfPlanned: true, notes: null, preferences: [{ season: "autumn", weight: 5, targetSessionsPerWeek: 1, notes: null }] },
  ],
  equipment: [
    { name: "Scott Spark", kind: "bike_xc", retired: false, settings: null },
    { name: "Yeti LT", kind: "bike_trail", retired: true, settings: null },
    { name: "Eisenhorn", kind: "home_gym", retired: false, settings: eisenhornSettings },
  ],
  activities: [
    { sportName: "Mountainbike", durationS: 7200, trainingLoad: "120", startedAt: new Date("2026-10-17T08:00:00Z") },
    { sportName: "Mountainbike", durationS: 3600, trainingLoad: 60, startedAt: new Date("2026-10-11T08:00:00Z") },
    { sportName: "Wandern", durationS: 5400, trainingLoad: null, startedAt: new Date("2026-10-10T08:00:00Z") },
  ],
  body: { weightKg: "84", restingHr: null },
  performance: [
    { metric: "ftp_w", value: "200", unit: "W", measuredOn: "2026-09-01" },
    { metric: "ftp_w", value: "210", unit: "W", measuredOn: "2026-10-01" },
    { metric: "vo2max", value: 48.8, unit: "ml/kg/min", measuredOn: "2026-10-18" },
  ],
  forecast: [{ date: "2026-10-19", tempMaxC: 12, tempMinC: 4, precipitationMm: 0, precipitationProbability: 10, windMaxKmh: 15 }],
  constraints: ["Freitag kein Training"],
  recentSets: [
    { reps: 10, primaryMuscles: ["chest"], secondaryMuscles: ["triceps"] },
    { reps: 10, primaryMuscles: ["chest"], secondaryMuscles: [] },
  ],
};

describe("recentWeeksBySport", () => {
  it("splits the last four weeks by sport", () => {
    const weeks = recentWeeksBySport(input.activities, now, 4);
    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19"]);
    expect(weeks[1].bySport).toEqual({ Mountainbike: { sessions: 1, hours: 1 }, Wandern: { sessions: 1, hours: 1.5 } });
    expect(weeks[2]).toMatchObject({ sessions: 1, hours: 2, load: 120, bySport: { Mountainbike: { sessions: 1, hours: 2 } } });
    expect(weeks[3].sessions).toBe(0);
  });
});

describe("homeGymContext", () => {
  it("returns null without a home gym", () => {
    expect(homeGymContext([{ name: "Bike", kind: "bike_xc", retired: false, settings: null }], [])).toBeNull();
  });

  it("ranks neglected muscles first and keeps low-setup exercises only", () => {
    const ctx = homeGymContext(input.equipment, input.recentSets)!;
    expect(ctx.name).toBe("Eisenhorn");
    expect(ctx.recentSetsByMuscle.Brust).toBe(2);
    expect(ctx.recentSetsByMuscle.Trizeps).toBe(0.5);
    expect(ctx.neglectedMuscles).not.toContain("Brust");
    expect(ctx.neglectedMuscles).toContain("Beine");
    expect(ctx.exercises.length).toBeGreaterThan(5);
    expect(ctx.exercises.length).toBeLessThanOrEqual(24);
    expect(ctx.exercises.every((e) => e.setup !== "umbau")).toBe(true);
    expect(ctx.exercises.every((e) => !e.accessories.includes("seilzug"))).toBe(true);
    // der erste Kandidat trifft eine vernachlässigte Muskelgruppe
    expect(ctx.exercises[0].muscles.some((m) => ctx.neglectedMuscles.includes(m))).toBe(true);
  });

  it("falls back to the three least trained muscles when nothing is neglected", () => {
    const sets = Object.keys({ back: 1, biceps: 1, calves: 1, chest: 1, core: 1, forearms: 1, glutes: 1, legs: 1, neck: 1, shoulders: 1, triceps: 1 }).map((m) => ({
      reps: 8,
      primaryMuscles: [m],
      secondaryMuscles: [],
    }));
    const ctx = homeGymContext(input.equipment, sets)!;
    expect(ctx.neglectedMuscles).toHaveLength(3);
  });
});

describe("latestPerformance", () => {
  it("keeps the newest value per metric", () => {
    const p = latestPerformance(input.performance);
    expect(p).toEqual([
      { metric: "vo2max", value: 48.8, unit: "ml/kg/min", measuredOn: "2026-10-18" },
      { metric: "ftp_w", value: 210, unit: "W", measuredOn: "2026-10-01" },
    ]);
  });
});

describe("buildCoachContext", () => {
  it("uses the season weight, skips inactive sports and retired equipment", () => {
    const ctx = buildCoachContext(input);
    expect(ctx.sports.map((s) => s.name)).toEqual(["Mountainbike", "Kraft Eisenhorn", "Eishockey"]);
    expect(ctx.sports[0]).toMatchObject({ seasonWeight: 6, targetSessionsPerWeek: 2, selfPlanned: false, notes: "Trails; nur trocken" });
    expect(ctx.sports[2]).toMatchObject({ seasonWeight: 5, selfPlanned: true });
    expect(ctx.sports[1]).toMatchObject({ seasonWeight: 0, targetSessionsPerWeek: null, notes: null });
    expect(ctx.equipment.map((e) => e.name)).toEqual(["Scott Spark", "Eisenhorn"]);
    expect(ctx.bodyMetrics).toEqual({ weightKg: 84, restingHr: null });
    expect(ctx.recentWeeks).toHaveLength(4);
    expect(ctx.homeGym?.name).toBe("Eisenhorn");
    expect(ctx.constraints).toEqual(["Freitag kein Training"]);
    expect(ctx.forecast).toHaveLength(1);
  });
});
