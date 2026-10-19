import { describe, expect, it } from "vitest";
import { formatHours, groupByMonth, monthKey, monthLabel, summarizeBySport, totals } from "./progress";

const acts = [
  { sportName: "Mountainbike", durationS: 5400, trainingLoad: "120", startedAt: new Date("2026-10-18T15:00:00Z") },
  { sportName: "Mountainbike", durationS: 3600, trainingLoad: 80, startedAt: new Date("2026-10-05T15:00:00Z") },
  { sportName: "Jogging", durationS: 2400, trainingLoad: null, startedAt: new Date("2026-09-30T22:30:00Z") }, // 1. Oktober in Zürich
  { sportName: null, durationS: 600, trainingLoad: "abc", startedAt: new Date("2026-09-10T10:00:00Z") },
];

describe("summarizeBySport / totals", () => {
  it("summiert je Sportart, sortiert nach Zeit", () => {
    expect(summarizeBySport(acts)).toEqual([
      { sport: "Mountainbike", sessions: 2, seconds: 9000, load: 200 },
      { sport: "Jogging", sessions: 1, seconds: 2400, load: 0 },
      { sport: "Ohne Sportart", sessions: 1, seconds: 600, load: 0 },
    ]);
    expect(totals(acts)).toEqual({ sessions: 4, seconds: 12000, load: 200 });
  });
});

describe("groupByMonth", () => {
  it("gruppiert nach Zürcher Monat, neuester zuerst", () => {
    const groups = groupByMonth(acts);
    expect(groups.map((g) => g.key)).toEqual(["2026-10", "2026-09"]);
    expect(groups[0].activities).toHaveLength(3);
    expect(groups[0].label).toBe("Oktober 2026");
    expect(groups[0].bySport[0]).toMatchObject({ sport: "Mountainbike", sessions: 2 });
    expect(groups[1].totals.sessions).toBe(1);
  });

  it("kennt Monatsschlüssel und Label", () => {
    expect(monthKey(new Date("2026-09-30T22:30:00Z"))).toBe("2026-10");
    expect(monthLabel("2026-01")).toBe("Januar 2026");
  });
});

describe("formatHours", () => {
  it("formatiert Summen", () => {
    expect(formatHours(45 * 60)).toBe("45 min");
    expect(formatHours(2 * 3600)).toBe("2 h");
    expect(formatHours(12 * 3600 + 5 * 60)).toBe("12 h 05");
  });
});
