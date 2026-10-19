"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { buildActivity } from "@/lib/domain/activity-input";
import { parseSet } from "@/lib/domain/strength";
import {
  addSet,
  createActivity,
  deleteActivity,
  deleteSet,
  updateActivity,
} from "@/lib/master-data/activities";
import { findOrCreateUserExercise, seedExerciseCatalog } from "@/lib/master-data/exercises";
import { latestRestingHr } from "@/lib/master-data/metrics";
import { requireUser } from "@/lib/users";

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : "Unbekannter Fehler";
}

function readActivityForm(formData: FormData) {
  return {
    sportId: text(formData, "sportId"),
    equipmentId: text(formData, "equipmentId"),
    date: text(formData, "date"),
    time: text(formData, "time"),
    durationMin: text(formData, "durationMin"),
    rpe: text(formData, "rpe"),
    title: text(formData, "title"),
    notes: text(formData, "notes"),
    distanceKm: text(formData, "distanceKm"),
    elevationM: text(formData, "elevationM"),
    avgHr: text(formData, "avgHr"),
    maxHr: text(formData, "maxHr"),
  };
}

export async function createActivityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  let id: string;
  try {
    const restingHr = await latestRestingHr(user.id);
    const activity = await createActivity(user.id, buildActivity(readActivityForm(formData), { restingHr }));
    id = activity.id;
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/activities");
  revalidatePath("/dashboard");
  redirect(`/activities/${id}?saved=1`);
}

export async function updateActivityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = text(formData, "id");
  if (!id) return { error: "Aktivität fehlt" };
  try {
    const restingHr = await latestRestingHr(user.id);
    const row = await updateActivity(user.id, id, buildActivity(readActivityForm(formData), { restingHr }));
    if (!row) return { error: "Aktivität nicht gefunden" };
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/activities");
  revalidatePath(`/activities/${id}`);
  redirect(`/activities/${id}?saved=1`);
}

export async function deleteActivityAction(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  if (id) await deleteActivity(user.id, id);
  revalidatePath("/activities");
  revalidatePath("/dashboard");
  redirect("/activities");
}

export async function addSetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const activityId = text(formData, "activityId");
  if (!activityId) return { error: "Aktivität fehlt" };
  let exerciseId = (text(formData, "exerciseId") ?? "").trim() || null;
  try {
    const newName = (text(formData, "newExercise") ?? "").trim();
    if (newName) exerciseId = (await findOrCreateUserExercise(user.id, newName)).id;
    const values = parseSet({
      reps: text(formData, "reps"),
      weightKg: text(formData, "weightKg"),
      level: text(formData, "level"),
      rpe: text(formData, "setRpe"),
      notes: text(formData, "setNotes"),
    });
    const row = await addSet(user.id, activityId, exerciseId, values);
    if (!row) return { error: "Aktivität nicht gefunden" };
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath(`/activities/${activityId}`);
  redirect(`/activities/${activityId}${exerciseId ? `?exercise=${exerciseId}` : ""}#saetze`);
}

export async function deleteSetAction(formData: FormData) {
  const user = await requireUser();
  const activityId = text(formData, "activityId");
  const setId = text(formData, "setId");
  if (activityId && setId) await deleteSet(user.id, activityId, setId);
  if (activityId) {
    revalidatePath(`/activities/${activityId}`);
    redirect(`/activities/${activityId}#saetze`);
  }
}

export async function seedCatalogAction(formData: FormData) {
  await requireUser();
  await seedExerciseCatalog();
  const back = text(formData, "back") ?? "/activities";
  revalidatePath(back);
  redirect(back);
}
