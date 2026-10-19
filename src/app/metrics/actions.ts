"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { parseBodyMetric, parsePerformanceMetric } from "@/lib/domain/metrics";
import {
  createBodyMetric,
  createPerformanceMetric,
  deleteBodyMetric,
  deletePerformanceMetric,
} from "@/lib/master-data/metrics";
import { requireUser } from "@/lib/users";

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

export async function createBodyMetricAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await createBodyMetric(
      user.id,
      parseBodyMetric({
        date: text(formData, "date"),
        weightKg: text(formData, "weightKg"),
        restingHr: text(formData, "restingHr"),
        bodyFatPct: text(formData, "bodyFatPct"),
        notes: text(formData, "notes"),
      }),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }
  revalidatePath("/metrics");
  redirect("/metrics?saved=body");
}

export async function deleteBodyMetricAction(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  if (id) await deleteBodyMetric(user.id, id);
  revalidatePath("/metrics");
  redirect("/metrics");
}

export async function createPerformanceMetricAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await createPerformanceMetric(
      user.id,
      parsePerformanceMetric({
        date: text(formData, "date"),
        metric: text(formData, "metric"),
        value: text(formData, "value"),
        notes: text(formData, "notes"),
      }),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }
  revalidatePath("/metrics");
  redirect("/metrics?saved=performance#leistung");
}

export async function deletePerformanceMetricAction(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  if (id) await deletePerformanceMetric(user.id, id);
  revalidatePath("/metrics");
  redirect("/metrics#leistung");
}
