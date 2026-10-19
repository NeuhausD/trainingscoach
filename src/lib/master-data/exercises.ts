import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { EISENHORN_EXERCISES, exerciseUrl } from "@/lib/domain/eisenhorn-catalog";
import { GYM_EXERCISES } from "@/lib/domain/gym-exercises";

export type Exercise = typeof schema.exercises.$inferSelect;

/** Katalog (user_id NULL) plus eigene Übungen des Benutzers, alphabetisch. */
export async function listExercises(userId: string): Promise<Exercise[]> {
  return db()
    .select()
    .from(schema.exercises)
    .where(or(isNull(schema.exercises.userId), eq(schema.exercises.userId, userId)))
    .orderBy(asc(schema.exercises.name));
}

export async function countCatalog(): Promise<number> {
  const rows = await db().select({ id: schema.exercises.id }).from(schema.exercises).where(isNull(schema.exercises.userId));
  return rows.length;
}

/** Eigene Übung anlegen (Quelle manual); gleicher Name wird wiederverwendet. */
export async function findOrCreateUserExercise(userId: string, name: string, primaryMuscles: string[] = []): Promise<Exercise> {
  const trimmed = name.trim();
  const [existing] = await db()
    .select()
    .from(schema.exercises)
    .where(and(eq(schema.exercises.userId, userId), eq(schema.exercises.name, trimmed)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db()
    .insert(schema.exercises)
    .values({ userId, name: trimmed, source: "manual", primaryMuscles })
    .returning();
  return created;
}

export type CatalogSeedResult = { eisenhorn: number; gym: number };

/** Gemeinsamen Katalog idempotent anlegen (Eisenhorn 161, Studio kuratiert). */
export async function seedExerciseCatalog(): Promise<CatalogSeedResult> {
  const result: CatalogSeedResult = { eisenhorn: 0, gym: 0 };
  for (const e of EISENHORN_EXERCISES) {
    const rows = await db()
      .insert(schema.exercises)
      .values({
        userId: null,
        name: e.name,
        source: "eisenhorn",
        externalRef: String(e.number),
        primaryMuscles: e.primaryMuscles,
        secondaryMuscles: e.secondaryMuscles,
        accessories: e.accessories,
        requiresCablePulley: e.requiresCablePulley,
        url: exerciseUrl(e),
      })
      .onConflictDoNothing({ target: [schema.exercises.source, schema.exercises.externalRef] })
      .returning({ id: schema.exercises.id });
    result.eisenhorn += rows.length;
  }
  for (const g of GYM_EXERCISES) {
    const rows = await db()
      .insert(schema.exercises)
      .values({
        userId: null,
        name: g.name,
        source: "free-exercise-db",
        externalRef: g.externalRef,
        primaryMuscles: g.primaryMuscles,
        secondaryMuscles: g.secondaryMuscles,
        url: `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${g.externalRef}.json`,
      })
      .onConflictDoNothing({ target: [schema.exercises.source, schema.exercises.externalRef] })
      .returning({ id: schema.exercises.id });
    result.gym += rows.length;
  }
  return result;
}
