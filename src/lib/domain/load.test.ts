import { describe, expect, it } from "vitest";
import { trainingLoad } from "./load";

describe("trainingLoad", () => {
  it("liefert 100 für eine Stunde an der FTP", () => {
    expect(trainingLoad({ durationS: 3600, avgPowerW: 250, ftpW: 250 })).toBe(100);
  });

  it("bevorzugt Leistung vor Herzfrequenz", () => {
    const load = trainingLoad({ durationS: 3600, avgPowerW: 125, ftpW: 250, avgHr: 180, restingHr: 50, maxHr: 190 });
    expect(load).toBe(25);
  });

  it("rechnet HF-basiert, wenn keine Leistung vorhanden ist", () => {
    // HRR = (160-50)/(190-50) = 0.786 → Faktor 0.924 → 85.4 pro Stunde
    expect(trainingLoad({ durationS: 3600, avgHr: 160, restingHr: 50, maxHr: 190 })).toBeCloseTo(85.5, 0);
  });

  it("fällt auf RPE zurück (Eishockey, Krafttraining)", () => {
    // 60 min × RPE 7 = 100
    expect(trainingLoad({ durationS: 3600, rpe: 7 })).toBe(100);
    expect(trainingLoad({ durationS: 1800, rpe: 7 })).toBe(50);
  });

  it("gibt 0 ohne verwertbare Daten", () => {
    expect(trainingLoad({ durationS: 3600 })).toBe(0);
    expect(trainingLoad({ durationS: 0, rpe: 8 })).toBe(0);
  });
});
