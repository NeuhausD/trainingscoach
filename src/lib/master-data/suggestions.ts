import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

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
