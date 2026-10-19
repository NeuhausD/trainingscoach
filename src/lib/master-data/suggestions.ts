import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { MATCH_DAY_TOLERANCE, matchSuggestion, shiftDay, type ActivityForMatch, type OpenSuggestion } from "@/lib/domain/plan-match";
import { utcToLocalParts } from "@/lib/domain/time";

export type Suggestion = typeof schema.trainingSuggestions.$inferSelect;
export type SuggestionStatus = Suggestion["status"];
export type SuggestionRow = Suggestion & { sportName: string | null };

export type SuggestionVariant = { label: string; description: string; durationMin: number };

/** Metadaten eines Vorschlags im JSON-Feld `variants`. */
export type SuggestionMeta = {
  variants: SuggestionVariant[];
  rationale: string | null;
  equipment: string | null;
  /** Kurz-Einheit am Eisenhorn: Übungen mit Sätzen und Wiederholungen. */
  quick?: { muscles: string[]; exercises: { name: string; sets: number; reps: string }[] };
  /** Zusammenfassung des Plans, auf jedem Vorschlag desselben Laufs gleich. */
  plan?: { summary: string; weeklyLoadTarget: number; generatedAt: string };
};

export function readMeta(s: Suggestion): SuggestionMeta {
  const v = s.variants as Partial<SuggestionMeta> | null;
  return { variants: v?.variants ?? [], rationale: v?.rationale ?? null, equipment: v?.equipment ?? null, quick: v?.quick, plan: v?.plan };
}

export type NewSuggestion = {
  sportId: string | null;
  plannedOn: string;
  title: string;
  description: string;
  durationMin: number;
  intensity: Suggestion["intensity"];
  meta: SuggestionMeta;
};

/** Vorschläge ab `fromDate` (YYYY-MM-DD), nach Datum. */
export async function listSuggestions(userId: string, fromDate: string): Promise<SuggestionRow[]> {
  const rows = await db()
    .select({ s: schema.trainingSuggestions, sportName: schema.sports.name })
    .from(schema.trainingSuggestions)
    .leftJoin(schema.sports, eq(schema.sports.id, schema.trainingSuggestions.sportId))
    .where(and(eq(schema.trainingSuggestions.userId, userId), gte(schema.trainingSuggestions.plannedOn, fromDate)))
    .orderBy(asc(schema.trainingSuggestions.plannedOn), asc(schema.trainingSuggestions.durationMin));
  return rows.map((r) => ({ ...r.s, sportName: r.sportName }));
}

