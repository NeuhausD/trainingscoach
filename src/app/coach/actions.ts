"use server";

import { revalidatePath } from "next/cache";
import { createWeekPlan } from "@/lib/ai/plan";
import { setSuggestionStatus, type SuggestionStatus } from "@/lib/master-data/suggestions";
import { requireUser } from "@/lib/users";

export type PlanState = { error?: string; created?: number; summary?: string; modelId?: string };

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
    return { created: result.count, summary: result.summary, modelId: result.modelId };
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
