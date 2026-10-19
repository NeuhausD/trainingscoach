import { describe, expect, it } from "vitest";
import { describeSet, effectiveKg, parseSet, setVolumeKg, setsByMuscle } from "./strength";

const eisenhorn = { kgPerLevel: { "6": 22, "6.5": 24 } };

describe("parseSet", () => {
  it("liest kg- und Stufen-Sätze", () => {
    expect(parseSet({ reps: "8", weightKg: "60" })).toEqual({ reps: 8, weightKg: 60, level: null, rpe: null, notes: null });
    expect(parseSet({ reps: "10", level: "6,5", rpe: "8", notes: " eng " })).toEqual({ reps: 10, weightKg: null, level: 6.5, rpe: 8, notes: "eng" });
  });

  it("lehnt leere und ungültige Sätze ab", () => {
    expect(() => parseSet({})).toThrow(/Satz braucht/);
    expect(() => parseSet({ reps: "8", level: "6.3" })).toThrow(/halbe/);
    expect(() => parseSet({ reps: "0" })).toThrow(/Wiederholungen/);
  });
});

describe("effectiveKg / setVolumeKg / describeSet", () => {
  it("rechnet Stufe über die Gerätetabelle in kg um", () => {
    expect(effectiveKg({ weightKg: null, level: 6.5 }, eisenhorn)).toBe(24);
    expect(effectiveKg({ weightKg: null, level: 7 }, eisenhorn)).toBeNull();
    expect(effectiveKg({ weightKg: 50, level: 6 }, eisenhorn)).toBe(50);
  });

  it("berechnet das Volumen nur mit bekanntem Gewicht", () => {
    expect(setVolumeKg({ reps: 8, weightKg: 60, level: null })).toBe(480);
    expect(setVolumeKg({ reps: 10, weightKg: null, level: 6 }, eisenhorn)).toBe(220);
    expect(setVolumeKg({ reps: 10, weightKg: null, level: 6 }, null)).toBeNull();
  });

  it("beschreibt Sätze lesbar", () => {
    expect(describeSet({ reps: 8, weightKg: 60, level: null })).toBe("8 × 60 kg");
    expect(describeSet({ reps: 10, weightKg: null, level: 6.5 }, eisenhorn)).toBe("10 × Stufe 6.5 (24 kg)");
    expect(describeSet({ reps: 10, weightKg: null, level: 3 }, null)).toBe("10 × Stufe 3");
    expect(describeSet({ reps: 12, weightKg: null, level: null })).toBe("12 Wdh.");
  });
});

describe("setsByMuscle", () => {
  it("zählt Primärmuskeln voll und Sekundärmuskeln halb", () => {
    const sets = [
      { reps: 8, primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "back"] },
      { reps: 8, primaryMuscles: ["legs"], secondaryMuscles: ["glutes"] },
      { reps: 10, primaryMuscles: ["back", "biceps"], secondaryMuscles: ["back"] },
    ];
    expect(setsByMuscle(sets)).toEqual({ legs: 2, glutes: 1, back: 1.5, biceps: 1 });
  });
});
