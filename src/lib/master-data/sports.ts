import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema, type Season, type SportCategory } from "@/db";
import { completeSeasonPreferences, type SeasonPreference } from "@/lib/domain/preferences";

export type Sport = typeof schema.sports.$inferSelect;
export type SportWithPreferences = Sport & { preferences: SeasonPreference[] };

export type SportInput = {
  name: string;
  category: SportCategory;
  stravaTypes: string[];
  active: boolean;
};

export async function listSports(userId: string): Promise<SportWithPreferences[]> {
  const rows = await db()
    .select()
    .from(schema.sports)
    .where(eq(schema.sports.userId, userId))
    .orderBy(asc(schema.sports.name));
  if (rows.length === 0) return [];

  const prefs = await db()
    .select()
    .from(schema.sportPreferences)
    .where(
      inArray(
        schema.sportPreferences.sportId,
        rows.map((r) => r.id),
      ),
    );
  return rows.map((sport) => ({
    ...sport,
    preferences: completeSeasonPreferences(prefs.filter((p) => p.sportId === sport.id)),
  }));
}

export async function getSport(userId: string, sportId: string): Promise<SportWithPreferences | null> {
  const [sport] = await db()
    .select()
    .from(schema.sports)
    .where(and(eq(schema.sports.id, sportId), eq(schema.sports.userId, userId)))
    .limit(1);
  if (!sport) return null;
  const prefs = await db().select().from(schema.sportPreferences).where(eq(schema.sportPreferences.sportId, sport.id));
  return { ...sport, preferences: completeSeasonPreferences(prefs) };
}

export async function createSport(userId: string, input: SportInput): Promise<Sport> {
  const [sport] = await db()
    .insert(schema.sports)
    .values({ userId, ...input })
    .returning();
  return sport;
}

export async function updateSport(userId: string, sportId: string, input: SportInput): Promise<Sport | null> {
  const [sport] = await db()
    .update(schema.sports)
    .set(input)
    .where(and(eq(schema.sports.id, sportId), eq(schema.sports.userId, userId)))
    .returning();
  return sport ?? null;
}

export async function deleteSport(userId: string, sportId: string): Promise<void> {
  await db()
    .delete(schema.sports)
    .where(and(eq(schema.sports.id, sportId), eq(schema.sports.userId, userId)));
}

/** Saison-Präferenzen einer Sportart komplett setzen (Upsert je Saison). */
export async function savePreferences(userId: string, sportId: string, prefs: SeasonPreference[]): Promise<boolean> {
  const [sport] = await db()
    .select({ id: schema.sports.id })
    .from(schema.sports)
    .where(and(eq(schema.sports.id, sportId), eq(schema.sports.userId, userId)))
    .limit(1);
  if (!sport) return false;

  for (const p of completeSeasonPreferences(prefs)) {
    await db()
      .insert(schema.sportPreferences)
      .values({ sportId, season: p.season, weight: p.weight, targetSessionsPerWeek: p.targetSessionsPerWeek, notes: p.notes })
      .onConflictDoUpdate({
        target: [schema.sportPreferences.sportId, schema.sportPreferences.season],
        set: { weight: p.weight, targetSessionsPerWeek: p.targetSessionsPerWeek, notes: p.notes },
      });
  }
  return true;
}

export const CATEGORY_LABELS: Record<SportCategory, string> = {
  endurance: "Ausdauer",
  strength: "Kraft",
  team: "Team / Spiel",
  other: "Sonstiges",
};

export type { Season };
