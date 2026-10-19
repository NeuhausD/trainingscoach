import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export type BodyMetric = typeof schema.bodyMetrics.$inferSelect;
export type PerformanceMetricRow = typeof schema.performanceMetrics.$inferSelect;

export async function listBodyMetrics(userId: string, limit = 60): Promise<BodyMetric[]> {
  return db()
    .select()
    .from(schema.bodyMetrics)
    .where(eq(schema.bodyMetrics.userId, userId))
    .orderBy(desc(schema.bodyMetrics.measuredOn))
    .limit(limit);
}

export async function latestRestingHr(userId: string): Promise<number | null> {
  const rows = await listBodyMetrics(userId, 30);
  return rows.find((r) => r.restingHr !== null)?.restingHr ?? null;
}

export async function createBodyMetric(
  userId: string,
  v: { measuredOn: string; weightKg: number | null; restingHr: number | null; bodyFatPct: number | null; notes: string | null },
): Promise<BodyMetric> {
  const [row] = await db()
    .insert(schema.bodyMetrics)
    .values({
      userId,
      measuredOn: v.measuredOn,
      weightKg: v.weightKg === null ? null : String(v.weightKg),
      restingHr: v.restingHr,
      bodyFatPct: v.bodyFatPct === null ? null : String(v.bodyFatPct),
      notes: v.notes,
    })
    .returning();
  return row;
}

export async function deleteBodyMetric(userId: string, id: string): Promise<void> {
  await db().delete(schema.bodyMetrics).where(and(eq(schema.bodyMetrics.id, id), eq(schema.bodyMetrics.userId, userId)));
}

export async function listPerformanceMetrics(userId: string, limit = 100): Promise<PerformanceMetricRow[]> {
  return db()
    .select()
    .from(schema.performanceMetrics)
    .where(eq(schema.performanceMetrics.userId, userId))
    .orderBy(desc(schema.performanceMetrics.measuredOn))
    .limit(limit);
}

export async function createPerformanceMetric(
  userId: string,
  v: { measuredOn: string; metric: (typeof schema.PERFORMANCE_METRICS)[number]; value: number; unit: string; notes: string | null },
): Promise<PerformanceMetricRow> {
  const [row] = await db()
    .insert(schema.performanceMetrics)
    .values({ userId, measuredOn: v.measuredOn, metric: v.metric, value: String(v.value), unit: v.unit, notes: v.notes })
    .returning();
  return row;
}

export async function deletePerformanceMetric(userId: string, id: string): Promise<void> {
  await db().delete(schema.performanceMetrics).where(and(eq(schema.performanceMetrics.id, id), eq(schema.performanceMetrics.userId, userId)));
}
