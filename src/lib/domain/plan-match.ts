import { utcToLocalParts } from "./time";

/**
 * Zuordnung von Aktivitäten zu Vorschlägen des Wochenplans und Wochenbilanz
 * Plan gegen Ist. Reine Fachlogik ohne DB (docs/03-datenmodell.md).
 */
export type OpenSuggestion = {
  id: string;
  sportId: string | null;
  plannedOn: string; // YYYY-MM-DD
  durationMin: number;
  status: "suggested" | "accepted" | "done" | "skipped";
  completedActivityId: string | null;
};

export type ActivityForMatch = { id: string; sportId: string | null; startedAt: Date; durationS: number };

/** Erlaubte Abweichung des Tages: am Vortag oder Folgetag zählt noch. */
export const MATCH_DAY_TOLERANCE = 1;

export function dayDiff(a: string, b: string): number {
  const ms = new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Passender offener Vorschlag zu einer Aktivität: gleiche Sportart, Tag
 * innerhalb der Toleranz, nicht erledigt oder übersprungen. Bei mehreren
 * gewinnt der gleiche Tag, dann die nächste Dauer.
 */
export function matchSuggestion(activity: ActivityForMatch, suggestions: OpenSuggestion[]): OpenSuggestion | null {
  if (!activity.sportId) return null;
  const day = utcToLocalParts(activity.startedAt).date;
  const minutes = activity.durationS / 60;
  let best: { s: OpenSuggestion; score: number } | null = null;
  for (const s of suggestions) {
    if (s.status === "done" || s.status === "skipped" || s.completedActivityId) continue;
    if (s.sportId !== activity.sportId) continue;
    const diff = Math.abs(dayDiff(s.plannedOn, day));
    if (diff > MATCH_DAY_TOLERANCE) continue;
    const durationGap = Math.abs(s.durationMin - minutes) / Math.max(s.durationMin, 1);
    const score = diff * 10 + Math.min(durationGap, 5) + (s.status === "accepted" ? 0 : 0.5);
    if (!best || score < best.score) best = { s, score };
  }
  return best?.s ?? null;
}

export type PlanVsActual = {
  weekStart: string;
  weekEnd: string;
  planned: { sessions: number; minutes: number };
  done: { sessions: number; minutes: number };
  actual: { sessions: number; minutes: number };
  bySport: { sport: string; plannedMin: number; actualMin: number; plannedSessions: number; actualSessions: number }[];
};

export type SuggestionForWeek = OpenSuggestion & { sportName: string | null };
export type ActivityForWeek = { sportName: string | null; startedAt: Date; durationS: number };

/** Kalenderwoche `weekStart` (Montag, YYYY-MM-DD) bis Sonntag: geplant, erledigt, tatsächlich trainiert. */
export function planVsActual(weekStart: string, suggestions: SuggestionForWeek[], activities: ActivityForWeek[]): PlanVsActual {
  const end = new Date(`${weekStart}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const weekEnd = end.toISOString().slice(0, 10);
  const inWeek = (day: string) => day >= weekStart && day <= weekEnd;

  const planned = suggestions.filter((s) => inWeek(s.plannedOn) && s.status !== "skipped");
  const done = planned.filter((s) => s.status === "done");
  const actual = activities.filter((a) => inWeek(utcToLocalParts(a.startedAt).date));

  const sports = new Map<string, PlanVsActual["bySport"][number]>();
  const row = (name: string) => {
    const r = sports.get(name) ?? { sport: name, plannedMin: 0, actualMin: 0, plannedSessions: 0, actualSessions: 0 };
    sports.set(name, r);
    return r;
  };
  for (const s of planned) {
    const r = row(s.sportName ?? "Sportart offen");
    r.plannedMin += s.durationMin;
    r.plannedSessions += 1;
  }
  for (const a of actual) {
    const r = row(a.sportName ?? "Ohne Sportart");
    r.actualMin += Math.round(a.durationS / 60);
    r.actualSessions += 1;
  }
  const bySport = [...sports.values()].sort((a, b) => Math.max(b.plannedMin, b.actualMin) - Math.max(a.plannedMin, a.actualMin));

  return {
    weekStart,
    weekEnd,
    planned: { sessions: planned.length, minutes: planned.reduce((n, s) => n + s.durationMin, 0) },
    done: { sessions: done.length, minutes: done.reduce((n, s) => n + s.durationMin, 0) },
    actual: { sessions: actual.length, minutes: actual.reduce((n, a) => n + Math.round(a.durationS / 60), 0) },
    bySport,
  };
}

/** Datum um `days` Tage verschieben (YYYY-MM-DD). */
export function shiftDay(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDay(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}
