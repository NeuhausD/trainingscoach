"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EQUIPMENT_KINDS } from "@/db";
import type { ActionState } from "@/components/action-form";
import { parseSettingsForm } from "@/lib/domain/equipment-settings";
import {
  createEquipment,
  deleteEquipment,
  updateEquipment,
  type EquipmentInput,
} from "@/lib/master-data/equipment";
import { requireUser } from "@/lib/users";

const equipmentSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(80, "Name zu lang"),
  kind: z.enum(EQUIPMENT_KINDS, { error: "Ungültiger Typ" }),
  stravaGearId: z.string().trim().max(40).default(""),
  retired: z.boolean(),
  notes: z.string().trim().max(500).default(""),
});

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

function parseEquipment(formData: FormData): EquipmentInput {
  const parsed = equipmentSchema.safeParse({
    name: text(formData, "name"),
    kind: text(formData, "kind"),
    stravaGearId: text(formData, "stravaGearId") ?? "",
    retired: formData.get("retired") === "on",
    notes: text(formData, "notes") ?? "",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  const d = parsed.data;
  // Geräteparameter nur für Heimtrainingsgeräte (z. B. Eisenhorn: Kolben, Stufen, Seilzug)
  const settings =
    d.kind === "home_gym"
      ? parseSettingsForm({
          model: text(formData, "model"),
          piston: text(formData, "piston"),
          levels: text(formData, "levels"),
          halfSteps: formData.get("halfSteps") === "on",
          cablePulley: formData.get("cablePulley") === "on",
          accessories: text(formData, "accessories"),
          kgPerLevel: text(formData, "kgPerLevel"),
        })
      : null;
  return {
    name: d.name,
    kind: d.kind,
    stravaGearId: d.stravaGearId || null,
    retired: d.retired,
    notes: d.notes || null,
    settings,
  };
}

function message(e: unknown): string {
  if (e instanceof Error) {
    if (/equipment_user_name_idx/.test(e.message)) return "Ein Gerät mit diesem Namen existiert bereits.";
    if (/equipment_strava_gear_id_unique/.test(e.message)) return "Diese Strava-Gear-ID ist bereits einem Gerät zugeordnet.";
    return e.message;
  }
  return "Unbekannter Fehler";
}

export async function createEquipmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await createEquipment(user.id, parseEquipment(formData));
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function updateEquipmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = text(formData, "id");
  if (!id) return { error: "Gerät fehlt" };
  try {
    const row = await updateEquipment(user.id, id, parseEquipment(formData));
    if (!row) return { error: "Gerät nicht gefunden" };
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function deleteEquipmentAction(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  if (id) await deleteEquipment(user.id, id);
  revalidatePath("/equipment");
  redirect("/equipment");
}
