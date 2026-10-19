import { generateObject } from "ai";
import { z } from "zod";
import { INTENSITIES } from "@/db/schema";
import { coachModel } from "./provider";
import type { CoachContext } from "./context";

export const suggestionSchema = z.object({
  plannedOn: z.string().describe("YYYY-MM-DD innerhalb der nächsten 7 Tage"),
  sport: z.string().describe("Exakter Name einer Sportart aus dem Kontext"),
  title: z.string().max(80),
  description: z.string().describe("Konkreter Ablauf: Aufwärmen, Hauptteil, Ausfahren; bei Kraft: Übungen, Sätze, Wiederholungen"),
  durationMin: z.number().int().min(15).max(480),
  intensity: z.enum(INTENSITIES),
  equipment: z.string().nullable().describe("Name eines Geräts aus dem Kontext oder null"),
  rationale: z.string().describe("Ein Satz: warum diese Einheit an diesem Tag"),
  variants: z
    .array(z.object({ label: z.string(), description: z.string(), durationMin: z.number().int() }))
    .min(1)
    .max(3)
    .describe("Alternativen, z. B. Indoor bei Regen, kürzere Version"),
});

export const quickSessionSchema = z.object({
  plannedOn: z.string().describe("YYYY-MM-DD innerhalb der nächsten 7 Tage"),
  title: z.string().max(60),
  muscles: z.array(z.string()).min(1).max(3).describe("Muskelgruppen aus homeGym.neglectedMuscles"),
  exercises: z
    .array(z.object({ name: z.string().describe("Exakter Name aus homeGym.exercises"), sets: z.number().int().min(1).max(5), reps: z.string().describe("z. B. 8–12 oder 30 s") }))
    .min(1)
    .max(2),
  durationMin: z.number().int().min(5).max(10),
  rationale: z.string().describe("Ein Satz: warum diese Muskeln jetzt"),
});

export const weekPlanSchema = z.object({
  summary: z.string().describe("2–3 Sätze zur Woche: Fokus, Umfang, Erholung"),
  weeklyLoadTarget: z.number().describe("Ziel-Belastungspunkte der Woche"),
  sessions: z.array(suggestionSchema).min(2).max(7),
  quickSessions: z
    .array(quickSessionSchema)
    .max(3)
    .describe("Kurze Eisenhorn-Einheiten (5–10 min) für zwischendurch; leer, wenn homeGym fehlt"),
});

export type QuickSession = z.infer<typeof quickSessionSchema>;

export type WeekPlan = z.infer<typeof weekPlanSchema>;

const SYSTEM_PROMPT = `Du bist ein pragmatischer Trainingscoach für einen Hobby-Sportler in der Schweiz (Voralpen, Region Freiburg).
Ziele: allgemeine Fitness, Mountainbike-Ausdauer (Touren, Marathons), Kraft und Schnellkraft (Sprints, Rampen).
Regeln:
- Plane genau eine Woche ab "today". Respektiere die Saison-Gewichtung der Sportarten (0 = nie, 10 = Schwerpunkt) und targetSessionsPerWeek.
- Berücksichtige die Belastung der letzten 4 Wochen: Wochenbelastung maximal +10 % gegenüber dem Mittel, alle 3–4 Wochen eine Entlastungswoche.
- Nutze die Wettervorhersage: bei Regen > 60 % oder Schnee Indoor-Varianten (Studio, Heim-Krafttraining, Rolle) bevorzugen; gutes Wetter im Sommer für lange MTB-Einheiten nutzen.
- Mindestens ein Ruhetag pro Woche. Harte Einheiten nicht an aufeinanderfolgenden Tagen.
- Kraft: Grundübungen, Schnellkraft über Sprünge/kurze Sprints; Ausdauer: Grundlage dominiert, 1 intensive Einheit pro Woche.
- plannedByAthlete sind gesetzte Einheiten des Athleten: nicht ersetzen, nicht doppeln, Belastung und Erholung darum herum planen (keine harte Einheit am Vortag oder Folgetag einer harten gesetzten Einheit).
- Sportarten mit selfPlanned = true nie einplanen: sie haben feste Termine, der Athlet plant sie selbst. Ihre Belastung steckt in recentWeeks; nennt ein Hinweis den Wochentag, plane davor und danach keine harte Einheit.
- Sportarten mit seasonWeight 0 nicht einplanen; Sportarten mit notes wie "fix" oder festem Wochentag genau dort einplanen.
- Falls homeGym vorhanden: zusätzlich 1–3 quickSessions von 5–10 Minuten mit 1–2 Übungen aus homeGym.exercises (gleicher Aufbau, exakte Namen), bevorzugt für homeGym.neglectedMuscles, an Tagen ohne harte Einheit. Sie zählen nicht zur Wochenbelastung.
- Antworte auf Deutsch (Schweiz, "ss" statt "ß"), konkret und knapp. Verwende nur Sportarten und Geräte aus dem Kontext.`;

export async function generateWeekPlan(context: CoachContext): Promise<{ plan: WeekPlan; modelId: string }> {
  const { model, modelId } = coachModel();
  const { object } = await generateObject({
    model,
    schema: weekPlanSchema,
    system: SYSTEM_PROMPT,
    prompt: `Kontext (JSON):\n${JSON.stringify(context, null, 2)}\n\nErstelle den Wochenplan.`,
  });
  return { plan: object, modelId };
}
