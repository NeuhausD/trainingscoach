import { describe, expect, it } from "vitest";
import {
  describeTrainingEffect,
  fillGaps,
  fitExternalId,
  fitSportType,
  mapFitActivity,
  matchExistingActivity,
  summarizeFit,
  vo2maxFromMaxMet,
  type FitSummary,
} from "./fit-mapping";

const start = new Date("2026-10-18T07:30:00Z");

const decoded = {
  fileIdMesgs: [{ type: "activity", manufacturer: "garmin", product: 3943, serialNumber: 3442213551, timeCreated: start, garminProduct: "epixGen2" }],
  sessionMesgs: [
    {
      startTime: start,
      sport: "cycling",
      subSport: "mountain",
      totalElapsedTime: 7400,
      totalTimerTime: 7100.4,
      totalDistance: 32150.5,
      totalAscent: 812,
      avgHeartRate: 142,
      maxHeartRate: 171,
      avgPower: 165,
      normalizedPower: 190,
      trainingStressScore: 88.5,
      totalTrainingEffect: 3.4,
      totalAnaerobicTrainingEffect: 1.2,
      trainingLoadPeak: 96.39999,
      totalCalories: 1450,
    },
  ],
  "140": [{ 7: 913203, 2: 5 }],
};

const sports = [
  { id: "mtb", name: "Mountainbike", stravaTypes: ["MountainBikeRide", "Ride"] },
  { id: "run", name: "Jogging", stravaTypes: ["Run", "TrailRun"] },
  { id: "hike", name: "Wandern", stravaTypes: ["Hike", "Walk"] },
  { id: "other", name: "Sonstiges", stravaTypes: [] },
];
const ctx = { sports, fallbackSportName: "Sonstiges", ftpW: 200, restingHr: 55 };

describe("summarizeFit", () => {
  it("reads file id, session and VO2max", () => {
    const s = summarizeFit(decoded);
    expect(s).not.toBeNull();
    expect(s!.fileId.serialNumber).toBe(3442213551);
    expect(s!.fileId.product).toBe("epixGen2");
    expect(s!.session.sport).toBe("cycling");
    expect(s!.session.totalTimerTime).toBeCloseTo(7100.4);
    expect(s!.vo2max).toBe(48.8);
  });

  it("returns null without a session", () => {
    expect(summarizeFit({ fileIdMesgs: decoded.fileIdMesgs })).toBeNull();
    expect(summarizeFit({ sessionMesgs: [{ sport: "cycling" }] })).toBeNull();
  });

  it("accepts ISO strings for dates", () => {
    const s = summarizeFit({ sessionMesgs: [{ startTime: "2026-10-18T07:30:00.000Z" }] });
    expect(s!.session.startTime.toISOString()).toBe("2026-10-18T07:30:00.000Z");
    expect(s!.vo2max).toBeNull();
  });
});

describe("vo2maxFromMaxMet", () => {
  it("converts MaxMET to ml/kg/min and rejects implausible values", () => {
    expect(vo2maxFromMaxMet(913203)).toBe(48.8);
    expect(vo2maxFromMaxMet(0)).toBeNull();
    expect(vo2maxFromMaxMet(10)).toBeNull();
    expect(vo2maxFromMaxMet(null)).toBeNull();
  });
});

describe("fitExternalId", () => {
  it("uses serial number and creation time", () => {
    const s = summarizeFit(decoded)!;
    expect(fitExternalId(s)).toBe(`fit:3442213551:${Math.floor(start.getTime() / 1000)}`);
  });

  it("falls back to session start", () => {
    const s = summarizeFit({ sessionMesgs: [{ startTime: start }] })!;
    expect(fitExternalId(s)).toBe(`fit:0:${Math.floor(start.getTime() / 1000)}`);
  });
});

describe("fitSportType", () => {
  it("maps Garmin sport and sub sport to Strava types", () => {
    expect(fitSportType("cycling", "mountain")).toBe("MountainBikeRide");
    expect(fitSportType("cycling", "road")).toBe("Ride");
    expect(fitSportType("cycling", "e_bike_mountain")).toBe("EBikeRide");
    expect(fitSportType("running", "trail")).toBe("TrailRun");
    expect(fitSportType("running", null)).toBe("Run");
    expect(fitSportType("hiking", "generic")).toBe("Hike");
    expect(fitSportType("alpine_skiing", null)).toBe("AlpineSki");
    expect(fitSportType("ice_skating", null)).toBe("IceSkate");
    expect(fitSportType("training", "strength_training")).toBe("WeightTraining");
    expect(fitSportType("training", "cardio_training")).toBe("Workout");
    expect(fitSportType("generic", null)).toBeNull();
    expect(fitSportType(null, null)).toBeNull();
  });
});

