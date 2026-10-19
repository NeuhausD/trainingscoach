import { describe, expect, it } from "vitest";
import { SEASONS } from "@/db/schema";
import { equipmentSettingsSchema } from "./equipment-settings";
import { isValidWeight } from "./preferences";
import { FALLBACK_SPORT_NAME, SEED_EQUIPMENT, SEED_SPORTS } from "./seed-data";

describe("SEED_SPORTS", () => {
  it("enthält die bekannten Sportarten und die Auffang-Sportart", () => {
    const names = SEED_SPORTS.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(["Mountainbike", "Jogging", "Kraft Studio", "Kraft Eisenhorn", "Eishockey", FALLBACK_SPORT_NAME]),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it("hat für jede Sportart alle vier Saisons mit gültiger Gewichtung", () => {
    for (const sport of SEED_SPORTS) {
      for (const season of SEASONS) {
        const pref = sport.seasons[season];
        expect(pref, `${sport.name}/${season}`).toBeDefined();
        expect(isValidWeight(pref.weight), `${sport.name}/${season}`).toBe(true);
      }
    }
  });

  it("ordnet Strava-Typen eindeutig zu", () => {
    const all = SEED_SPORTS.flatMap((s) => s.stravaTypes);
    expect(new Set(all).size).toBe(all.length);
    expect(SEED_SPORTS.find((s) => s.name === "Mountainbike")?.stravaTypes).toContain("MountainBikeRide");
    expect(SEED_SPORTS.find((s) => s.name === "Eishockey")?.stravaTypes).toContain("IceSkate");
  });

  it("bildet die Saisonalität aus der Vision ab", () => {
    const mtb = SEED_SPORTS.find((s) => s.name === "Mountainbike")!;
    const hockey = SEED_SPORTS.find((s) => s.name === "Eishockey")!;
    expect(mtb.seasons.summer.weight).toBeGreaterThan(mtb.seasons.winter.weight);
    expect(hockey.seasons.winter.weight).toBeGreaterThan(hockey.seasons.summer.weight);
  });
});

describe("SEED_EQUIPMENT", () => {
  it("enthält ein XC-Bike, ein Trail-Bike und das Eisenhorn", () => {
    expect(SEED_EQUIPMENT.map((e) => e.kind).sort()).toEqual(["bike_trail", "bike_xc", "home_gym"]);
    expect(new Set(SEED_EQUIPMENT.map((e) => e.name)).size).toBe(SEED_EQUIPMENT.length);
  });

  it("beschreibt das Eisenhorn mit Kolben, Stufen und ohne Seilzug", () => {
    const eisenhorn = SEED_EQUIPMENT.find((e) => e.name === "Eisenhorn")!;
    expect(eisenhorn.settings).toMatchObject({ piston: "16", levels: 10, cablePulley: false });
    expect(equipmentSettingsSchema.safeParse(eisenhorn.settings).success).toBe(true);
  });
});
