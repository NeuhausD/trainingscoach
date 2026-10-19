import { PERFORMANCE_METRICS } from "@/db/schema";

export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];

export const METRIC_INFO: Record<PerformanceMetric, { label: string; unit: string; hint: string }> = {
  ftp_w: { label: "FTP", unit: "W", hint: "Schwellenleistung auf dem Bike, 20-min-Test × 0.95" },
  vo2max: { label: "VO2max", unit: "ml/kg/min", hint: "Schätzung der Garmin-Uhr" },
  squat_1rm_kg: { label: "Kniebeuge 1RM", unit: "kg", hint: "Maximalgewicht für eine Wiederholung, auch geschätzt" },
  deadlift_1rm_kg: { label: "Kreuzheben 1RM", unit: "kg", hint: "Maximalgewicht für eine Wiederholung, auch geschätzt" },
  bench_1rm_kg: { label: "Bankdrücken 1RM", unit: "kg", hint: "Maximalgewicht für eine Wiederholung, auch geschätzt" },
  sprint_peak_w: { label: "Sprint-Spitzenleistung", unit: "W", hint: "Höchste Leistung in einem Sprint" },
  climb_test_s: { label: "Klettertest", unit: "s", hint: "Zeit auf der Referenzrampe" },
};

export type BodyMetricInput = { date?: string | null; weightKg?: string | null; restingHr?: string | null; bodyFatPct?: string | null; notes?: string | null };

export function parseBodyMetric(input: BodyMetricInput): { measuredOn: string; weightKg: number | null; restingHr: number | null; bodyFatPct: number | null; notes: string | null } {
  const measuredOn = (input.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(measuredOn)) throw new RangeError("Datum fehlt oder ist ungültig");
  const weightKg = optional(input.weightKg, "Gewicht in kg", 30, 250);
  const restingHr = optional(input.restingHr, "Ruhepuls", 25, 120, true);
  const bodyFatPct = optional(input.bodyFatPct, "Körperfett in %", 2, 60);
  if (weightKg === null && restingHr === null && bodyFatPct === null) throw new RangeError("Mindestens Gewicht oder Ruhepuls angeben");
  return { measuredOn, weightKg, restingHr, bodyFatPct, notes: (input.notes ?? "").trim() || null };
}

export type PerformanceInput = { date?: string | null; metric?: string | null; value?: string | null; notes?: string | null };

export function parsePerformanceMetric(input: PerformanceInput): { measuredOn: string; metric: PerformanceMetric; value: number; unit: string; notes: string | null } {
  const measuredOn = (input.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(measuredOn)) throw new RangeError("Datum fehlt oder ist ungültig");
  const metric = (input.metric ?? "") as PerformanceMetric;
  if (!PERFORMANCE_METRICS.includes(metric)) throw new RangeError("Unbekannte Kennzahl");
  const value = optional(input.value, METRIC_INFO[metric].label, 0, 100000);
  if (value === null) throw new RangeError("Wert fehlt");
  return { measuredOn, metric, value, unit: METRIC_INFO[metric].unit, notes: (input.notes ?? "").trim() || null };
}

function optional(raw: string | null | undefined, label: string, min: number, max: number, integer = false): number | null {
  const t = (raw ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new RangeError(`${label}: ${integer ? "ganze Zahl" : "Zahl"} zwischen ${min} und ${max} erwartet`);
  }
  return n;
}

/** 7-Tage-Mittel des Gewichts aus Messungen (neueste zuerst oder beliebig). */
export function weightTrend(rows: { measuredOn: string; weightKg: number | null }[], days = 7): number | null {
  const withWeight = rows.filter((r) => r.weightKg !== null).sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));
  if (withWeight.length === 0) return null;
  const latest = new Date(`${withWeight[0].measuredOn}T00:00:00Z`).getTime();
  const window = withWeight.filter((r) => latest - new Date(`${r.measuredOn}T00:00:00Z`).getTime() < days * 86400000);
  const avg = window.reduce((sum, r) => sum + (r.weightKg ?? 0), 0) / window.length;
  return Math.round(avg * 10) / 10;
}
