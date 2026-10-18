import { SEASONS, type Season } from "@/db/schema";

/** Gewichtung einer Sportart pro Saison: 0 = nie, 10 = Schwerpunkt. */
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 10;
export const WEIGHT_DEFAULT = 5;

export type SeasonPreference = {
  season: Season;
  weight: number;
  targetSessionsPerWeek: number | null;
  notes: string | null;
};

export function isValidWeight(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= WEIGHT_MIN && value <= WEIGHT_MAX;
}

/**
 * Formulareingabe (String) in eine Gewichtung umwandeln. Leer → Standard.
 * Wirft bei Werten ausserhalb 0..10 oder nicht-ganzzahligen Eingaben.
 */
export function parseWeight(raw: string | null | undefined, fallback = WEIGHT_DEFAULT): number {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return fallback;
  const n = Number(trimmed);
  if (!isValidWeight(n)) {
    throw new RangeError(`Gewichtung muss eine ganze Zahl zwischen ${WEIGHT_MIN} und ${WEIGHT_MAX} sein`);
  }
  return n;
}

/** Ziel-Einheiten pro Woche: leer → null, sonst ganze Zahl 0..14. */
export function parseTargetSessions(raw: string | null | undefined): number | null {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0 || n > 14) {
    throw new RangeError("Ziel-Einheiten pro Woche müssen eine ganze Zahl zwischen 0 und 14 sein");
  }
  return n;
}

/**
 * Vervollständigt eine (evtl. lückenhafte) Liste von Saison-Präferenzen zu
 * genau vier Einträgen in fester Saison-Reihenfolge. Fehlende Saisons
 * bekommen die Standard-Gewichtung, doppelte Saisons: letzter Eintrag gewinnt.
 */
export function completeSeasonPreferences(
  partial: Iterable<Partial<SeasonPreference> & { season: Season }>,
): SeasonPreference[] {
  const bySeason = new Map<Season, SeasonPreference>();
  for (const p of partial) {
    bySeason.set(p.season, {
      season: p.season,
      weight: p.weight ?? WEIGHT_DEFAULT,
      targetSessionsPerWeek: p.targetSessionsPerWeek ?? null,
      notes: p.notes ?? null,
    });
  }
  return SEASONS.map(
    (season) =>
      bySeason.get(season) ?? { season, weight: WEIGHT_DEFAULT, targetSessionsPerWeek: null, notes: null },
  );
}

/** Kurzbeschreibung einer Gewichtung für die UI. */
export function weightLabel(weight: number): string {
  if (weight <= 0) return "nie";
  if (weight <= 3) return "selten";
  if (weight <= 6) return "regelmässig";
  if (weight <= 8) return "oft";
  return "Schwerpunkt";
}

/** Sportarten nach Gewichtung in der gegebenen Saison sortieren (höchste zuerst, dann Name). */
export function sortByWeightForSeason<T extends { name: string; preferences: SeasonPreference[] }>(
  sports: T[],
  season: Season,
): T[] {
  const weightOf = (s: T) => s.preferences.find((p) => p.season === season)?.weight ?? WEIGHT_DEFAULT;
  return [...sports].sort((a, b) => weightOf(b) - weightOf(a) || a.name.localeCompare(b.name, "de-CH"));
}
