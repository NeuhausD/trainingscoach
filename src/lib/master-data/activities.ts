import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ActivityValues } from "@/lib/domain/activity-input";
import type { SetValues } from "@/lib/domain/strength";
import { fulfilSuggestionForActivity, reopenByActivity } from "./suggestions";

export type Activity = typeof schema.activities.$inferSelect;
export type ExerciseSet = typeof schema.exerciseSets.$inferSelect;
export type Exercise = typeof schema.exercises.$inferSelect;

export type ActivityRow = Activity & { sportName: string | null; equipmentName: string | null };

function toInsert(userId: string, v: ActivityValues) {
  return {
    userId,
    sportId: v.sportId,
    equipmentId: v.equipmentId,
    source: "manual" as const,
    startedAt: v.startedAt,
    durationS: v.durationS,
    rpe: v.rpe,
    title: v.title,
    notes: v.notes,
    distanceM: v.distanceM === null ? null : String(v.distanceM),
    elevationGainM: v.elevationGainM === null ? null : String(v.elevationGainM),
    avgHr: v.avgHr,
    maxHr: v.maxHr,
    trainingLoad: String(v.trainingLoad),
  };
}

export async function listActivities(userId: string, opts: { limit?: number; since?: Date } = {}): Promise<ActivityRow[]> {
  const rows = await db()
    .select({
      activity: schema.activities,
      sportName: schema.sports.name,
      equipmentName: schema.equipment.name,
    })
    .from(schema.activities)
    .leftJoin(schema.sports, eq(schema.sports.id, schema.activities.sportId))
    .leftJoin(schema.equipment, eq(schema.equipment.id, schema.activities.equipmentId))
    .where(
      opts.since
        ? and(eq(schema.activities.userId, userId), gte(schema.activities.startedAt, opts.since))
        : eq(schema.activities.userId, userId),
    )
    .orderBy(desc(schema.activities.startedAt))
    .limit(opts.limit ?? 2000);
  return rows.map((r) => ({ ...r.activity, sportName: r.sportName, equipmentName: r.equipmentName }));
}

export async function getActivity(userId: string, id: string): Promise<ActivityRow | null> {
  const [r] = await db()
    .select({ activity: schema.activities, sportName: schema.sports.name, equipmentName: schema.equipment.name })
    .from(schema.activities)
    .leftJoin(schema.sports, eq(schema.sports.id, schema.activities.sportId))
    .leftJoin(schema.equipment, eq(schema.equipment.id, schema.activities.equipmentId))
    .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId)))
    .limit(1);
  return r ? { ...r.activity, sportName: r.sportName, equipmentName: r.equipmentName } : null;
}

export async function createActivity(userId: string, values: ActivityValues): Promise<Activity> {
  const [row] = await db().insert(schema.activities).values(toInsert(userId, values)).returning();
  await fulfilSuggestionForActivity(userId, row);
  return row;
}

export async function updateActivity(userId: string, id: string, values: ActivityValues): Promise<Activity | null> {
  const { userId: _ignored, source: _source, ...set } = toInsert(userId, values);
  void _ignored;
  void _source;
  const [row] = await db()
    .update(schema.activities)
    .set(set)
    .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteActivity(userId: string, id: string): Promise<void> {
  await reopenByActivity(userId, id);
  await db().delete(schema.activities).where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId)));
}

/** Letzte manuelle Aktivität je Sportart, für Vorbelegung des Formulars. */
export async function lastActivityForSport(userId: string, sportId: string): Promise<Activity | null> {
  const [row] = await db()
    .select()
    .from(schema.activities)
    .where(and(eq(schema.activities.userId, userId), eq(schema.activities.sportId, sportId)))
    .orderBy(desc(schema.activities.startedAt))
    .limit(1);
  return row ?? null;
}

// --- Kraftsätze -------------------------------------------------------------

export type SetRow = ExerciseSet & { exercise: Exercise | null };

export async function listSets(activityId: string): Promise<SetRow[]> {
  const rows = await db()
    .select({ set: schema.exerciseSets, exercise: schema.exercises })
    .from(schema.exerciseSets)
    .leftJoin(schema.exercises, eq(schema.exercises.id, schema.exerciseSets.exerciseId))
    .where(eq(schema.exerciseSets.activityId, activityId))
    .orderBy(schema.exerciseSets.position);
  return rows.map((r) => ({ ...r.set, exercise: r.exercise }));
}

export async function addSet(userId: string, activityId: string, exerciseId: string | null, values: SetValues): Promise<ExerciseSet | null> {
  const activity = await getActivity(userId, activityId);
  if (!activity) return null;
  const existing = await listSets(activityId);
  const [row] = await db()
    .insert(schema.exerciseSets)
    .values({
      activityId,
      exerciseId,
      position: existing.length + 1,
      reps: values.reps,
      weightKg: values.weightKg === null ? null : String(values.weightKg),
      level: values.level === null ? null : String(values.level),
      rpe: values.rpe,
      notes: values.notes,
    })
    .returning();
  return row;
}

export async function deleteSet(userId: string, activityId: string, setId: string): Promise<void> {
  const activity = await getActivity(userId, activityId);
  if (!activity) return;
  await db().delete(schema.exerciseSets).where(and(eq(schema.exerciseSets.id, setId), eq(schema.exerciseSets.activityId, activityId)));
}

/** Sätze der letzten Tage mit Muskelgruppen, für Auswertungen je Muskel. */
export async function recentSetsWithMuscles(userId: string, since: Date): Promise<{ reps: number | null; primaryMuscles: string[]; secondaryMuscles: string[] }[]> {
  const activityIds = (await listActivities(userId, { since })).map((a) => a.id);
  if (activityIds.length === 0) return [];
  const rows = await db()
    .select({ reps: schema.exerciseSets.reps, primary: schema.exercises.primaryMuscles, secondary: schema.exercises.secondaryMuscles })
    .from(schema.exerciseSets)
    .innerJoin(schema.exercises, eq(schema.exercises.id, schema.exerciseSets.exerciseId))
    .where(inArray(schema.exerciseSets.activityId, activityIds));
  return rows.map((r) => ({ reps: r.reps, primaryMuscles: r.primary, secondaryMuscles: r.secondary }));
}