describe("mapFitActivity", () => {
  it("maps measurements, sport and extras", () => {
    const m = mapFitActivity(summarizeFit(decoded)!, ctx);
    expect(m.sportId).toBe("mtb");
    expect(m.startedAt).toEqual(start);
    expect(m.durationS).toBe(7100);
    expect(m.distanceM).toBe(32151);
    expect(m.elevationGainM).toBe(812);
    expect(m.avgHr).toBe(142);
    expect(m.maxHr).toBe(171);
    expect(m.avgPowerW).toBe(165);
    // Leistung mit FTP 200: (165/200)^2 * 7100/3600 * 100
    expect(m.trainingLoad).toBeCloseTo(134.2, 0);
    expect(m.extras).toEqual({ aerobicTe: 3.4, anaerobicTe: 1.2, garminLoad: 96, caloriesKcal: 1450 });
    expect(m.rawSummary.fit.product).toBe("epixGen2");
    expect(m.rawSummary.fit.sport).toBe("cycling");
  });

  it("falls back to the catch-all sport and elapsed time", () => {
    const s: FitSummary = {
      fileId: { serialNumber: null, timeCreated: null, product: null },
      session: {
        startTime: start,
        sport: "generic",
        subSport: null,
        totalTimerTime: null,
        totalElapsedTime: 1800,
        totalDistance: null,
        totalAscent: null,
        avgHeartRate: null,
        maxHeartRate: null,
        avgPower: null,
        normalizedPower: null,
        trainingStressScore: null,
        totalTrainingEffect: null,
        totalAnaerobicTrainingEffect: null,
        trainingLoadPeak: null,
        totalCalories: null,
      },
      vo2max: null,
    };
    const m = mapFitActivity(s, ctx);
    expect(m.sportId).toBe("other");
    expect(m.durationS).toBe(1800);
    expect(m.trainingLoad).toBe(0);
    expect(m.extras).toEqual({ aerobicTe: null, anaerobicTe: null, garminLoad: null, caloriesKcal: null });
  });
});

describe("matchExistingActivity", () => {
  const fit = { startedAt: start, durationS: 7100 };
  it("finds the Strava activity with the same start and similar duration", () => {
    const strava = { id: "a", startedAt: new Date(start.getTime() + 20_000), durationS: 7000 };
    expect(matchExistingActivity(fit, [strava])).toBe(strava);
  });

  it("rejects starts outside the tolerance or very different durations", () => {
    expect(matchExistingActivity(fit, [{ id: "a", startedAt: new Date(start.getTime() + 600_000), durationS: 7100 }])).toBeNull();
    expect(matchExistingActivity(fit, [{ id: "a", startedAt: start, durationS: 2000 }])).toBeNull();
  });

  it("allows ten minutes of duration difference for short sessions", () => {
    expect(matchExistingActivity({ startedAt: start, durationS: 900 }, [{ id: "a", startedAt: start, durationS: 1400 }])?.id).toBe("a");
  });

  it("prefers the closest start", () => {
    const near = { id: "near", startedAt: new Date(start.getTime() + 5_000), durationS: 7100 };
    const far = { id: "far", startedAt: new Date(start.getTime() - 100_000), durationS: 7100 };
    expect(matchExistingActivity(fit, [far, near])?.id).toBe("near");
  });
});

describe("fillGaps", () => {
  it("fills only missing values", () => {
    const m = mapFitActivity(summarizeFit(decoded)!, ctx);
    const patch = fillGaps({ maxHr: null, avgHr: 140, avgPowerW: null, elevationGainM: 800, distanceM: null }, m);
    expect(patch).toEqual({ maxHr: 171, avgPowerW: 165, distanceM: 32151 });
  });
});

describe("describeTrainingEffect", () => {
  it("labels the Garmin scale", () => {
    expect(describeTrainingEffect(null)).toBeNull();
    expect(describeTrainingEffect(0.5)).toBe("kein Effekt");
    expect(describeTrainingEffect(1.2)).toBe("gering");
    expect(describeTrainingEffect(2.5)).toBe("erhaltend");
    expect(describeTrainingEffect(3.4)).toBe("verbessernd");
    expect(describeTrainingEffect(4.2)).toBe("stark verbessernd");
    expect(describeTrainingEffect(5)).toBe("überbeansprucht");
  });
});
