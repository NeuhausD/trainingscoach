import { db, schema } from "@/db";
import { buildCoachContext, DEFAULT_GOALS } from "@/lib/domain/coach-context";
import { sinceDays } from "@/lib/domain/progress";
import { seasonForDate } from "@/lib/domain/season";
import { utcToLocalParts } from "@/lib/domain/time";
import { listActivities, recentSetsWithMuscles } from "@/lib/master-data/activities";
import { listEquipment } from "@/lib/master-data/equipment";
import { listBodyMetrics, listPerformanceMetrics } from "@/lib/master-data/metrics";
import { listSports } from "@/lib/master-data/sports";
import { latestPlanReview, listSuggestionsBetween, replacePlan, savePlanReview, type NewSuggestion } from "@/lib/master-data/suggestions";
import { weekStartKey } from "@/lib/domain/progress";
import { shiftDay } from "@/lib/domain/plan-match";
import { INTENSITY_LABELS } from "@/lib/domain/intensity";
import { generatePlanReview, type PlanReview, type PlannedSessionForReview } from "./review";
import { fetchForecast } from "@/lib/weather/open-meteo";
import { generateWeekPlan, type WeekPlan } from "./coach";
import { coachContextSchema, type CoachContext } from "./context";
import { eq } from "drizzle-orm";

/** Kontext für den Coach aus der DB zusammenstellen (nur Aggregate, ADR 0004). */
export async function buildContextForUser(userId: string, now: Date, constraints: string[]): Promise<{ context: CoachContext; forecastError: string | null }> {
  const today = utcToLocalParts(now).date;
  const [sports, equipment, activities, body, performance, recentSets, user, planned] = await Promise.all([
    listSports(userId),
    listEquipment(userId),
    listActivities(userId, { since: sinceDays(now, 28) }),
    listBodyMetrics(userId, 1),
    listPerformanceMetrics(userId, 100),
    recentSetsWithMuscles(userId, sinceDays(now, 14)),
    db().select({ lat: schema.users.homeLat, lon: schema.users.homeLon }).from(schema.users).where(eq(schema.users.id, userId)).limit(1),
    listSuggestionsBetween(userId, today, shiftDay(today, 7)),
  ]);
  const plannedByAthlete = planned
    .filter((s) => s.source === "athlete" && s.status !== "skipped")
    .map((s) => ({ plannedOn: s.plannedOn, sport: s.sportName ?? "Sportart offen", title: s.title, durationMin: s.durationMin, intensity: s.intensity }));
  const lat = Number(user[0]?.lat ?? process.env.HOME_LAT ?? 46.743);
  const lon = Number(user[0]?.lon ?? process.env.HOME_LON ?? 7.288);
  let forecastError: string | null = null;
  const forecast = await fetchForecast(lat, lon).catch((e: unknown) => {
    forecastError = e instanceof Error ? e.message : String(e);
    console.error("Open-Meteo forecast failed", e);
    return [];
  });

  const built = buildCoachContext({
    now,
    today,
    season: seasonForDate(now),
    goals: DEFAULT_GOALS,
    sports: sports.map((s) => ({ name: s.name, category: s.category, active: s.active, selfPlanned: s.selfPlanned, notes: null, preferences: s.preferences })),
    equipment: equipment.map((e) => ({ name: e.name, kind: e.kind, retired: e.retired, settings: e.settings ?? null })),
    activities,
    body: body[0] ? { weightKg: body[0].weightKg, restingHr: body[0].restingHr } : null,
    performance: performance.map((p) => ({ metric: p.metric, value: p.value, unit: p.unit, measuredOn: p.measuredOn })),
    forecast,
    constraints,
    recentSets,
  });
  return { context: coachContextSchema.parse({ ...built, plannedByAthlete }), forecastError };
}

export type ReviewResult = { review: PlanReview; modelId: string; forecastError: string | null };

