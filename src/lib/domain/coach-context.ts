import type { Season } from "@/db/schema";
import { feasibleExercises, MUSCLE_LABELS, setupEffort, type EisenhornExercise } from "./eisenhorn-catalog";
import type { EquipmentSettingsJson } from "@/db/schema";
import { weeklyBuckets, weekStartKey, type ActivityLike } from "./progress";
import { setsByMuscle, type MuscleSet } from "./strength";

/**
 * Baut den Kontext für den KI-Coach aus bereits geladenen Zeilen (ADR 0004):
 * nur Aggregate, Präferenzen, manuelle Werte und Wetter. Keine DB, kein Netz.
 */
export type SportRow = {
  name: string;
  category: "endurance" | "strength" | "team" | "other";
  active: boolean;
  selfPlanned?: boolean;
  notes: string | null;
  preferences: { season: Season; weight: number; targetSessionsPerWeek: number | null; notes: string | null }[];
};

export type EquipmentRow = { name: string; kind: string; retired: boolean; settings: EquipmentSettingsJson | null };

export type ContextActivity = ActivityLike & { sportName: string | null };

export type PerformanceRow = { metric: string; value: number | string; unit: string; measuredOn: string };

export type BodyRow = { weightKg: number | string | null; restingHr: number | null };

export type ForecastDay = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationProbability: number;
  windMaxKmh: number;
};

export type HomeGymContext = {
  name: string;
  /** Muskelgruppen (Labels) nach Anzahl Sätze der letzten 14 Tage, wenigste zuerst. */
  recentSetsByMuscle: Record<string, number>;
  neglectedMuscles: string[];
  /** Kandidaten: machbare Übungen mit wenig Umbau, nach vernachlässigten Muskeln gewichtet. */
  exercises: { name: string; muscles: string[]; accessories: string[]; setup: "ohne" | "gering" | "umbau" }[];
};

export type CoachContextInput = {
  now: Date;
  today: string;
  season: Season;
  goals: string[];
  sports: SportRow[];
  equipment: EquipmentRow[];
  activities: ContextActivity[];
  body: BodyRow | null;
  performance: PerformanceRow[];
  forecast: ForecastDay[];
  constraints: string[];
  recentSets: MuscleSet[];
};

export type BuiltContext = {
  today: string;
  season: Season;
  goals: string[];
  sports: { name: string; category: SportRow["category"]; seasonWeight: number; targetSessionsPerWeek: number | null; selfPlanned: boolean; notes: string | null }[];
  equipment: { name: string; kind: string }[];
  recentWeeks: { weekStart: string; sessions: number; hours: number; load: number; bySport: Record<string, { sessions: number; hours: number }> }[];
  bodyMetrics: { weightKg: number | null; restingHr: number | null };
  performance: { metric: string; value: number; unit: string; measuredOn: string }[];
  forecast: ForecastDay[];
  constraints: string[];
  homeGym: HomeGymContext | null;
};

