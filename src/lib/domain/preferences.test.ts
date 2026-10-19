import { describe, expect, it } from "vitest";
import {
  completeSeasonPreferences,
  parseTargetSessions,
  parseWeight,
  sortByWeightForSeason,
  weightLabel,
} from "./preferences";

describe("parseWeight", () => {
  it("akzeptiert ganze Zahlen 0..10", () => {
    expect(parseWeight("0")).toBe(0);
    expect(parseWeight(" 7 ")).toBe(7);
    expect(parseWeight("10")).toBe(10);
  });

  it("nutzt den Standard bei leerer Eingabe", () => {
    expect(parseWeight("")).toBe(5);
    expect(parseWeight(null, 3)).toBe(3);
    expect(parseWeight(undefined)).toBe(5);
  });

  it("lehnt ungültige Werte ab", () => {
    expect(() => parseWeight("11")).toThrow(RangeError);
    expect(() => parseWeight("-1")).toThrow(RangeError);
    expect(() => parseWeight("2.5")).toThrow(RangeError);
    expect(() => parseWeight("abc")).toThrow(RangeError);
  });
});

describe("parseTargetSessions", () => {
  it("leer → null, sonst ganze Zahl", () => {
    expect(parseTargetSessions("")).toBeNull();
    expect(parseTargetSessions("3")).toBe(3);
    expect(() => parseTargetSessions("15")).toThrow(RangeError);
    expect(() => parseTargetSessions("1.5")).toThrow(RangeError);
  });
});

describe("completeSeasonPreferences", () => {
  it("ergänzt fehlende Saisons mit Standardwerten in fester Reihenfolge", () => {
    const result = completeSeasonPreferences([{ season: "winter", weight: 9 }]);
    expect(result.map((p) => p.season)).toEqual(["spring", "summer", "autumn", "winter"]);
    expect(result[3]).toEqual({ season: "winter", weight: 9, targetSessionsPerWeek: null, notes: null });
    expect(result[0]).toEqual({ season: "spring", weight: 5, targetSessionsPerWeek: null, notes: null });
  });

  it("bei doppelten Saisons gewinnt der letzte Eintrag", () => {
    const result = completeSeasonPreferences([
      { season: "summer", weight: 2 },
      { season: "summer", weight: 8, targetSessionsPerWeek: 3 },
    ]);
    expect(result.find((p) => p.season === "summer")).toEqual({
      season: "summer",
      weight: 8,
      targetSessionsPerWeek: 3,
      notes: null,
    });
  });
});

describe("weightLabel", () => {
  it("beschreibt die Gewichtung", () => {
    expect(weightLabel(0)).toBe("nie");
    expect(weightLabel(3)).toBe("selten");
    expect(weightLabel(5)).toBe("regelmässig");
    expect(weightLabel(8)).toBe("oft");
    expect(weightLabel(10)).toBe("Schwerpunkt");
  });
});

describe("sortByWeightForSeason", () => {
  it("sortiert nach Gewichtung der Saison, dann nach Name", () => {
    const sports = [
      { name: "Jogging", preferences: completeSeasonPreferences([{ season: "winter", weight: 6 }]) },
      { name: "Eishockey", preferences: completeSeasonPreferences([{ season: "winter", weight: 7 }]) },
      { name: "Mountainbike", preferences: completeSeasonPreferences([{ season: "winter", weight: 1 }]) },
      { name: "Kraft Studio", preferences: completeSeasonPreferences([{ season: "winter", weight: 7 }]) },
    ];
    expect(sortByWeightForSeason(sports, "winter").map((s) => s.name)).toEqual([
      "Eishockey",
      "Kraft Studio",
      "Jogging",
      "Mountainbike",
    ]);
    // Eingabe bleibt unverändert
    expect(sports[0].name).toBe("Jogging");
  });
});
