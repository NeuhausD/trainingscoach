import { APP_TIME_ZONE } from "./time";

/** Minimale Sicht auf eine Aktivität für Aggregationen (keine Rohdaten nötig). */
export type ActivityLike = {
  sportName: string | null;
  durationS: number;
  trainingLoad: number | string | null;
  startedAt: Date;
};

export type SportSummary = { sport: string; sessions: number; seconds: number; load: number };

function loadOf(a: ActivityLike): number {
  const n = Number(a.trainingLoad ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Einheiten, Zeit und Belastung je Sportart, nach Zeit absteigend. Ohne Sportart → «Ohne Sportart». */
export function summarizeBySport(activities: ActivityLike[]): SportSummary[] {
  const map = new Map<string, SportSummary>();
  for (const a of activities) {
    const sport = a.sportName ?? "Ohne Sportart";
    const s = map.get(sport) ?? { sport, sessions: 0, seconds: 0, load: 0 };
    s.sessions += 1;
    s.seconds += a.durationS;
    s.load += loadOf(a);
    map.set(sport, s);
  }
  return [...map.values()]
    .map((s) => ({ ...s, load: Math.round(s.load) }))
    .sort((a, b) => b.seconds - a.seconds || a.sport.localeCompare(b.sport, "de-CH"));
}

export function totals(activities: ActivityLike[]): { sessions: number; seconds: number; load: number } {
  return {
    sessions: activities.length,
    seconds: activities.reduce((sum, a) => sum + a.durationS, 0),
    load: Math.round(activities.reduce((sum, a) => sum + loadOf(a), 0)),
  };
}

/** Aktivitäten der letzten `days` Tage (Start ab Mitternacht Zürich vor `days` Tagen). */
export function sinceDays(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 86400000);
}

export function monthKey(date: Date, timeZone = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("de-CH", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
}

export type MonthGroup<T extends ActivityLike> = { key: string; label: string; activities: T[]; bySport: SportSummary[]; totals: ReturnType<typeof totals> };

/** Nach Monat (Zürich) gruppieren, neuester Monat zuerst; Reihenfolge innerhalb des Monats bleibt. */
export function groupByMonth<T extends ActivityLike>(activities: T[]): MonthGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const a of activities) {
    const key = monthKey(a.startedAt);
    map.set(key, [...(map.get(key) ?? []), a]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => ({ key, label: monthLabel(key), activities: list, bySport: summarizeBySport(list), totals: totals(list) }));
}

/** "12 h 30" bzw. "45 min", für Summen. */
export function formatHours(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
