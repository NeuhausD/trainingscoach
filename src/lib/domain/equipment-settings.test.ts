import { describe, expect, it } from "vitest";
import {
  describeSettings,
  formatKgPerLevel,
  kgForLevel,
  parseKgPerLevel,
  parseSettingsForm,
} from "./equipment-settings";

describe("parseSettingsForm", () => {
  it("liest die Eisenhorn-Parameter aus dem Formular", () => {
    const s = parseSettingsForm({
      model: " EISENHORN, ältere Generation ",
      piston: "16",
      levels: "10",
      halfSteps: false,
      cablePulley: false,
      accessories: "Griffstange, Griffband (2x), Blocker, Karabiner",
    });
    expect(s).toEqual({
      model: "EISENHORN, ältere Generation",
      piston: "16",
      levels: 10,
      accessories: ["Griffstange", "Griffband (2x)", "Blocker", "Karabiner"],
    });
  });

  it("liefert null, wenn alle Felder leer sind", () => {
    expect(parseSettingsForm({ model: "", piston: " ", levels: "", accessories: "" })).toBeNull();
  });

  it("lehnt ungültige Stufenzahlen ab", () => {
    expect(() => parseSettingsForm({ levels: "2.5" })).toThrow(RangeError);
    expect(() => parseSettingsForm({ levels: "0" })).toThrow(RangeError);
  });
});

describe("parseKgPerLevel / formatKgPerLevel", () => {
  it("liest Stufe=kg-Paare, getrennt durch Komma, Semikolon oder Zeilenumbruch", () => {
    expect(parseKgPerLevel("1=6, 1.5=7.5; 2: 9\n3=12.5")).toEqual({ "1": 6, "1.5": 7.5, "2": 9, "3": 12.5 });
    expect(parseKgPerLevel("")).toBeUndefined();
  });

  it("lehnt unlesbare Angaben ab", () => {
    expect(() => parseKgPerLevel("drei=zwölf")).toThrow(RangeError);
    expect(() => parseKgPerLevel("1=7,5")).toThrow(RangeError);
  });

  it("formatiert sortiert nach Stufe", () => {
    expect(formatKgPerLevel({ "2": 9, "1": 6, "1.5": 7.5 })).toBe("1=6, 1.5=7.5, 2=9");
    expect(formatKgPerLevel(undefined)).toBe("");
  });
});

describe("kgForLevel", () => {
  it("gibt das Gewicht zur Stufe oder null zurück", () => {
    const settings = { kgPerLevel: { "3": 12.5 } };
    expect(kgForLevel(settings, 3)).toBe(12.5);
    expect(kgForLevel(settings, 4)).toBeNull();
    expect(kgForLevel(null, 1)).toBeNull();
  });
});

describe("describeSettings", () => {
  it("fasst die Parameter in einer Zeile zusammen", () => {
    expect(describeSettings({ piston: "16", levels: 10, cablePulley: false })).toBe(
      "Kolben 16, 10 Stufen, ohne Seilzug",
    );
    expect(describeSettings({ levels: 12, halfSteps: true, cablePulley: true })).toBe(
      "12 Stufen mit Halbstufen, mit Seilzug",
    );
    expect(describeSettings(null)).toBe("");
  });
});
