import { generateObject } from "ai";
import { z } from "zod";
import { coachModel } from "./provider";
import type { CoachContext } from "./context";

/**
 * Prüfung des Wochenplans: der Athlet plant selbst (oder mischt eigene und
 * Coach-Einheiten), das Modell bewertet und schlägt konkrete Verbesserungen
 * vor. Kontext wie beim Wochenplan, nur Aggregate (ADR 0004).
 */
export const planReviewSchema = z.object({
  verdict: z.enum(["gut", "mit Anpassungen gut", "ueberarbeiten"]).describe("Gesamturteil zum Plan"),
  summary: z.string().describe("2–3 Sätze: passt der Plan zu Saison, Belastung der letzten Wochen, Wetter und Erholung?"),
  weeklyLoadEstimate: z.number().describe("Geschätzte Belastungspunkte der geplanten Woche"),
  findings: z
    .array(
      z.object({
        severity: z.enum(["wichtig", "hinweis"]),
        plannedOn: z.string().nullable().describe("YYYY-MM-DD der betroffenen Einheit oder null, wenn die ganze Woche gemeint ist"),
        title: z.string().nullable().describe("Titel der betroffenen Einheit aus dem Plan oder null"),
        text: z.string().describe("Was nicht passt, in einem Satz"),
      }),
    )
    .max(8),
  improvements: z
    .array(
      z.object({
        action: z.enum(["verschieben", "kuerzen", "verlaengern", "lockerer", "haerter", "ersetzen", "hinzufuegen", "streichen"]),
        plannedOn: z.string().nullable().describe("YYYY-MM-DD der betroffenen oder neuen Einheit"),
        title: z.string().nullable().describe("Titel der betroffenen Einheit aus dem Plan; bei hinzufuegen ein neuer Titel"),
        text: z.string().describe("Konkreter Vorschlag mit Begründung, ein bis zwei Sätze"),
        durationMin: z.number().int().nullable().describe("Neue Dauer, falls relevant"),
      }),
    )
    .max(8),
});

export type PlanReview = z.infer<typeof planReviewSchema>;

export type PlannedSessionForReview = {
  plannedOn: string;
  sport: string;
  title: string;
  durationMin: number;
  intensity: string;
  status: string;
  source: "coach" | "athlete";
  description: string;
};

const SYSTEM_PROMPT = `Du bist ein pragmatischer Trainingscoach für einen Hobby-Sportler in der Schweiz (Voralpen, Region Freiburg).
Der Athlet hat seine Woche selbst geplant (teils mit deinen früheren Vorschlägen). Prüfe den Plan, plane ihn nicht neu.
Regeln für die Prüfung:
- Wochenbelastung gegenüber dem Mittel der letzten 4 Wochen: mehr als +10 % ist zu viel, deutlich weniger nur in einer Entlastungswoche sinnvoll.
- Mindestens ein Ruhetag; harte Einheiten (tempo, threshold, vo2max, power) nicht an aufeinanderfolgenden Tagen.
- Saison-Gewichtung und targetSessionsPerWeek der Sportarten respektieren; selfPlanned-Sportarten sind gesetzt, nicht kritisieren.
- Wetter: bei Regen > 60 % oder Schnee Outdoor-Einheiten hinterfragen und eine Indoor-Alternative nennen.
- Kraft: Muskelgruppen abwechseln, homeGym.neglectedMuscles einbauen, wenn Eisenhorn-Einheiten geplant sind.
- Bereits erledigte Einheiten (status done) sind Fakten, nicht ändern.
- Höchstens 8 Befunde und 8 Verbesserungen, die wichtigsten zuerst. Nenne betroffene Einheiten mit Datum und Titel aus dem Plan.
- Antworte auf Deutsch (Schweiz, "ss" statt "ß"), konkret und knapp.`;

export async function generatePlanReview(context: CoachContext, plan: PlannedSessionForReview[]): Promise<{ review: PlanReview; modelId: string }> {
  const { model, modelId } = coachModel();
  const { object } = await generateObject({
    model,
    schema: planReviewSchema,
    system: SYSTEM_PROMPT,
    prompt: `Kontext (JSON):\n${JSON.stringify(context, null, 2)}\n\nGeplante Woche (JSON):\n${JSON.stringify(plan, null, 2)}\n\nPrüfe den Plan.`,
  });
  return { review: object, modelId };
}
