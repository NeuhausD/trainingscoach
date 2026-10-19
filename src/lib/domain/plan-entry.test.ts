import { describe, expect, it } from "vitest";
import { parsePlanEntry } from "./plan-entry";

const sports = { mtb: "Mountainbike", hockey: "Eishockey" };

describe("parsePlanEntry", () => {
  it("parses a valid entry and falls back to the sport name as title", () => {
    const e = parsePlanEntry({ sportId: "hockey", date: "2026-10-23", durationMin: "60", intensity: "tempo", title: "  ", description: " Match in Düdingen " }, sports);
    expect(e).toEqual({ sportId: "hockey", plannedOn: "2026-10-23", durationMin: 60, intensity: "tempo", title: "Eishockey", description: "Match in Düdingen" });
  });

  it("rejects unknown sport, bad date, duration and intensity", () => {
    const ok = { sportId: "mtb", date: "2026-10-23", durationMin: "60", intensity: "endurance", title: null, description: null };
    expect(() => parsePlanEntry({ ...ok, sportId: "x" }, sports)).toThrow(/Sportart/);
    expect(() => parsePlanEntry({ ...ok, date: "23.10.2026" }, sports)).toThrow(/Datum/);
    expect(() => parsePlanEntry({ ...ok, durationMin: "3" }, sports)).toThrow(/Dauer/);
    expect(() => parsePlanEntry({ ...ok, durationMin: "60.5" }, sports)).toThrow(/Dauer/);
    expect(() => parsePlanEntry({ ...ok, intensity: "hart" }, sports)).toThrow(/Intensität/);
  });
});
