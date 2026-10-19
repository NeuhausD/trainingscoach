import { describe, expect, it } from "vitest";
import { SEED_EQUIPMENT } from "./seed-data";
import { EISENHORN_EXERCISES, MUSCLE_LABELS, availableAccessories, feasibleExercises, setupEffort } from "./eisenhorn-catalog";

const eisenhorn = SEED_EQUIPMENT.find((e) => e.name === "Eisenhorn")!.settings;

describe("EISENHORN_EXERCISES", () => {
  it("enthält den vollständigen Katalog mit eindeutigen Nummern", () => {
    expect(EISENHORN_EXERCISES.length).toBe(161);
    expect(new Set(EISENHORN_EXERCISES.map((e) => e.number)).size).toBe(161);
  });

  it("verwendet nur bekannte Muskelgruppen und Zubehör-Schlüssel", () => {
    const accessories = new Set(["griffstange", "griffband", "blocker", "karabiner", "seilzug"]);
    for (const e of EISENHORN_EXERCISES) {
      expect(e.primaryMuscles.length, e.name).toBeGreaterThan(0);
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) expect(MUSCLE_LABELS[m], `${e.name}/${m}`).toBeDefined();
      for (const a of e.accessories) expect(accessories.has(a), `${e.name}/${a}`).toBe(true);
      expect(e.requiresCablePulley).toBe(e.accessories.includes("seilzug"));
    }
  });
});

describe("availableAccessories / feasibleExercises", () => {
  it("leitet das Zubehör aus den Geräte-Settings ab", () => {
    expect([...availableAccessories(eisenhorn)].sort()).toEqual(["blocker", "griffband", "griffstange", "karabiner"]);
    expect(availableAccessories({ cablePulley: true }).has("seilzug")).toBe(true);
  });

  it("schliesst Seilzug-Übungen ohne Seilzug aus", () => {
    const feasible = feasibleExercises(eisenhorn);
    expect(feasible.length).toBe(161 - EISENHORN_EXERCISES.filter((e) => e.requiresCablePulley).length);
    expect(feasible.some((e) => e.requiresCablePulley)).toBe(false);
  });

  it("filtert nach Muskelgruppe", () => {
    const legs = feasibleExercises(eisenhorn, "legs");
    expect(legs.length).toBeGreaterThan(10);
    expect(legs.every((e) => e.primaryMuscles.includes("legs") || e.secondaryMuscles.includes("legs"))).toBe(true);
    expect(legs.map((e) => e.name)).toContain("Kniebeugen");
  });
});

describe("setupEffort", () => {
  it("bewertet den Umbauaufwand", () => {
    const byName = (n: string) => EISENHORN_EXERCISES.find((e) => e.name === n)!;
    expect(setupEffort(byName("Einbeinige Kniebeuge am Horn"))).toBe(0);
    expect(setupEffort(byName("Kniebeugen"))).toBe(1);
    expect(setupEffort(byName("Klimmzug mit Griffstange"))).toBe(2);
  });
});