const SETUP_LABEL = { 0: "ohne", 1: "gering", 2: "umbau" } as const;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function num(v: number | string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Letzte `weeks` Kalenderwochen mit Anteil je Sportart. */
export function recentWeeksBySport(activities: ContextActivity[], now: Date, weeks = 4): BuiltContext["recentWeeks"] {
  const buckets = weeklyBuckets(activities, now, weeks);
  const perWeek = new Map<string, Record<string, { sessions: number; seconds: number }>>();
  for (const a of activities) {
    const key = weekStartKey(a.startedAt);
    const bySport = perWeek.get(key) ?? {};
    const name = a.sportName ?? "Ohne Sportart";
    const s = bySport[name] ?? { sessions: 0, seconds: 0 };
    s.sessions += 1;
    s.seconds += a.durationS;
    bySport[name] = s;
    perWeek.set(key, bySport);
  }
  return buckets.map((b) => ({
    weekStart: b.weekStart,
    sessions: b.sessions,
    hours: round1(b.seconds / 3600),
    load: Math.round(b.load),
    bySport: Object.fromEntries(
      Object.entries(perWeek.get(b.weekStart) ?? {}).map(([k, v]) => [k, { sessions: v.sessions, hours: round1(v.seconds / 3600) }]),
    ),
  }));
}

/** Eisenhorn-Kontext: welche Muskeln zuletzt dran waren und welche Übungen ohne grossen Umbau gehen (ADR 0006). */
export function homeGymContext(equipment: EquipmentRow[], recentSets: MuscleSet[], maxExercises = 24): HomeGymContext | null {
  const gym = equipment.find((e) => e.kind === "home_gym" && !e.retired);
  if (!gym) return null;
  const counts = setsByMuscle(recentSets);
  const muscles = Object.keys(MUSCLE_LABELS);
  const ranked = [...muscles].sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0));
  const neglected = ranked.filter((m) => (counts[m] ?? 0) === 0);
  const neglectedSet = new Set(neglected.length > 0 ? neglected : ranked.slice(0, 3));

  const score = (e: EisenhornExercise): number => {
    const hits = e.primaryMuscles.filter((m) => neglectedSet.has(m)).length;
    return hits * 10 - setupEffort(e) * 3;
  };
  const candidates = feasibleExercises(gym.settings)
    .filter((e) => setupEffort(e) < 2)
    .sort((a, b) => score(b) - score(a) || a.number - b.number)
    .slice(0, maxExercises);

  return {
    name: gym.name,
    recentSetsByMuscle: Object.fromEntries(ranked.map((m) => [MUSCLE_LABELS[m] ?? m, counts[m] ?? 0])),
    neglectedMuscles: [...neglectedSet].map((m) => MUSCLE_LABELS[m] ?? m),
    exercises: candidates.map((e) => ({
      name: e.name,
      muscles: e.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m),
      accessories: e.accessories,
      setup: SETUP_LABEL[setupEffort(e)],
    })),
  };
}

/** Neuester Wert je Kennzahl. */
export function latestPerformance(rows: PerformanceRow[]): BuiltContext["performance"] {
  const seen = new Map<string, BuiltContext["performance"][number]>();
  const sorted = [...rows].sort((a, b) => (a.measuredOn < b.measuredOn ? 1 : -1));
  for (const r of sorted) {
    const value = num(r.value);
    if (value === null || seen.has(r.metric)) continue;
    seen.set(r.metric, { metric: r.metric, value, unit: r.unit, measuredOn: r.measuredOn });
  }
  return [...seen.values()];
}

export function buildCoachContext(input: CoachContextInput): BuiltContext {
  const sports = input.sports
    .filter((s) => s.active)
    .map((s) => {
      const pref = s.preferences.find((p) => p.season === input.season);
      return {
        name: s.name,
        category: s.category,
        seasonWeight: pref?.weight ?? 0,
        targetSessionsPerWeek: pref?.targetSessionsPerWeek ?? null,
        selfPlanned: s.selfPlanned ?? false,
        notes: [s.notes, pref?.notes].filter((n): n is string => !!n && n.trim().length > 0).join("; ") || null,
      };
    });
  return {
    today: input.today,
    season: input.season,
    goals: input.goals,
    sports,
    equipment: input.equipment.filter((e) => !e.retired).map((e) => ({ name: e.name, kind: e.kind })),
    recentWeeks: recentWeeksBySport(input.activities, input.now),
    bodyMetrics: { weightKg: input.body ? num(input.body.weightKg) : null, restingHr: input.body?.restingHr ?? null },
    performance: latestPerformance(input.performance),
    forecast: input.forecast,
    constraints: input.constraints,
    homeGym: homeGymContext(input.equipment, input.recentSets),
  };
}

/** Standardziele, solange es keine Zielverwaltung gibt (aus docs/01-vision-und-ziele.md). */
export const DEFAULT_GOALS = ["Allgemeine Fitness", "Mountainbike-Ausdauer für Touren und Marathons", "Kraft und Schnellkraft (Sprints, Rampen)"];
