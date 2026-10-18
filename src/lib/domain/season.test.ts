import { describe, expect, it } from "vitest";
import { seasonForDate, seasonForMonth } from "./season";

describe("seasonForMonth", () => {
  it("ordnet Monate den meteorologischen Jahreszeiten zu", () => {
    expect(seasonForMonth(12)).toBe("winter");
    expect(seasonForMonth(2)).toBe("winter");
    expect(seasonForMonth(3)).toBe("spring");
    expect(seasonForMonth(6)).toBe("summer");
    expect(seasonForMonth(8)).toBe("summer");
    expect(seasonForMonth(11)).toBe("autumn");
  });

  it("lehnt ungültige Monate ab", () => {
    expect(() => seasonForMonth(0)).toThrow(RangeError);
    expect(() => seasonForMonth(13)).toThrow(RangeError);
  });
});

describe("seasonForDate", () => {
  it("nutzt die Zeitzone Europe/Zurich", () => {
    // 23:30 UTC am 31. Mai ist in Zürich bereits 1. Juni → Sommer
    expect(seasonForDate(new Date("2026-05-31T23:30:00Z"))).toBe("summer");
    expect(seasonForDate(new Date("2026-05-31T23:30:00Z"), "UTC")).toBe("spring");
  });
});
