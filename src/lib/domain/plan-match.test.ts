import { describe, expect, it } from "vitest";
import { dayDiff, isValidDay, matchSuggestion, planVsActual, shiftDay, type OpenSuggestion } from "./plan-match";

const base: OpenSuggestion = { id: "a", sportId: "mtb", plannedOn: "2026-10-20", durationMin: 90, status: "accepted", completedActivityId: null };
const activity = { id: "act", sportId: "mtb", startedAt: new Date("2026-10-20T07:30:00Z"), durationS: 5400 };

describe("matchSuggestion", () => {
  it("matches same sport and day", () => {
    expect(matchSuggestion(activity, [base])?.id).toBe("a");
  });

  it("prefers the same day over a neighbouring day and the closest duration", () => {
    const yesterday = { ...base, id: "y", plannedOn: "2026-10-19" };
    const longer = { ...base, id: "l", durationMin: 240 };
    expect(matchSuggestion(activity, [yesterday, longer, base])?.id).toBe("a");
    expect(matchSuggestion(activity, [yesterday, longer])?.id).toBe("l");
  });

  it("ignores other sports, done, skipped and far days", () => {
    expect(matchSuggestion(activity, [{ ...base, sportId: "run" }])).toBeNull();
    expect(matchSuggestion(activity, [{ ...base, status: "done" }])).toBeNull();
    expect(matchSuggestion(activity, [{ ...base, status: "skipped" }])).toBeNull();
    expect(matchSuggestion(activity, [{ ...base, completedActivityId: "x" }])).toBeNull();
    expect(matchSuggestion(activity, [{ ...base, plannedOn: "2026-10-22" }])).toBeNull();
    expect(matchSuggestion({ ...activity, sportId: null }, [base])).toBeNull();
  });

  it("uses the Zurich day of the activity", () => {
    const lateEvening = { ...activity, startedAt: new Date("2026-10-19T22:30:00Z") }; // 00:30 am 20.10. in Zürich
    expect(matchSuggestion(lateEvening, [{ ...base, plannedOn: "2026-10-20" }])?.id).toBe("a");
  });
});

describe("planVsActual", () => {
  const suggestions = [
    { ...base, sportName: "Mountainbike" },
    { ...base, id: "b", plannedOn: "2026-10-22", durationMin: 60, status: "done" as const, sportId: "gym", sportName: "Kraft Studio" },
    { ...base, id: "c", plannedOn: "2026-10-23", status: "skipped" as const, sportName: "Jogging" },
    { ...base, id: "d", plannedOn: "2026-10-27", sportName: "Mountainbike" }, // nächste Woche
  ];
  const activities = [
    { sportName: "Kraft Studio", startedAt: new Date("2026-10-22T17:00:00Z"), durationS: 3300 },
    { sportName: "Wandern", startedAt: new Date("2026-10-25T09:00:00Z"), durationS: 7200 },
    { sportName: "Mountainbike", startedAt: new Date("2026-10-18T09:00:00Z"), durationS: 7200 }, // Vorwoche
  ];

  it("sums the calendar week only", () => {
    const r = planVsActual("2026-10-19", suggestions, activities);
    expect(r.weekEnd).toBe("2026-10-25");
    expect(r.planned).toEqual({ sessions: 2, minutes: 150 });
    expect(r.done).toEqual({ sessions: 1, minutes: 60 });
    expect(r.actual).toEqual({ sessions: 2, minutes: 175 });
    expect(r.bySport).toEqual([
      { sport: "Wandern", plannedMin: 0, actualMin: 120, plannedSessions: 0, actualSessions: 1 },
      { sport: "Mountainbike", plannedMin: 90, actualMin: 0, plannedSessions: 1, actualSessions: 0 },
      { sport: "Kraft Studio", plannedMin: 60, actualMin: 55, plannedSessions: 1, actualSessions: 1 },
    ]);
  });
});

describe("day helpers", () => {
  it("shifts and compares days", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(dayDiff("2026-10-21", "2026-10-19")).toBe(2);
    expect(isValidDay("2026-10-19")).toBe(true);
    expect(isValidDay("2026-13-01")).toBe(false);
    expect(isValidDay("heute")).toBe(false);
    expect(isValidDay(null)).toBe(false);
  });
});
