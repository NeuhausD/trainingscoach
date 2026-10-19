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

// --- Wochen, Fenster, Jahresübersicht ---------------------------------------

/** Datum (YYYY-MM-DD) des Montags der Zürcher Woche, in der `date` liegt. */
export function weekStartKey(date: Date, timeZone = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const local = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  const dow = (local.getUTCDay() + 6) % 7; // Montag = 0
  local.setUTCDate(local.getUTCDate() - dow);
  return local.toISOString().slice(0, 10);
}

export type WeekBucket = { weekStart: string; sessions: number; seconds: number; load: number };

/** Die letzten `weeks` Kalenderwochen (älteste zuerst), leere Wochen mit 0. */
export function weeklyBuckets(activities: ActivityLike[], now: Date, weeks: number): WeekBucket[] {
  const currentStart = weekStartKey(now);
  const keys: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${currentStart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    keys.push(d.toISOString().slice(0, 10));
  }
  const map = new Map(keys.map((k) => [k, { weekStart: k, sessions: 0, seconds: 0, load: 0 }]));
  for (const a of activities) {
    const b = map.get(weekStartKey(a.startedAt));
    if (!b) continue;
    b.sessions += 1;
    b.seconds += a.durationS;
    b.load += loadOf(a);
  }
  return keys.map((k) => ({ ...map.get(k)!, load: Math.round(map.get(k)!.load) }));
}

export type WindowComparison = {
  current: { sessions: number; seconds: number; load: number; elevationM: number };
  previous: { sessions: number; seconds: number; load: number; elevationM: number };
};

type WithElevation = ActivityLike & { elevationGainM?: number | string | null };

function windowTotals(list: WithElevation[]) {
  const t = totals(list);
  const elevationM = Math.round(list.reduce((sum, a) => sum + (Number(a.elevationGainM ?? 0) || 0), 0));
  return { ...t, elevationM };
}

/** Letzte `days` Tage gegenüber den `days` Tagen davor. */
export function compareWindows(activities: WithElevation[], now: Date, days = 28): WindowComparison {
  const start = sinceDays(now, days).getTime();
  const prevStart = sinceDays(now, 2 * days).getTime();
  const current = activities.filter((a) => a.startedAt.getTime() >= start && a.startedAt.getTime() <= now.getTime());
  const previous = activities.filter((a) => a.startedAt.getTime() >= prevStart && a.startedAt.getTime() < start);
  return { current: windowTotals(current), previous: windowTotals(previous) };
}

/** Prozentuale Veränderung, null wenn vorher 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type SportByMonth = { sport: string; totalSeconds: number; months: { key: string; seconds: number; sessions: number }[] };

/** Die letzten `monthsBack` Monate (älteste zuerst) je Sportart, Sportarten nach Gesamtzeit sortiert, höchstens `maxSports`. */
export function monthlyBySport(activities: ActivityLike[], now: Date, monthsBack = 12, maxSports = 6): { months: string[]; sports: SportByMonth[] } {
  const current = monthKey(now);
  const [cy, cm] = current.split("-").map(Number);
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(cy, cm - 1 - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const bySport = new Map<string, Map<string, { seconds: number; sessions: number }>>();
  for (const a of activities) {
    const key = monthKey(a.startedAt);
    if (!months.includes(key)) continue;
    const sport = a.sportName ?? "Ohne Sportart";
    const row = bySport.get(sport) ?? new Map();
    const cell = row.get(key) ?? { seconds: 0, sessions: 0 };
    cell.seconds += a.durationS;
    cell.sessions += 1;
    row.set(key, cell);
    bySport.set(sport, row);
  }
  const sports = [...bySport.entries()]
    .map(([sport, row]) => ({
      sport,
      totalSeconds: [...row.values()].reduce((s, c) => s + c.seconds, 0),
      months: months.map((key) => ({ key, ...(row.get(key) ?? { seconds: 0, sessions: 0 }) })),
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, maxSports);
  return { months, sports };
}

/** Gewichtsmessungen der letzten `days` Tage, chronologisch, plus 7-Tage-Mittel je Punkt. */
export function weightSeries(rows: { measuredOn: string; weightKg: number | null }[], now: Date, days = 90): { date: string; kg: number; mean7: number }[] {
  const since = sinceDays(now, days).toISOString().slice(0, 10);
  const points = rows
    .filter((r) => r.weightKg !== null && r.measuredOn >= since)
    .map((r) => ({ date: r.measuredOn, kg: r.weightKg as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return points.map((p, i) => {
    const windowStart = new Date(`${p.date}T00:00:00Z`).getTime() - 6 * 86400000;
    const inWindow = points.slice(0, i + 1).filter((q) => new Date(`${q.date}T00:00:00Z`).getTime() >= windowStart);
    const mean7 = Math.round((inWindow.reduce((s, q) => s + q.kg, 0) / inWindow.length) * 10) / 10;
    return { ...p, mean7 };
  });
}

export type MetricDelta = { metric: string; latest: number; unit: string; measuredOn: string; previous: number | null; delta: number | null };

/** Neuester Wert je Kennzahl mit Differenz zur vorherigen Messung. */
export function metricDeltas(rows: { metric: string; value: number | string; unit: string; measuredOn: string }[]): MetricDelta[] {
  const byMetric = new Map<string, typeof rows>();
  for (const r of rows) byMetric.set(r.metric, [...(byMetric.get(r.metric) ?? []), r]);
  return [...byMetric.entries()].map(([metric, list]) => {
    const sorted = [...list].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));
    const latest = Number(sorted[0].value);
    const previous = sorted[1] ? Number(sorted[1].value) : null;
    return {
      metric,
      latest,
      unit: sorted[0].unit,
      measuredOn: sorted[0].measuredOn,
      previous,
      delta: previous === null ? null : Math.round((latest - previous) * 10) / 10,
    };
  });
}
