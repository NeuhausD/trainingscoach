import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { coachContextSchema } from "./context";

const fixtures = ["summer-good-weather", "winter-snow"];

describe("coachContextSchema", () => {
  for (const name of fixtures) {
    it(`akzeptiert Fixture ${name}`, () => {
      const raw = readFileSync(path.join(__dirname, "__fixtures__", `${name}.json`), "utf8");
      expect(() => coachContextSchema.parse(JSON.parse(raw))).not.toThrow();
    });
  }

  it("lehnt Strava-Rohfelder ab (ADR 0004)", () => {
    const raw = JSON.parse(readFileSync(path.join(__dirname, "__fixtures__", "summer-good-weather.json"), "utf8"));
    raw.activities = [{ name: "Morning Ride", map: { polyline: "..." } }];
    expect(() => coachContextSchema.strict().parse(raw)).toThrow();
  });
});
