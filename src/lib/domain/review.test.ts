import { describe, expect, it } from "vitest";
import { reviewWindow, type ReviewSport } from "./review";

const sports: ReviewSport[] = [
  { name: "Mountainbike", active: true, weight: 6, targetSessionsPerWeek: 2 },
  { name: "Kraft Studio", active: true, weight: 7, targetSessionsPerWeek: 2 },
  { name: "Jogging", active: true, weight: 5, targetSessionsPerWeek: 1 },
  { name: "Eishockey", active: true, selfPlanned: true, weight: 5, targetSessionsPerWeek: 1 },
  { name: "Wandern", active: true, weight: 1, targetSessionsPerWeek: null },
  { name: "Ski", active: false, weight: 8, targetSessionsPerWeek: 2 },
];

const ride = (min: number, load: number) => ({ sportName: "Mountainbike", durationS: min * 60, trainingLoad: load });

describe("reviewWindow", () => {
  it("judges sessions against the season target and flags focus sports without sessions", () => {
    const current = [ride(120, 150), ride(90, 100), ride(100, 110), ride(80, 90), ride(60, 60), { sportName: "Wandern", durationS: 7200, trainingLoad: 50 }];
    const r = reviewWindow(current, [], sports);
    const mtb = r.sports.find((s) => s.sport === "Mountainbike")!;
    expect(mtb).toMatchObject({ sessions: 5, targetSessions: 8, verdict: "zu wenig", hint: "5 × von 8" });
    expect(r.sports.find((s) => s.sport === "Kraft Studio")).toMatchObject({ sessions: 0, verdict: "zu wenig", hint: "0 × von 8" });
    expect(r.sports.find((s) => s.sport === "Wandern")).toMatchObject({ verdict: "offen", hint: null });
    expect(r.sports.find((s) => s.sport === "Ski")).toBeUndefined();
    expect(r.sports[0].sport).toBe("Mountainbike"); // nach Zeit sortiert
    expect(r.overall).toBe("zu wenig");
    expect(r.headline).toBe("Unter Ziel");
    expect(r.text).toContain("Zu wenig: Mountainbike, Kraft Studio, Jogging");
  });

  it("is good when targets are met and nothing got shorter or easier", () => {
    const current = [...Array(8)].map(() => ride(90, 100)).concat([...Array(7)].map(() => ({ sportName: "Kraft Studio", durationS: 3600, trainingLoad: 60 })), [...Array(4)].map(() => ({ sportName: "Jogging", durationS: 2400, trainingLoad: 50 })), [{ sportName: "Eishockey", durationS: 3600, trainingLoad: 70 }]);
    const r = reviewWindow(current, current, sports);
    expect(r.overall).toBe("gut");
    expect(r.text).toBe("Einheiten, Dauer und Intensität passen zum Saisonziel.");
    expect(r.sports.find((s) => s.sport === "Mountainbike")?.verdict).toBe("gut");
  });

  it("notes shorter and less intense sessions compared with the previous window", () => {
    const current = [...Array(8)].map(() => ride(50, 30));
    const previous = [...Array(8)].map(() => ride(90, 110));
    const r = reviewWindow(current, previous, [sports[0]]);
    const mtb = r.sports[0];
    expect(mtb.verdict).toBe("gut");
    expect(mtb.notes).toEqual(["kürzer als zuvor (Ø 50 statt 90 min)", "weniger intensiv als zuvor"]);
    expect(r.overall).toBe("mittel");
    expect(r.text).toContain("Mountainbike kürzer als zuvor");
  });

  it("does not count self-planned sports as too few and marks more than planned", () => {
    const current = [...Array(14)].map(() => ride(60, 50));
    const r = reviewWindow(current, [], [sports[0], sports[3]]);
    expect(r.sports.find((s) => s.sport === "Mountainbike")?.verdict).toBe("mehr als geplant");
    expect(r.sports.find((s) => s.sport === "Eishockey")?.verdict).toBe("zu wenig");
    expect(r.overall).toBe("gut");
  });

  it("is open without any targets", () => {
    const r = reviewWindow([ride(60, 50)], [], [{ name: "Mountainbike", active: true, weight: 5, targetSessionsPerWeek: null }]);
    expect(r.overall).toBe("offen");
    expect(r.text).toContain("Einheiten pro Woche");
  });
});