/** Geplante Woche (ab Montag, eigene und Coach-Einheiten) vom Modell prüfen lassen und speichern. */
export async function createPlanReview(userId: string, now: Date, constraints: string[]): Promise<ReviewResult> {
  const weekStart = weekStartKey(now);
  const { context, forecastError } = await buildContextForUser(userId, now, constraints);
  const rows = await listSuggestionsBetween(userId, weekStart, shiftDay(context.today, 7));
  const plan: PlannedSessionForReview[] = rows
    .filter((r) => r.status !== "skipped")
    .map((r) => ({
      plannedOn: r.plannedOn,
      sport: r.sportName ?? "Sportart offen",
      title: r.title,
      durationMin: r.durationMin,
      intensity: `${r.intensity} (${INTENSITY_LABELS[r.intensity]})`,
      status: r.status,
      source: r.source,
      description: r.description.slice(0, 300),
    }));
  if (plan.length === 0) throw new Error("Noch keine Einheit geplant. Plane zuerst eigene Einheiten oder lass den Coach planen.");
  const { review, modelId } = await generatePlanReview(context, plan);
  await savePlanReview(userId, weekStart, review, modelId, { context, plan });
  return { review, modelId, forecastError };
}

export async function currentPlanReview(userId: string, now: Date): Promise<{ review: PlanReview; createdAt: Date; model: string | null } | null> {
  const row = await latestPlanReview(userId, weekStartKey(now));
  return row ? { review: row.review as PlanReview, createdAt: row.createdAt, model: row.model } : null;
}

/** Plan in Vorschläge übersetzen; Sportart über den exakten Namen, Kurz-Einheiten auf die Eisenhorn-Sportart. */
export function planToSuggestions(plan: WeekPlan, sports: { id: string; name: string; category: string; selfPlanned?: boolean }[], generatedAt: string): NewSuggestion[] {
  const byName = new Map(sports.map((s) => [s.name.toLowerCase(), s]));
  const planMeta = { summary: plan.summary, weeklyLoadTarget: plan.weeklyLoadTarget, generatedAt };
  // Selbst geplante Sportarten (feste Termine) fallen auch dann weg, wenn das Modell sie trotzdem vorschlägt.
  const sessions = plan.sessions.filter((s) => !byName.get(s.sport.toLowerCase())?.selfPlanned);
  const items: NewSuggestion[] = sessions.map((s) => ({
    sportId: byName.get(s.sport.toLowerCase())?.id ?? null,
    plannedOn: s.plannedOn,
    title: s.title,
    description: s.description,
    durationMin: s.durationMin,
    intensity: s.intensity,
    meta: { variants: s.variants, rationale: s.rationale, equipment: s.equipment, plan: planMeta },
  }));
  const homeGymSport = sports.find((s) => s.category === "strength" && /eisenhorn/i.test(s.name)) ?? sports.find((s) => s.category === "strength");
  for (const q of plan.quickSessions ?? []) {
    items.push({
      sportId: homeGymSport?.id ?? null,
      plannedOn: q.plannedOn,
      title: q.title,
      description: q.exercises.map((e) => `${e.name}: ${e.sets} × ${e.reps}`).join("\n"),
      durationMin: q.durationMin,
      intensity: "strength",
      meta: { variants: [], rationale: q.rationale, equipment: null, quick: { muscles: q.muscles, exercises: q.exercises }, plan: planMeta },
    });
  }
  return items;
}

export type PlanResult = { count: number; modelId: string; summary: string; forecastError: string | null };

/** Wochenplan erzeugen und als Vorschläge speichern; offene Vorschläge ab heute werden ersetzt. */
export async function createWeekPlan(userId: string, now: Date, constraints: string[]): Promise<PlanResult> {
  const { context, forecastError } = await buildContextForUser(userId, now, constraints);
  const { plan, modelId } = await generateWeekPlan(context);
  const sports = await listSports(userId);
  const items = planToSuggestions(plan, sports, now.toISOString()).filter((i) => i.plannedOn >= context.today);
  const count = await replacePlan(userId, context.today, items, modelId, context);
  return { count, modelId, summary: plan.summary, forecastError };
}
