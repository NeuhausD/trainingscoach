import { describe, expect, it } from "vitest";
import { formatDate, formatDuration, localToUtc, tzOffsetMinutes, utcToLocalParts } from "./time";

describe("localToUtc / utcToLocalParts", () => {
  it("rechnet Sommer- und Winterzeit korrekt um", () => {
    expect(localToUtc("2026-07-06", "10:00").toISOString()).toBe("2026-07-06T08:00:00.000Z");
    expect(localToUtc("2026-01-11", "10:00").toISOString()).toBe("2026-01-11T09:00:00.000Z");
    expect(utcToLocalParts(new Date("2026-07-06T08:00:00Z"))).toEqual({ date: "2026-07-06", time: "10:00" });
  });

  it("ist am Tag der Zeitumstellung konsistent", () => {
    // 2026-03-29 02:00 MEZ → 03:00 MESZ; 04:00 Ortszeit ist 02:00 UTC
    expect(localToUtc("2026-03-29", "04:00").toISOString()).toBe("2026-03-29T02:00:00.000Z");
    expect(utcToLocalParts(localToUtc("2026-10-25", "01:30"))).toEqual({ date: "2026-10-25", time: "01:30" });
  });

  it("lehnt ungültige Eingaben ab", () => {
    expect(() => localToUtc("2026-13-01", "10:00")).toThrow(RangeError);
    expect(() => localToUtc("2026-07-06", "25:00")).toThrow(RangeError);
    expect(() => localToUtc("6.7.2026", "10:00")).toThrow(RangeError);
  });

  it("kennt den Zürcher Offset", () => {
    expect(tzOffsetMinutes(new Date("2026-07-01T00:00:00Z"))).toBe(120);
    expect(tzOffsetMinutes(new Date("2026-12-01T00:00:00Z"))).toBe(60);
  });
});

describe("Formatierung", () => {
  it("formatiert Datum und Dauer auf Deutsch", () => {
    expect(formatDate("2026-07-06")).toBe("6. Juli 2026");
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(90 * 60)).toBe("1 h 30 min");
    expect(formatDuration(3600)).toBe("1 h");
  });
});
