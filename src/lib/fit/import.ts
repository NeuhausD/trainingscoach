import { and, eq, gte, lte } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db, schema } from "@/db";
import { fillGaps, mapFitActivity, matchExistingActivity, MATCH_START_TOLERANCE_S, type FitSummary } from "@/lib/domain/fit-mapping";
import { utcToLocalParts } from "@/lib/domain/time";
import { fulfilSuggestionForActivity } from "@/lib/master-data/suggestions";
import { mappingContext } from "@/lib/strava/sync";
import { FitParseError, parseFit } from "./parse";

export type FitImportStatus = "created" | "merged" | "updated" | "error";

export type FitImportResult = {
  fileName: string;
  status: FitImportStatus;
  activityId?: string;
  message: string;
  vo2max?: number | null;
};

function numeric(n: number | null): string | null {
  return n === null ? null : String(n);
}

/** Datei ablegen, wenn ein Blob-Store verbunden ist; sonst nur auswerten. */
async function storeFile(userId: string, externalId: string, fileName: string, bytes: Uint8Array): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80) || "activity.fit";
    const blob = await put(`fit/${userId}/${externalId.replace(/:/g, "-")}/${safeName}`, Buffer.from(bytes), {
      access: "private",
      contentType: "application/octet-stream",
      allowOverwrite: true,
    });
    return blob.url;
  } catch {
    return null;
  }
}

/** VO2max als Leistungswert am Tag der Aktivität eintragen, höchstens einmal pro Tag. */
async function recordVo2max(userId: string, summary: FitSummary): Promise<void> {
  if (summary.vo2max === null) return;
  const measuredOn = utcToLocalParts(summary.session.startTime).date;
  const [existing] = await db()
    .select({ id: schema.performanceMetrics.id })
    .from(schema.performanceMetrics)
    .where(and(eq(schema.performanceMetrics.userId, userId), eq(schema.performanceMetrics.metric, "vo2max"), eq(schema.performanceMetrics.measuredOn, measuredOn)))
    .limit(1);
  if (existing) return;
  await db().insert(schema.performanceMetrics).values({
    userId,
    measuredOn,
    metric: "vo2max",
    value: String(summary.vo2max),
    unit: "ml/kg/min",
    notes: "Aus FIT-Datei (Garmin)",
  });
}

/**
 * Eine FIT-Datei übernehmen: bereits importierte Datei → Zusatzwerte auffrischen;
 * passende Strava-Aktivität → mit Garmin-Werten ergänzen; sonst neue Aktivität.
 */
export async function importFitFile(userId: string, fileName: string, bytes: Uint8Array): Promise<FitImportResult> {
  let summary: FitSummary;
  try {
    summary = parseFit(bytes);
  } catch (e) {
    return { fileName, status: "error", message: e instanceof FitParseError ? e.message : "Datei konnte nicht gelesen werden." };
  }
  const ctx = await mappingContext(userId);
  const mapped = mapFitActivity(summary, ctx);
  const extras = {
    aerobicTe: numeric(mapped.extras.aerobicTe),
    anaerobicTe: numeric(mapped.extras.anaerobicTe),
    garminLoad: numeric(mapped.extras.garminLoad),
    caloriesKcal: mapped.extras.caloriesKcal,
  };

  // 1) Dieselbe Datei schon einmal hochgeladen
  const [byExternalId] = await db()
    .select({ id: schema.activities.id })
    .from(schema.activities)
    .where(and(eq(schema.activities.userId, userId), eq(schema.activities.externalId, mapped.externalId)))
    .limit(1);
  if (byExternalId) {
    const fitUrl = await storeFile(userId, mapped.externalId, fileName, bytes);
    await db()
      .update(schema.activities)
      .set({ ...extras, ...(fitUrl ? { fitUrl } : {}) })
      .where(eq(schema.activities.id, byExternalId.id));
    await recordVo2max(userId, summary);
    return { fileName, status: "updated", activityId: byExternalId.id, message: "Schon vorhanden, Garmin-Werte aufgefrischt.", vo2max: summary.vo2max };
  }

  // 2) Gleiche Einheit aus Strava oder manuell erfasst
  const windowMs = (MATCH_START_TOLERANCE_S + 60) * 1000;
  const candidates = await db()
    .select({ id: schema.activities.id, startedAt: schema.activities.startedAt, durationS: schema.activities.durationS, maxHr: schema.activities.maxHr, avgHr: schema.activities.avgHr, avgPowerW: schema.activities.avgPowerW, elevationGainM: schema.activities.elevationGainM, distanceM: schema.activities.distanceM })
    .from(schema.activities)
    .where(
      and(
        eq(schema.activities.userId, userId),
        gte(schema.activities.startedAt, new Date(mapped.startedAt.getTime() - windowMs)),
        lte(schema.activities.startedAt, new Date(mapped.startedAt.getTime() + windowMs)),
      ),
    );
  const match = matchExistingActivity(mapped, candidates);
  if (match) {
    const existing = candidates.find((c) => c.id === match.id)!;
    const gaps = fillGaps(
      { maxHr: existing.maxHr, avgHr: existing.avgHr, avgPowerW: existing.avgPowerW, elevationGainM: existing.elevationGainM === null ? null : Number(existing.elevationGainM), distanceM: existing.distanceM === null ? null : Number(existing.distanceM) },
      mapped,
    );
    const fitUrl = await storeFile(userId, mapped.externalId, fileName, bytes);
    await db()
      .update(schema.activities)
      .set({
        ...extras,
        ...(gaps.maxHr !== undefined ? { maxHr: gaps.maxHr } : {}),
        ...(gaps.avgHr !== undefined ? { avgHr: gaps.avgHr } : {}),
        ...(gaps.avgPowerW !== undefined ? { avgPowerW: gaps.avgPowerW } : {}),
        ...(gaps.elevationGainM !== undefined ? { elevationGainM: numeric(gaps.elevationGainM) } : {}),
        ...(gaps.distanceM !== undefined ? { distanceM: numeric(gaps.distanceM) } : {}),
        ...(fitUrl ? { fitUrl } : {}),
      })
      .where(eq(schema.activities.id, match.id));
    await recordVo2max(userId, summary);
    return { fileName, status: "merged", activityId: match.id, message: "Zur bestehenden Aktivität ergänzt.", vo2max: summary.vo2max };
  }

  // 3) Neue Aktivität
  const fitUrl = await storeFile(userId, mapped.externalId, fileName, bytes);
  const [row] = await db()
    .insert(schema.activities)
    .values({
      userId,
      source: "fit",
      externalId: mapped.externalId,
      sportId: mapped.sportId,
      startedAt: mapped.startedAt,
      durationS: mapped.durationS,
      distanceM: numeric(mapped.distanceM),
      elevationGainM: numeric(mapped.elevationGainM),
      avgHr: mapped.avgHr,
      maxHr: mapped.maxHr,
      avgPowerW: mapped.avgPowerW,
      trainingLoad: String(mapped.trainingLoad),
      rawSummary: mapped.rawSummary,
      ...extras,
      fitUrl,
    })
    .returning({ id: schema.activities.id });
  await fulfilSuggestionForActivity(userId, { id: row.id, sportId: mapped.sportId, startedAt: mapped.startedAt, durationS: mapped.durationS });
  await recordVo2max(userId, summary);
  return { fileName, status: "created", activityId: row.id, message: "Neue Aktivität angelegt.", vo2max: summary.vo2max };
}
