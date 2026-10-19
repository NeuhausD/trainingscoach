import { and, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { FALLBACK_SPORT_NAME } from "@/lib/domain/seed-data";
import { afterTimestamp, gearToEquipment, mapStravaActivity, shouldRemapSport, stravaExternalId, type MappedActivity } from "@/lib/domain/strava-mapping";
import { tokenNeedsRefresh } from "@/lib/domain/strava-webhook";
import {
  findStravaConnectorByAthlete,
  getStravaConnector,
  markDisconnected,
  markError,
  markSynced,
  readTokens,
  saveStravaTokens,
  type Connector,
} from "@/lib/master-data/connectors";
import { listPerformanceMetrics, latestRestingHr } from "@/lib/master-data/metrics";
import { getActivity, getAthleteGear, getGear, listActivities, refreshTokens, type StravaAthleteGear } from "./client";

export type SyncResult = { imported: number; updated: number; gearCreated: number };

/** Gültigen Access-Token liefern, bei Bedarf erneuern und speichern. */
export async function ensureAccessToken(connector: Connector): Promise<string> {
  const tokens = readTokens(connector);
  if (!tokens) throw new Error("Strava ist nicht verbunden");
  if (!tokenNeedsRefresh(connector.expiresAt)) return tokens.accessToken;
  const fresh = await refreshTokens(tokens.refreshToken);
  await saveStravaTokens(connector.userId, { ...fresh, athleteId: fresh.athleteId ?? connector.externalAthleteId, athleteName: fresh.athleteName ?? connector.athleteName });
  return fresh.accessToken;
}

async function mappingContext(userId: string) {
  const [sports, equipment, perf, restingHr] = await Promise.all([
    db().select({ id: schema.sports.id, name: schema.sports.name, stravaTypes: schema.sports.stravaTypes }).from(schema.sports).where(eq(schema.sports.userId, userId)),
    db().select({ id: schema.equipment.id, stravaGearId: schema.equipment.stravaGearId }).from(schema.equipment).where(eq(schema.equipment.userId, userId)),
    listPerformanceMetrics(userId, 50),
    latestRestingHr(userId),
  ]);
  const ftp = perf.find((p) => p.metric === "ftp_w");
  const fallbackSportId = sports.find((s) => s.name === FALLBACK_SPORT_NAME)?.id ?? null;
  return { sports, equipment, fallbackSportName: FALLBACK_SPORT_NAME, fallbackSportId, ftpW: ftp ? Number(ftp.value) : null, restingHr };
}

/** Unbekanntes Gear als Gerät anlegen (Name aus Strava, Typ nachträglich pflegbar). */
async function ensureGear(userId: string, accessToken: string, gearId: string, cache: Map<string, string>): Promise<string | null> {
  const cached = cache.get(gearId);
  if (cached) return cached;
  const [existing] = await db().select({ id: schema.equipment.id }).from(schema.equipment).where(eq(schema.equipment.stravaGearId, gearId)).limit(1);
  if (existing) {
    cache.set(gearId, existing.id);
    return existing.id;
  }
  let gear;
  try {
    gear = await getGear(accessToken, gearId);
  } catch {
    return null;
  }
  const values = gearToEquipment(gear);
  const [row] = await db()
    .insert(schema.equipment)
    .values({ userId, ...values, notes: "Aus Strava übernommen, Typ bitte prüfen." })
    .onConflictDoNothing({ target: [schema.equipment.userId, schema.equipment.name] })
    .returning({ id: schema.equipment.id });
  if (row) {
    cache.set(gearId, row.id);
    return row.id;
  }
  // Gleichnamiges Gerät existiert bereits (z. B. «Scott Spark» manuell angelegt): Gear-ID dort nachtragen
  const [sameName] = await db()
    .select({ id: schema.equipment.id, stravaGearId: schema.equipment.stravaGearId })
    .from(schema.equipment)
    .where(and(eq(schema.equipment.userId, userId), eq(schema.equipment.name, values.name)))
    .limit(1);
  if (!sameName) return null;
  if (!sameName.stravaGearId) await db().update(schema.equipment).set({ stravaGearId: gearId }).where(eq(schema.equipment.id, sameName.id));
  cache.set(gearId, sameName.id);
  return sameName.id;
}

/**
 * Aktivität anlegen oder aktualisieren. Manuell gesetzte Sportart und Gerät
 * bleiben bei bestehenden Zeilen erhalten; Messwerte und Titel werden
 * aktualisiert.
 */
async function upsertActivity(userId: string, m: MappedActivity, equipmentId: string | null, fallbackSportId: string | null): Promise<"imported" | "updated"> {
  const [existing] = await db().select({ id: schema.activities.id, sportId: schema.activities.sportId, equipmentId: schema.activities.equipmentId }).from(schema.activities).where(eq(schema.activities.externalId, m.externalId)).limit(1);
  const measurements = {
    startedAt: m.startedAt,
    durationS: m.durationS,
    distanceM: m.distanceM === null ? null : String(m.distanceM),
    elevationGainM: m.elevationGainM === null ? null : String(m.elevationGainM),
    avgHr: m.avgHr,
    maxHr: m.maxHr,
    avgPowerW: m.avgPowerW,
    trainingLoad: String(m.trainingLoad),
    title: m.title,
    rawSummary: m.rawSummary,
  };
  if (existing) {
    await db()
      .update(schema.activities)
      .set({
        ...measurements,
        sportId: shouldRemapSport(existing.sportId, fallbackSportId, m.sportId) ? m.sportId : existing.sportId,
        equipmentId: existing.equipmentId ?? equipmentId,
      })
      .where(eq(schema.activities.id, existing.id));
    return "updated";
  }
  await db().insert(schema.activities).values({ userId, source: "strava", externalId: m.externalId, sportId: m.sportId, equipmentId, ...measurements });
  return "imported";
}

async function importActivities(connector: Connector, accessToken: string, activities: Parameters<typeof mapStravaActivity>[0][]): Promise<SyncResult> {
  const ctx = await mappingContext(connector.userId);
  const gearCache = new Map<string, string>();
  const result: SyncResult = { imported: 0, updated: 0, gearCreated: 0 };
  for (const a of activities) {
    const mapped = mapStravaActivity(a, ctx);
    let equipmentId = mapped.equipmentId;
    if (!equipmentId && mapped.unknownGearId) {
      const before = gearCache.size;
      equipmentId = await ensureGear(connector.userId, accessToken, mapped.unknownGearId, gearCache);
      if (equipmentId && gearCache.size > before) {
        ctx.equipment.push({ id: equipmentId, stravaGearId: mapped.unknownGearId });
        result.gearCreated++;
      }
    }
    const outcome = await upsertActivity(connector.userId, mapped, equipmentId, ctx.fallbackSportId);
    result[outcome]++;
  }
  return result;
}

/** Aktivitäten der letzten `days` Tage holen und übernehmen. */
export async function syncStrava(connector: Connector, days: number): Promise<SyncResult> {
  try {
    const accessToken = await ensureAccessToken(connector);
    const activities = await listActivities(accessToken, afterTimestamp(new Date(), days));
    const result = await importActivities(connector, accessToken, activities);
    await markSynced(connector.id);
    return result;
  } catch (e) {
    await markError(connector.id, e instanceof Error ? e.message : String(e));
    throw e;
  }
}

export async function syncStravaForUser(userId: string, days: number): Promise<SyncResult> {
  const connector = await getStravaConnector(userId);
  if (!connector || connector.status === "disconnected") throw new Error("Strava ist nicht verbunden");
  return syncStrava(connector, days);
}

/** Einzelne Aktivität (Webhook) übernehmen. */
export async function syncSingleActivity(ownerId: number, activityId: number): Promise<void> {
  const connector = await findStravaConnectorByAthlete(String(ownerId));
  if (!connector || connector.status === "disconnected") return;
  try {
    const accessToken = await ensureAccessToken(connector);
    const activity = await getActivity(accessToken, activityId);
    await importActivities(connector, accessToken, [activity]);
    await markSynced(connector.id);
  } catch (e) {
    await markError(connector.id, e instanceof Error ? e.message : String(e));
  }
}

export async function deleteSyncedActivity(ownerId: number, activityId: number): Promise<void> {
  const connector = await findStravaConnectorByAthlete(String(ownerId));
  if (!connector) return;
  await db()
    .delete(schema.activities)
    .where(and(eq(schema.activities.userId, connector.userId), eq(schema.activities.externalId, stravaExternalId(activityId))));
}

export async function handleDeauthorize(ownerId: number): Promise<void> {
  const connector = await findStravaConnectorByAthlete(String(ownerId));
  if (connector) await markDisconnected(connector.id);
}

/** Anzahl importierter Strava-Aktivitäten eines Benutzers, für die Statusanzeige. */
export async function countStravaActivities(userId: string): Promise<number> {
  const rows = await db()
    .select({ id: schema.activities.id })
    .from(schema.activities)
    .where(and(eq(schema.activities.userId, userId), like(schema.activities.externalId, "strava:%")));
  return rows.length;
}

/** Gear-Liste aus Strava für das Geräteformular; leer, wenn nicht verbunden oder Fehler. */
export async function listStravaGear(userId: string): Promise<StravaAthleteGear[]> {
  const connector = await getStravaConnector(userId);
  if (!connector || connector.status === "disconnected") return [];
  try {
    return await getAthleteGear(await ensureAccessToken(connector));
  } catch {
    return [];
  }
}
