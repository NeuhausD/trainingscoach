/** Rating of Perceived Exertion (Session-RPE nach Foster), Skala 1..10. */
export const RPE_MIN = 1;
export const RPE_MAX = 10;

export const RPE_LABELS: Record<number, string> = {
  1: "sehr leicht",
  2: "leicht",
  3: "locker",
  4: "moderat",
  5: "mittel",
  6: "zügig",
  7: "hart",
  8: "sehr hart",
  9: "fast maximal",
  10: "maximal",
};

export const RPE_VALUES = Array.from({ length: RPE_MAX - RPE_MIN + 1 }, (_, i) => RPE_MIN + i);

/** Leer → null; sonst ganze Zahl 1..10, sonst RangeError. */
export function parseRpe(raw: string | null | undefined): number | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < RPE_MIN || n > RPE_MAX) {
    throw new RangeError(`RPE muss eine ganze Zahl zwischen ${RPE_MIN} und ${RPE_MAX} sein`);
  }
  return n;
}
