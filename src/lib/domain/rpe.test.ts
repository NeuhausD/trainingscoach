import { describe, expect, it } from "vitest";
import { RPE_LABELS, RPE_VALUES, parseRpe } from "./rpe";

describe("RPE", () => {
  it("hat zehn Stufen mit Wortlabel", () => {
    expect(RPE_VALUES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const v of RPE_VALUES) expect(RPE_LABELS[v]).toBeTruthy();
  });

  it("parst Formulareingaben", () => {
    expect(parseRpe("7")).toBe(7);
    expect(parseRpe("")).toBeNull();
    expect(() => parseRpe("11")).toThrow(RangeError);
    expect(() => parseRpe("2.5")).toThrow(RangeError);
  });
});
