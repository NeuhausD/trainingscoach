import { describe, expect, it } from "vitest";
import { MUSCLE_LABELS } from "./eisenhorn-catalog";
import { GYM_EXERCISES } from "./gym-exercises";

describe("GYM_EXERCISES", () => {
  it("hat eindeutige Namen und Referenzen und nur bekannte Muskelgruppen", () => {
    expect(new Set(GYM_EXERCISES.map((e) => e.name)).size).toBe(GYM_EXERCISES.length);
    expect(new Set(GYM_EXERCISES.map((e) => e.externalRef)).size).toBe(GYM_EXERCISES.length);
    for (const e of GYM_EXERCISES) {
      expect(e.primaryMuscles.length, e.name).toBeGreaterThan(0);
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) expect(MUSCLE_LABELS[m], `${e.name}/${m}`).toBeDefined();
    }
  });

  it("deckt die Grundübungen für die Ziele ab (Big 5 und Schnellkraft)", () => {
    const names = GYM_EXERCISES.map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(["Kniebeuge (Langhantel)", "Kreuzheben", "Bankdrücken (Langhantel)", "Schulterdrücken stehend", "Klimmzüge", "Umsetzen (Power Clean)"]));
  });
});