/** Zeitpunkt des letzten Plans (neuester Vorschlag). */
export async function lastPlanAt(userId: string): Promise<Date | null> {
  const [row] = await db()
    .select({ createdAt: schema.trainingSuggestions.createdAt })
    .from(schema.trainingSuggestions)
    .where(eq(schema.trainingSuggestions.userId, userId))
    .orderBy(desc(schema.trainingSuggestions.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
}

/**
 * Neuen Plan speichern: noch nicht beantwortete Vorschläge ab `fromDate`
 * werden ersetzt, angenommene oder erledigte bleiben stehen.
 */
export async function replacePlan(userId: string, fromDate: string, items: NewSuggestion[], model: string, contextSnapshot: unknown): Promise<number> {
  await db()
    .delete(schema.trainingSuggestions)
    .where(
      and(
        eq(schema.trainingSuggestions.userId, userId),
        gte(schema.trainingSuggestions.plannedOn, fromDate),
        inArray(schema.trainingSuggestions.status, ["suggested", "skipped"]),
      ),
    );
  if (items.length === 0) return 0;
  const rows = await db()
    .insert(schema.trainingSuggestions)
    .values(
      items.map((i) => ({
        userId,
        sportId: i.sportId,
        plannedOn: i.plannedOn,
        title: i.title,
        description: i.description,
        durationMin: i.durationMin,
        intensity: i.intensity,
        variants: i.meta,
        status: "suggested" as const,
        model,
        contextSnapshot,
      })),
    )
    .returning({ id: schema.trainingSuggestions.id });
  return rows.length;
}

export async function setSuggestionStatus(userId: string, id: string, status: SuggestionStatus): Promise<void> {
  await db()
    .update(schema.trainingSuggestions)
    .set({ status })
    .where(and(eq(schema.trainingSuggestions.id, id), eq(schema.trainingSuggestions.userId, userId)));
}

// --- Erfüllung und Wochenplan (P7) -----------------------------------------

/** Offene Vorschläge (vorgeschlagen oder angenommen) rund um einen Tag, ±`days`. */
export async function listOpenSuggestionsAround(userId: string, day: string, days = MATCH_DAY_TOLERANCE): Promise<Suggestion[]> {
  return db()
    .select()
    .from(schema.trainingSuggestions)
    .where(
      and(
        eq(schema.trainingSuggestions.userId, userId),
        gte(schema.trainingSuggestions.plannedOn, shiftDay(day, -days)),
        lte(schema.trainingSuggestions.plannedOn, shiftDay(day, days)),
        inArray(schema.trainingSuggestions.status, ["suggested", "accepted"]),
      ),
    );
}

/**
 * Nach dem Anlegen einer Aktivität (manuell, Strava, FIT): passenden offenen
 * Vorschlag als erledigt markieren. Gibt die ID des Vorschlags zurück.
 */
export async function fulfilSuggestionForActivity(userId: string, activity: ActivityForMatch): Promise<string | null> {
  if (!activity.sportId) return null;
  const day = utcToLocalParts(activity.startedAt).date;
  const open = await listOpenSuggestionsAround(userId, day);
  const match = matchSuggestion(activity, open);
  if (!match) return null;
  await db()
    .update(schema.trainingSuggestions)
    .set({ status: "done", completedActivityId: activity.id })
    .where(and(eq(schema.trainingSuggestions.id, match.id), eq(schema.trainingSuggestions.userId, userId)));
  return match.id;
}

/** Vorschläge, die auf eine gelöschte Aktivität zeigten, wieder öffnen. */
export async function reopenByActivity(userId: string, activityId: string): Promise<void> {
  await db()
    .update(schema.trainingSuggestions)
    .set({ status: "accepted", completedActivityId: null })
    .where(and(eq(schema.trainingSuggestions.userId, userId), eq(schema.trainingSuggestions.completedActivityId, activityId)));
}

export async function markDone(userId: string, id: string, activityId: string | null): Promise<void> {
  await db()
    .update(schema.trainingSuggestions)
    .set({ status: "done", completedActivityId: activityId })
    .where(and(eq(schema.trainingSuggestions.id, id), eq(schema.trainingSuggestions.userId, userId)));
}

export async function moveSuggestion(userId: string, id: string, plannedOn: string): Promise<void> {
  await db()
    .update(schema.trainingSuggestions)
    .set({ plannedOn })
    .where(and(eq(schema.trainingSuggestions.id, id), eq(schema.trainingSuggestions.userId, userId)));
}

/** Vorschläge der Woche (Montag bis Sonntag) samt erledigter Aktivität. */
export async function listSuggestionsBetween(userId: string, fromDate: string, toDate: string): Promise<SuggestionRow[]> {
  const rows = await db()
    .select({ s: schema.trainingSuggestions, sportName: schema.sports.name })
    .from(schema.trainingSuggestions)
    .leftJoin(schema.sports, eq(schema.sports.id, schema.trainingSuggestions.sportId))
    .where(and(eq(schema.trainingSuggestions.userId, userId), gte(schema.trainingSuggestions.plannedOn, fromDate), lte(schema.trainingSuggestions.plannedOn, toDate)))
    .orderBy(asc(schema.trainingSuggestions.plannedOn), asc(schema.trainingSuggestions.durationMin));
  return rows.map((r) => ({ ...r.s, sportName: r.sportName }));
}

/**
 * Bereits vorhandene Aktivitäten einer Zeitspanne gegen offene Vorschläge
 * abgleichen (z. B. nach einem Strava-Abgleich oder beim Öffnen der Seite).
 */
export async function reconcileSuggestions(userId: string, activities: ActivityForMatch[]): Promise<number> {
  const open = await listOpenSuggestionsAround(userId, utcToLocalParts(new Date()).date, 14);
  const doneActivities = new Set(open.map((s) => s.completedActivityId).filter(Boolean));
  let count = 0;
  const pool: OpenSuggestion[] = open.map((s) => ({ ...s }));
  for (const a of [...activities].sort((x, y) => x.startedAt.getTime() - y.startedAt.getTime())) {
    if (doneActivities.has(a.id)) continue;
    const match = matchSuggestion(a, pool);
    if (!match) continue;
    match.status = "done";
    match.completedActivityId = a.id;
    await db()
      .update(schema.trainingSuggestions)
      .set({ status: "done", completedActivityId: a.id })
      .where(and(eq(schema.trainingSuggestions.id, match.id), eq(schema.trainingSuggestions.userId, userId)));
    count++;
  }
  return count;
}
