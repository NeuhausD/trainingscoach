import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt, encrypt } from "@/lib/crypto";
import type { TokenSet } from "@/lib/strava/client";

export type Connector = typeof schema.connectors.$inferSelect;

export async function getStravaConnector(userId: string): Promise<Connector | null> {
  const [row] = await db()
    .select()
    .from(schema.connectors)
    .where(and(eq(schema.connectors.userId, userId), eq(schema.connectors.provider, "strava")))
    .limit(1);
  return row ?? null;
}

export async function findStravaConnectorByAthlete(athleteId: string): Promise<Connector | null> {
  const [row] = await db()
    .select()
    .from(schema.connectors)
    .where(and(eq(schema.connectors.provider, "strava"), eq(schema.connectors.externalAthleteId, athleteId)))
    .limit(1);
  return row ?? null;
}

/** Alle Strava-Connectoren, die nicht getrennt sind (auch solche mit letztem Fehler, damit der Cron es erneut versucht). */
export async function listConnectedStrava(): Promise<Connector[]> {
  return db()
    .select()
    .from(schema.connectors)
    .where(and(eq(schema.connectors.provider, "strava"), ne(schema.connectors.status, "disconnected")));
}

/** Tokens verschlüsselt speichern (Upsert je Benutzer und Anbieter). */
export async function saveStravaTokens(userId: string, tokens: TokenSet): Promise<Connector> {
  const values = {
    accessTokenEnc: encrypt(tokens.accessToken),
    refreshTokenEnc: encrypt(tokens.refreshToken),
    expiresAt: tokens.expiresAt,
    status: "connected" as const,
    lastError: null,
    ...(tokens.athleteId ? { externalAthleteId: tokens.athleteId } : {}),
    ...(tokens.athleteName ? { athleteName: tokens.athleteName } : {}),
  };
  const [row] = await db()
    .insert(schema.connectors)
    .values({ userId, provider: "strava", ...values })
    .onConflictDoUpdate({ target: [schema.connectors.userId, schema.connectors.provider], set: values })
    .returning();
  return row;
}

export function readTokens(c: Connector): { accessToken: string; refreshToken: string } | null {
  if (!c.accessTokenEnc || !c.refreshTokenEnc) return null;
  return { accessToken: decrypt(c.accessTokenEnc), refreshToken: decrypt(c.refreshTokenEnc) };
}

export async function markSynced(id: string): Promise<void> {
  await db().update(schema.connectors).set({ lastSyncAt: new Date(), lastError: null, status: "connected" }).where(eq(schema.connectors.id, id));
}

export async function markError(id: string, message: string): Promise<void> {
  await db().update(schema.connectors).set({ lastError: message.slice(0, 500), status: "error" }).where(eq(schema.connectors.id, id));
}

export async function markDisconnected(id: string): Promise<void> {
  await db()
    .update(schema.connectors)
    .set({ status: "disconnected", accessTokenEnc: null, refreshTokenEnc: null, expiresAt: null })
    .where(eq(schema.connectors.id, id));
}
