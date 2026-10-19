import { Encoder, Profile, type Encodable, type FileIdMesg, type SessionMesg } from "@garmin/fitsdk";
import { describe, expect, it } from "vitest";
import { FitParseError, parseFit } from "./parse";

function sampleFit(): Uint8Array {
  const start = new Date("2026-10-18T07:30:00Z");
  const enc = new Encoder();
  const fileId: Encodable<FileIdMesg> = { mesgNum: Profile.MesgNum.FILE_ID, type: "activity", manufacturer: "garmin", product: 3943, serialNumber: 3442213551, timeCreated: start };
  enc.writeMesg(fileId);
  const session: Encodable<SessionMesg> = {
    mesgNum: Profile.MesgNum.SESSION,
    timestamp: new Date(start.getTime() + 7200_000),
    startTime: start,
    sport: "cycling",
    subSport: "mountain",
    totalElapsedTime: 7400,
    totalTimerTime: 7100,
    totalDistance: 32150.5,
    totalAscent: 812,
    avgHeartRate: 142,
    maxHeartRate: 171,
    avgPower: 165,
    totalTrainingEffect: 3.4,
    totalAnaerobicTrainingEffect: 1.2,
    trainingLoadPeak: 96.4,
    totalCalories: 1450,
  };
  enc.writeMesg(session);
  return enc.close();
}

describe("parseFit", () => {
  it("decodes a FIT activity into a summary", () => {
    const s = parseFit(sampleFit());
    expect(s.fileId.serialNumber).toBe(3442213551);
    expect(s.fileId.product).toBe("epixGen2");
    expect(s.session.sport).toBe("cycling");
    expect(s.session.subSport).toBe("mountain");
    expect(s.session.totalTimerTime).toBe(7100);
    expect(s.session.trainingLoadPeak).toBeCloseTo(96.4, 1);
    expect(s.vo2max).toBeNull();
  });

  it("rejects files that are not FIT", () => {
    expect(() => parseFit(new TextEncoder().encode("hello world, not a fit file"))).toThrow(FitParseError);
  });

  it("rejects a corrupted file", () => {
    const bytes = sampleFit();
    bytes[bytes.length - 20] ^= 0xff;
    expect(() => parseFit(bytes)).toThrow(/beschädigt/);
  });

  it("rejects a file without session", () => {
    const enc = new Encoder();
    const fileId: Encodable<FileIdMesg> = { mesgNum: Profile.MesgNum.FILE_ID, type: "activity", manufacturer: "garmin", product: 3943, serialNumber: 1, timeCreated: new Date() };
    enc.writeMesg(fileId);
    expect(() => parseFit(enc.close())).toThrow(/keine Aktivität/);
  });
});
