import { describe, expect, it } from "vitest";
import { PERFORMANCE_METRICS } from "@/db/schema";
import { METRIC_INFO, parseBodyMetric, parsePerformanceMetric, weightTrend } from "./metrics";

describe("METRIC_INFO", () => {
  it("beschreibt jede Kennzahl", () => {
    for (const m of PERFORMANCE_METRICS) expect(METRIC_INFO[m].label).toBeTruthy();
  });
});

describe("parseBodyMetric", () => {
  it("liest Gewicht und Ruhepuls", () => {
    expect(parseBodyMetric({ date: "2026-10-19", weightKg: "78,4", restingHr: "52" })).toEqual({
      measuredOn: "2026-10-19",
      weightKg: 78.4,
      restingHr: 52,
      bodyFatPct: null,
      notes: null,
    });
  });

  it("verlangt mindestens einen Wert und ein Datum", () => {
    expect(() => parseBodyMetric({ date: "2026-10-19" })).toThrow(/Mindestens/);
    expect(() => parseBodyMetric({ date: "", weightKg: "78" })).toThrow(/Datum/);
    expect(() => parseBodyMetric({ date: "2026-10-19", restingHr: "52.5" })).toThrow(/Ruhepuls/);
  });
});

describe("parsePerformanceMetric", () => {
  it("liest Kennzahl mit Einheit", () => {
    expect(parsePerformanceMetric({ date: "2026-10-19", metric: "ftp_w", value: "245" })).toMatchObject({ metric: "ftp_w", value: 245, unit: "W" });
    expect(() => parsePerformanceMetric({ date: "2026-10-19", metric: "foo", value: "1" })).toThrow(/Kennzahl/);
    expect(() => parsePerformanceMetric({ date: "2026-10-19", metric: "ftp_w", value: "" })).toThrow(/Wert/);
  });
});

describe("weightTrend", () => {
  it("mittelt die letzten sieben Tage ab der neuesten Messung", () => {
    const rows = [
      { measuredOn: "2026-10-10", weightKg: 80 },
      { measuredOn: "2026-10-15", weightKg: 79 },
      { measuredOn: "2026-10-19", weightKg: 78 },
      { measuredOn: "2026-10-18", weightKg: null },
    ];
    expect(weightTrend(rows)).toBe(78.5);
    expect(weightTrend([])).toBeNull();
  });
});
