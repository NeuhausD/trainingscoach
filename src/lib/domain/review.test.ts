import { describe, expect, it } from "vitest";
import { isIntense, reviewWindow, type ReviewActivity } from "./review";

const now = new Date("2026-10-20T08:00:00Z");
const day = (d: number, h = 9) => new Date(now.getTime() - d * 86_400_000 + (h - 8) * 3600_000);
const ride = (d: number, min: number, load: number, rpe: number | null = null): ReviewActivity => ({ sportName: "Mountainbike", category: "endurance", durationS: min * 60, trainingLoad: load, rpe, startedAt: day(d) });
const gym = (d: number): ReviewActivity => ({ sportName: "Kraft Studio", category: "strength", durationS: 3600, trainingLoad: 50, rpe: 6, startedAt: day(d) });

describe("isIntense", () => {
  it("uses load per hour, falls back to RPE", () => {
    expect(isIntense(ride(1, 60, 80))).toBe(true);
    expect(isIntense(ride(1, 120, 100))).toBe(false);
    expect(isIntense({ ...ride(1, 60, 0), rpe: 8 })).toBe(true);
    expect(isIntense({ ...ride(1, 60, 0), rpe: 5 })).toBe(false);
  });
});

describe("reviewWindow", () => {
  it("rates a well-built block as effective", () => {
    // je Woche: eine lange Grundlage, eine harte Einheit, zwei Kraft; moderate Steigerung
    const current = [0, 1, 2, 3].flatMap((w) => [ride(w * 7 + 1, 150, 130), ride(w * 7 + 3, 60, 85), gym(w * 7 + 2), gym(w * 7 + 5)]);
    const previous = [0, 1, 2, 3].flatMap((w) => [ride(28 + w * 7 + 1, 140, 115), ride(28 + w * 7 + 3, 60, 75), gym(28 + w * 7 + 2), gym(28 + w * 7 + 5)]);
    const sets = ["legs", "glutes", "core", "back", "chest", "shoulders"].map((m) => ({ reps: 10, primaryMuscles: [m], secondaryMuscles: [] }));
    const r = reviewWindow(current, previous, sets, now);
    const by = Object.fromEntries(r.dimensions.map((d) => [d.key, d]));
    expect(by.base.verdict).toBe("gut");
    expect(by.intensity.verdict).toBe("gut");
    expect(by.long.verdict).toBe("gut");
    expect(by.strength.verdict).toBe("gut");
    expect(by.progression.verdict).toBe("gut");
    expect(by.consistency.verdict).toBe("gut");
    expect(by.recovery.verdict).toBe("gut");
    expect(r.overall).toBe("wirksam");
    expect(r.headline).toBe("Wirksam trainiert");
  });

  it("flags missing intensity, long sessions and strength as little effective", () => {
    // nur kurze, lockere Fahrten, grosse Pause
    const current = [ride(2, 60, 40), ride(3, 45, 30), ride(20, 60, 40), ride(27, 60, 45)];
    const r = reviewWindow(current, [], [], now);
    const by = Object.fromEntries(r.dimensions.map((d) => [d.key, d]));
    expect(by.base.verdict).toBe("zu wenig");
    expect(by.intensity.verdict).toBe("zu wenig");
    expect(by.long.verdict).toBe("zu wenig");
    expect(by.strength.verdict).toBe("zu wenig");
    expect(by.progression.verdict).toBe("offen");
    expect(by.consistency.verdict).toBe("zu wenig");
    expect(by.consistency.value).toContain("längste Pause 17 Tage");
    expect(r.overall).toBe("wenig wirksam");
    expect(r.text).toContain("Intensität zu wenig");
  });

  it("warns about too steep progression and acute overload", () => {
    const current = [0, 1, 2].flatMap((w) => [ride(w * 7 + 1, 90, 60)]).concat([ride(1, 180, 220), ride(2, 120, 160), ride(3, 90, 120)]);
    const previous = [0, 1, 2, 3].map((w) => ride(28 + w * 7 + 1, 60, 50));
    const r = reviewWindow(current, previous, [], now);
    const by = Object.fromEntries(r.dimensions.map((d) => [d.key, d]));
    expect(by.progression.verdict).toBe("zu viel");
    expect(by.recovery.verdict).toBe("zu viel");
    expect(r.overall).not.toBe("wirksam");
  });

  it("names missing muscle groups when sets are recorded", () => {
    const current = [0, 1, 2, 3].flatMap((w) => [gym(w * 7 + 1), gym(w * 7 + 4), ride(w * 7 + 2, 150, 130), ride(w * 7 + 5, 60, 85)]);
    const sets = [{ reps: 10, primaryMuscles: ["chest"], secondaryMuscles: ["triceps"] }];
    const r = reviewWindow(current, current, sets, now);
    const strength = r.dimensions.find((d) => d.key === "strength")!;
    expect(strength.verdict).toBe("gut");
    expect(strength.note).toContain("ohne Beine, Po, Bauch und Rumpf, Rücken, Schultern");
  });

  it("is open without activities", () => {
    const r = reviewWindow([], [], [], now);
    expect(r.overall).toBe("offen");
  });
});
