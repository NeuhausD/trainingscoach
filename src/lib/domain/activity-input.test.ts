import { describe, expect, it } from "vitest";
import { buildActivity } from "./activity-input";

const base = { sportId: "sport-1", date: "2026-10-16", time: "20:15", durationMin: "75", rpe: "7" };

describe("buildActivity", () => {
  it("baut einen Eishockey-Abend mit RPE-Belastung", () => {
    const a = buildActivity(base);
    expect(a.startedAt.toISOString()).toBe("2026-10-16T18:15:00.000Z");
    expect(a.durationS).toBe(4500);
    expect(a.rpe).toBe(7);
    // 75 min × RPE 7 / (60 × 7) × 100 = 125
    expect(a.trainingLoad).toBe(125);
    expect(a.equipmentId).toBeNull();
    expect(a.distanceM).toBeNull();
  });

  it("übernimmt optionale Felder und rechnet km in Meter um", () => {
    const a = buildActivity({ ...base, equipmentId: "eq-1", distanceKm: "32,5", elevationM: "850", title: " Feierabendrunde ", notes: "" });
    expect(a.equipmentId).toBe("eq-1");
    expect(a.distanceM).toBe(32500);
    expect(a.elevationGainM).toBe(850);
    expect(a.title).toBe("Feierabendrunde");
    expect(a.notes).toBeNull();
  });

  it("nutzt die Herzfrequenz für die Belastung, wenn Ruhe- und Maximalpuls bekannt sind", () => {
    const a = buildActivity({ ...base, rpe: "", avgHr: "150", maxHr: "185" }, { restingHr: 52 });
    expect(a.rpe).toBeNull();
    expect(a.trainingLoad).toBeGreaterThan(0);
  });

  it("ohne RPE und ohne Puls ist die Belastung 0", () => {
    expect(buildActivity({ ...base, rpe: "" }).trainingLoad).toBe(0);
  });

  it("lehnt fehlende oder unsinnige Angaben ab", () => {
    expect(() => buildActivity({ ...base, sportId: "" })).toThrow(/Sportart/);
    expect(() => buildActivity({ ...base, durationMin: "" })).toThrow(/Dauer/);
    expect(() => buildActivity({ ...base, durationMin: "0" })).toThrow(/Dauer/);
    expect(() => buildActivity({ ...base, rpe: "12" })).toThrow(/RPE/);
    expect(() => buildActivity({ ...base, date: "2099-01-01" })).toThrow(/Zukunft/);
    expect(() => buildActivity({ ...base, avgHr: "190", maxHr: "180" })).toThrow(/Maximalpuls/);
  });
});
