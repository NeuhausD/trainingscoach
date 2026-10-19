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

import { compareWindows, metricDeltas, monthlyBySport, percentChange, weekStartKey, weeklyBuckets, weightSeries } from "./progress";

const now = new Date("2026-10-19T12:00:00Z"); // Montag

describe("weekStartKey / weeklyBuckets", () => {
  it("findet den Montag der Zürcher Woche", () => {
    expect(weekStartKey(new Date("2026-10-19T12:00:00Z"))).toBe("2026-10-19");
    expect(weekStartKey(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19"); // Montag 00:30 in Zürich
    expect(weekStartKey(new Date("2026-10-18T10:00:00Z"))).toBe("2026-10-12");
  });

  it("füllt leere Wochen und summiert", () => {
    const b = weeklyBuckets(
      [
        { sportName: "Mountainbike", durationS: 3600, trainingLoad: 100, startedAt: new Date("2026-10-19T08:00:00Z") },
        { sportName: "Jogging", durationS: 1800, trainingLoad: 40, startedAt: new Date("2026-10-06T08:00:00Z") },
      ],
      now,
      3,
    );
    expect(b.map((w) => w.weekStart)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"]);
    expect(b[0]).toMatchObject({ sessions: 1, seconds: 1800, load: 40 });
    expect(b[1]).toMatchObject({ sessions: 0, seconds: 0, load: 0 });
    expect(b[2]).toMatchObject({ sessions: 1, seconds: 3600, load: 100 });
  });
});

describe("compareWindows / percentChange", () => {
  it("vergleicht die letzten 28 Tage mit den 28 davor", () => {
    const acts = [
      { sportName: "Mountainbike", durationS: 3600, trainingLoad: 100, elevationGainM: "500", startedAt: new Date("2026-10-10T08:00:00Z") },
      { sportName: "Mountainbike", durationS: 7200, trainingLoad: 150, elevationGainM: 800, startedAt: new Date("2026-09-10T08:00:00Z") },
      { sportName: "Jogging", durationS: 1800, trainingLoad: 50, elevationGainM: null, startedAt: new Date("2026-07-01T08:00:00Z") },
    ];
    const c = compareWindows(acts, now);
    expect(c.current).toEqual({ sessions: 1, seconds: 3600, load: 100, elevationM: 500 });
    expect(c.previous).toEqual({ sessions: 1, seconds: 7200, load: 150, elevationM: 800 });
    expect(percentChange(100, 150)).toBe(-33);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("monthlyBySport", () => {
  it("liefert 12 Monate je Sportart, sortiert nach Gesamtzeit", () => {
    const acts = [
      { sportName: "Mountainbike", durationS: 3600, trainingLoad: 0, startedAt: new Date("2026-10-10T08:00:00Z") },
      { sportName: "Mountainbike", durationS: 3600, trainingLoad: 0, startedAt: new Date("2026-03-10T08:00:00Z") },
      { sportName: "Jogging", durationS: 1800, trainingLoad: 0, startedAt: new Date("2026-10-10T08:00:00Z") },
      { sportName: "Jogging", durationS: 1800, trainingLoad: 0, startedAt: new Date("2025-09-10T08:00:00Z") }, // ausserhalb
    ];
    const { months, sports } = monthlyBySport(acts, now);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2025-11");
    expect(months[11]).toBe("2026-10");
    expect(sports.map((s) => s.sport)).toEqual(["Mountainbike", "Jogging"]);
    expect(sports[0].months[11]).toEqual({ key: "2026-10", seconds: 3600, sessions: 1 });
    expect(sports[1].totalSeconds).toBe(1800);
  });
});

describe("weightSeries / metricDeltas", () => {
  it("bildet eine Gewichtsreihe mit 7-Tage-Mittel", () => {
    const s = weightSeries(
      [
        { measuredOn: "2026-10-18", weightKg: 78 },
        { measuredOn: "2026-10-12", weightKg: 80 },
        { measuredOn: "2026-10-15", weightKg: 79 },
        { measuredOn: "2026-05-01", weightKg: 85 },
        { measuredOn: "2026-10-17", weightKg: null },
      ],
      now,
    );
    expect(s.map((p) => p.kg)).toEqual([80, 79, 78]);
    expect(s[2].mean7).toBe(79); // Mittel aus 80, 79, 78 innerhalb von 7 Tagen
  });

  it("berechnet die Veränderung je Kennzahl", () => {
    const d = metricDeltas([
      { metric: "ftp_w", value: "245", unit: "W", measuredOn: "2026-06-01" },
      { metric: "ftp_w", value: 255, unit: "W", measuredOn: "2026-10-01" },
      { metric: "squat_1rm_kg", value: 100, unit: "kg", measuredOn: "2026-04-20" },
    ]);
    expect(d.find((m) => m.metric === "ftp_w")).toMatchObject({ latest: 255, previous: 245, delta: 10 });
    expect(d.find((m) => m.metric === "squat_1rm_kg")).toMatchObject({ latest: 100, previous: null, delta: null });
  });
});
