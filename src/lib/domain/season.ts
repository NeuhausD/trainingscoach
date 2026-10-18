import type { Season } from "@/db/schema";

/** Meteorologische Jahreszeiten, Monat 1-basiert. */
export function seasonForMonth(month: number): Season {
  if (month < 1 || month > 12) throw new RangeError(`Ungültiger Monat: ${month}`);
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function seasonForDate(date: Date, timeZone = "Europe/Zurich"): Season {
  const month = Number(
    new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone }).format(date),
  );
  return seasonForMonth(month);
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Frühling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
};
