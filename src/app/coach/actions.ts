"use server";

import { revalidatePath } from "next/cache";
import { createWeekPlan } from "@/lib/ai/plan";
import { isValidDay } from "@/lib/domain/plan-match";
import { sinceDays } from "@/lib/domain/progress";
import { listActivities } from "@/lib/master-data/activities";
import { moveSuggestion, reconcileSuggestions, setSuggestionStatus, type SuggestionStatus } from "@/lib/master-data/suggestions";
import { requireUser } from "@/lib/users";

export type PlanState = { error?: string; created?: number; summary?: string; modelId?: string; forecastError?: string | null };

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

export async function generatePlanAction(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const user = await requireUser();
  const constraints = (text(formData, "constraints") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 10);
  try {
    const result = await createWeekPlan(user.id, new Date(), constraints);
    revalidatePath("/coach");
    revalidatePath("/dashboard");
    return { created: result.count, summary: result.summary, modelId: result.modelId, forecastError: result.forecastError };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    return { error: /api key|authentication|401/i.test(msg) ? "KI-Anbieter nicht erreichbar: API-Key fehlt oder ist ungültig (Vercel-Env ANTHROPIC_API_KEY oder OPENAI_API_KEY)." : `Plan konnte nicht erstellt werden: ${msg}` };
  }
}

const STATUSES: SuggestionStatus[] = ["suggested", "accepted", "done", "skipped"];

export async function setStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  const status = text(formData, "status") as SuggestionStatus | null;
  if (id && status && STATUSES.includes(status)) await setSuggestionStatus(user.id, id, status);
  revalidatePath("/coach");
  revalidatePath("/dashboard");
}

export async function moveSuggestionAction(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  const plannedOn = text(formData, "plannedOn");
  if (id && isValidDay(plannedOn)) await moveSuggestion(user.id, id, plannedOn);
  revalidatePath("/coach");
  revalidatePath("/dashboard");
}

/** Bereits importierte Aktivitäten der letzten zwei Wochen gegen offene Vorschläge abgleichen. */
export async function reconcileAction() {
  const user = await requireUser();
  const activities = await listActivities(user.id, { since: sinceDays(new Date(), 14) });
  await reconcileSuggestions(
    user.id,
    activities.map((a) => ({ id: a.id, sportId: a.sportId, startedAt: a.startedAt, durationS: a.durationS })),
  );
  revalidatePath("/coach");
  revalidatePath("/dashboard");
}
