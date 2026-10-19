import { describe, expect, it } from "vitest";
import { afterTimestamp, gearToEquipment, mapStravaActivity, resolveEquipment, resolveSport } from "./strava-mapping";

const ctx = {
  sports: [
    { id: "mtb", name: "Mountainbike", stravaTypes: ["MountainBikeRide", "Ride"] },
    { id: "run", name: "Jogging", stravaTypes: ["Run", "TrailRun"] },
    { id: "other", name: "Sonstiges", stravaTypes: [] },
  ],
  fallbackSportName: "Sonstiges",
  equipment: [
    { id: "spark", stravaGearId: "b123" },
    { id: "eisenhorn", stravaGearId: null },
  ],
  ftpW: 250,
  restingHr: 52,
};

describe("resolveSport / resolveEquipment", () => {
  it("ordnet Strava-Typen zu und fällt auf Sonstiges zurück", () => {
    expect(resolveSport("MountainBikeRide", ctx.sports, "Sonstiges")).toBe("mtb");
    expect(resolveSport("trailrun", ctx.sports, "Sonstiges")).toBe("run");
    expect(resolveSport("Kayaking", ctx.sports, "Sonstiges")).toBe("other");
    expect(resolveSport(null, [], "Sonstiges")).toBeNull();
  });

  it("erkennt bekanntes Gear und meldet unbekanntes", () => {
    expect(resolveEquipment("b123", ctx.equipment)).toEqual({ equipmentId: "spark", unknownGearId: null });
    expect(resolveEquipment("b999", ctx.equipment)).toEqual({ equipmentId: null, unknownGearId: "b999" });
    expect(resolveEquipment(null, ctx.equipment)).toEqual({ equipmentId: null, unknownGearId: null });
  });
});

describe("mapStravaActivity", () => {
  const ride = {
    id: 1234567,
    name: "Feierabendrunde",
    sport_type: "MountainBikeRide",
    start_date: "2026-10-18T15:30:00Z",
    moving_time: 5400,
    elapsed_time: 6000,
    distance: 32500.4,
    total_elevation_gain: 850.2,
    average_heartrate: 148.3,
    max_heartrate: 176,
    average_watts: 190.5,
    device_watts: true,
    gear_id: "b123",
  };

  it("bildet eine Tour mit Leistungsdaten ab", () => {
    const m = mapStravaActivity(ride, ctx);
    expect(m.externalId).toBe("strava:1234567");
    expect(m.sportId).toBe("mtb");
    expect(m.equipmentId).toBe("spark");
    expect(m.startedAt.toISOString()).toBe("2026-10-18T15:30:00.000Z");
    expect(m.durationS).toBe(5400);
    expect(m.distanceM).toBe(32500);
    expect(m.elevationGainM).toBe(850);
    expect(m.avgPowerW).toBe(191);
    // 1.5 h × (191/250)² × 100
    expect(m.trainingLoad).toBeCloseTo(1.5 * (191 / 250) ** 2 * 100, 0);
    expect(m.rawSummary).toEqual({ stravaId: 1234567, sportType: "MountainBikeRide", gearId: "b123", trainer: false });
  });

  it("ignoriert geschätzte Watt und nutzt den Puls", () => {
    const m = mapStravaActivity({ ...ride, device_watts: false, gear_id: "b999" }, ctx);
    expect(m.avgPowerW).toBeNull();
    expect(m.trainingLoad).toBeGreaterThan(0);
    expect(m.equipmentId).toBeNull();
    expect(m.unknownGearId).toBe("b999");
  });

  it("kommt mit fehlenden Feldern zurecht", () => {
    const m = mapStravaActivity({ id: 1, start_date: "2026-01-01T10:00:00Z", type: "IceSkate" }, { ...ctx, ftpW: null, restingHr: null });
    expect(m.durationS).toBe(0);
    expect(m.sportId).toBe("other");
    expect(m.title).toBeNull();
    expect(m.trainingLoad).toBe(0);
  });
});

describe("gearToEquipment / afterTimestamp", () => {
  it("leitet Gerätetyp und Name aus Strava-Gear ab", () => {
    expect(gearToEquipment({ id: "b42", name: "Scott Spark", frame_type: 1 })).toEqual({ name: "Scott Spark", kind: "bike_trail", stravaGearId: "b42", retired: false });
    expect(gearToEquipment({ id: "b43", name: "Rennvelo", frame_type: 3 })).toMatchObject({ kind: "other" });
    expect(gearToEquipment({ id: "g7", nickname: "Pegasus", retired: true })).toMatchObject({ kind: "shoes", name: "Pegasus", retired: true });
    expect(gearToEquipment({ id: "b9" }).name).toBe("Strava-Gear b9");
  });

  it("berechnet den after-Parameter in Sekunden", () => {
    expect(afterTimestamp(new Date("2026-10-19T00:00:00Z"), 30)).toBe(Math.floor(new Date("2026-09-19T00:00:00Z").getTime() / 1000));
  });
});
