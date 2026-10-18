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

export const weekPlanSchema = z.object({
  summary: z.string().describe("2–3 Sätze zur Woche: Fokus, Umfang, Erholung"),
  weeklyLoadTarget: z.number().describe("Ziel-Belastungspunkte der Woche"),
  sessions: z.array(suggestionSchema).min(2).max(7),
});

export type WeekPlan = z.infer<typeof weekPlanSchema>;

const SYSTEM_PROMPT = `Du bist ein pragmatischer Trainingscoach für einen Hobby-Sportler in der Schweiz (Voralpen, Region Freiburg).
Ziele: allgemeine Fitness, Mountainbike-Ausdauer (Touren, Marathons), Kraft und Schnellkraft (Sprints, Rampen).
Regeln:
- Plane genau eine Woche ab "today". Respektiere die Saison-Gewichtung der Sportarten (0 = nie, 10 = Schwerpunkt) und targetSessionsPerWeek.
- Berücksichtige die Belastung der letzten 4 Wochen: Wochenbelastung maximal +10 % gegenüber dem Mittel, alle 3–4 Wochen eine Entlastungswoche.
- Nutze die Wettervorhersage: bei Regen > 60 % oder Schnee Indoor-Varianten (Studio, Heim-Krafttraining, Rolle) bevorzugen; gutes Wetter im Sommer für lange MTB-Einheiten nutzen.
- Mindestens ein Ruhetag pro Woche. Harte Einheiten nicht an aufeinanderfolgenden Tagen.
- Kraft: Grundübungen, Schnellkraft über Sprünge/kurze Sprints; Ausdauer: Grundlage dominiert, 1 intensive Einheit pro Woche.
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
