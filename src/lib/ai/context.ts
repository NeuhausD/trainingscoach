import { z } from "zod";
import type { Season } from "@/db/schema";
import type { DailyForecast } from "@/lib/weather/open-meteo";

/**
 * Kontext für den KI-Coach. Enthält ausschliesslich Aggregate, manuelle Daten
 * und Präferenzen (ADR 0004). Keine Strava-Rohfelder hier aufnehmen.
 */
export const coachContextSchema = z.object({
  today: z.string().describe("YYYY-MM-DD"),
  season: z.enum(["spring", "summer", "autumn", "winter"]),
  goals: z.array(z.string()),
  sports: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["endurance", "strength", "team", "other"]),
      seasonWeight: z.number().min(0).max(10),
      targetSessionsPerWeek: z.number().nullable(),
      selfPlanned: z.boolean().optional().describe("true: feste Termine, der Athlet plant selbst; keine Einheiten vorschlagen"),
      notes: z.string().nullable(),
    }),
  ),
  equipment: z.array(z.object({ name: z.string(), kind: z.string() })),
  recentWeeks: z
    .array(
      z.object({
        weekStart: z.string(),
        sessions: z.number(),
        hours: z.number(),
        load: z.number(),
        bySport: z.record(z.string(), z.object({ sessions: z.number(), hours: z.number() })),
      }),
    )
    .describe("Letzte 4 Wochen, älteste zuerst"),
  bodyMetrics: z.object({ weightKg: z.number().nullable(), restingHr: z.number().nullable() }),
  performance: z.array(z.object({ metric: z.string(), value: z.number(), unit: z.string(), measuredOn: z.string() })),
  forecast: z.array(
    z.object({
      date: z.string(),
      tempMaxC: z.number(),
      tempMinC: z.number(),
      precipitationMm: z.number(),
      precipitationProbability: z.number(),
      windMaxKmh: z.number(),
    }),
  ),
  constraints: z.array(z.string()).describe("z. B. 'Dienstag und Donnerstag kein Training'"),
  plannedByAthlete: z
    .array(
      z.object({
        plannedOn: z.string(),
        sport: z.string(),
        title: z.string(),
        durationMin: z.number(),
        intensity: z.string(),
      }),
    )
    .optional()
    .describe("Vom Athleten selbst geplante Einheiten der Woche: stehen fest, nicht ersetzen oder doppeln"),
  homeGym: z
    .object({
      name: z.string(),
      recentSetsByMuscle: z.record(z.string(), z.number()).describe("Sätze je Muskelgruppe in den letzten 14 Tagen"),
      neglectedMuscles: z.array(z.string()),
      exercises: z.array(
        z.object({
          name: z.string(),
          muscles: z.array(z.string()),
          accessories: z.array(z.string()),
          setup: z.enum(["ohne", "gering", "umbau"]),
        }),
      ),
    })
    .nullable()
    .optional()
    .describe("Heim-Kraftstation (Eisenhorn): nur Übungen aus dieser Liste vorschlagen (ADR 0006)"),
});

export type CoachContext = z.infer<typeof coachContextSchema>;

export function mapForecast(days: DailyForecast[]): CoachContext["forecast"] {
  return days.map((d) => ({ ...d }));
}

export function emptyContext(today: string, season: Season): CoachContext {
  return {
    today,
    season,
    goals: [],
    sports: [],
    equipment: [],
    recentWeeks: [],
    bodyMetrics: { weightKg: null, restingHr: null },
    performance: [],
    forecast: [],
    constraints: [],
    homeGym: null,
  };
}
