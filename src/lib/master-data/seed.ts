import { and, eq } from "drizzle-orm";
import { db, schema, SEASONS } from "@/db";
import { SEED_EQUIPMENT, SEED_SPORTS } from "@/lib/domain/seed-data";

export type SeedResult = { sportsCreated: number; equipmentCreated: number };

/**
 * Legt die Stammdaten aus src/lib/domain/seed-data.ts für einen Benutzer an.
 * Idempotent: bestehende Sportarten (gleicher Name) bleiben unverändert, auch
 * ihre Präferenzen. Geräte werden nur angelegt, wenn der Benutzer noch kein
 * Gerät dieses Typs hat, damit umbenannte Bikes nicht doppelt entstehen.
 */
export async function seedMasterData(userId: string): Promise<SeedResult> {
  const result: SeedResult = { sportsCreated: 0, equipmentCreated: 0 };

  for (const seed of SEED_SPORTS) {
    const [sport] = await db()
      .insert(schema.sports)
      .values({ userId, name: seed.name, category: seed.category, stravaTypes: seed.stravaTypes, active: true })
      .onConflictDoNothing({ target: [schema.sports.userId, schema.sports.name] })
      .returning();
    if (!sport) continue;
    result.sportsCreated++;
    await db()
      .insert(schema.sportPreferences)
      .values(
        SEASONS.map((season) => ({
          sportId: sport.id,
          season,
          weight: seed.seasons[season].weight,
          targetSessionsPerWeek: seed.seasons[season].targetSessionsPerWeek,
          notes: seed.seasons[season].notes ?? null,
        })),
      )
      .onConflictDoNothing();
  }

  const existingKinds = new Set(
    (
      await db()
        .select({ kind: schema.equipment.kind })
        .from(schema.equipment)
        .where(eq(schema.equipment.userId, userId))
    ).map((r) => r.kind),
  );
  for (const seed of SEED_EQUIPMENT) {
    if (existingKinds.has(seed.kind)) continue;
    const [row] = await db()
      .insert(schema.equipment)
      .values({ userId, name: seed.name, kind: seed.kind, notes: seed.notes ?? null, settings: seed.settings ?? null })
      .onConflictDoNothing({ target: [schema.equipment.userId, schema.equipment.name] })
      .returning();
    if (row) result.equipmentCreated++;
  }

  return result;
}

/** Benutzer per E-Mail für den Seed-Skript anlegen oder finden (ohne Session). */
export async function ensureUserByEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const [existing] = await db()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, normalized)))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db().insert(schema.users).values({ email: normalized }).returning({ id: schema.users.id });
  return created.id;
}
