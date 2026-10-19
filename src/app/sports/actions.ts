"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SEASONS, SPORT_CATEGORIES } from "@/db";
import type { ActionState } from "@/components/action-form";
import { parseTargetSessions, parseWeight, type SeasonPreference } from "@/lib/domain/preferences";
import { createSport, deleteSport, savePreferences, updateSport, type SportInput } from "@/lib/master-data/sports";
import { seedMasterData } from "@/lib/master-data/seed";
import { requireUser } from "@/lib/users";

const sportSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(80, "Name zu lang"),
  category: z.enum(SPORT_CATEGORIES, { error: "Ungültige Kategorie" }),
  stravaTypes: z.string().default(""),
  active: z.boolean(),
  selfPlanned: z.boolean(),
});

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

function parseSport(formData: FormData): SportInput {
  const parsed = sportSchema.safeParse({
    name: text(formData, "name"),
    category: text(formData, "category"),
    stravaTypes: text(formData, "stravaTypes") ?? "",
    active: formData.get("active") === "on",
    selfPlanned: formData.get("selfPlanned") === "on",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  const { stravaTypes, ...rest } = parsed.data;
  return {
    ...rest,
    stravaTypes: Array.from(new Set(stravaTypes.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean))),
  };
}

function parsePreferences(formData: FormData): SeasonPreference[] {
  return SEASONS.map((season) => ({
    season,
    weight: parseWeight(text(formData, `weight_${season}`)),
    targetSessionsPerWeek: parseTargetSessions(text(formData, `target_${season}`)),
    notes: (text(formData, `notes_${season}`) ?? "").trim() || null,
  }));
}

function message(e: unknown): string {
  if (e instanceof Error) {
    if (/sports_user_name_idx/.test(e.message)) return "Eine Sportart mit diesem Namen existiert bereits.";
    return e.message;
  }
  return "Unbekannter Fehler";
}

export async function createSportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  let sportId: string;
  try {
    const sport = await createSport(user.id, parseSport(formData));
    await savePreferences(user.id, sport.id, parsePreferences(formData));
    sportId = sport.id;
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/sports");
  redirect(`/sports/${sportId}?saved=1`);
}

export async function updateSportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const sportId = text(formData, "id");
  if (!sportId) return { error: "Sportart fehlt" };
  try {
    const sport = await updateSport(user.id, sportId, parseSport(formData));
    if (!sport) return { error: "Sportart nicht gefunden" };
    await savePreferences(user.id, sportId, parsePreferences(formData));
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/sports");
  revalidatePath(`/sports/${sportId}`);
  redirect(`/sports/${sportId}?saved=1`);
}

export async function deleteSportAction(formData: FormData) {
  const user = await requireUser();
  const sportId = text(formData, "id");
  if (sportId) await deleteSport(user.id, sportId);
  revalidatePath("/sports");
  redirect("/sports");
}

export async function seedMasterDataAction() {
  const user = await requireUser();
  await seedMasterData(user.id);
  revalidatePath("/sports");
  revalidatePath("/equipment");
  redirect("/sports");
}
