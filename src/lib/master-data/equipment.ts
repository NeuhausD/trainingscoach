import { and, asc, eq } from "drizzle-orm";
import { db, schema, type EquipmentKind } from "@/db";
import type { EquipmentSettingsJson } from "@/db/schema";

export type Equipment = typeof schema.equipment.$inferSelect;

export type EquipmentInput = {
  name: string;
  kind: EquipmentKind;
  stravaGearId: string | null;
  retired: boolean;
  notes: string | null;
  settings: EquipmentSettingsJson | null;
};

export async function listEquipment(userId: string): Promise<Equipment[]> {
  return db()
    .select()
    .from(schema.equipment)
    .where(eq(schema.equipment.userId, userId))
    .orderBy(asc(schema.equipment.retired), asc(schema.equipment.name));
}

export async function getEquipment(userId: string, id: string): Promise<Equipment | null> {
  const [row] = await db()
    .select()
    .from(schema.equipment)
    .where(and(eq(schema.equipment.id, id), eq(schema.equipment.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createEquipment(userId: string, input: EquipmentInput): Promise<Equipment> {
  const [row] = await db()
    .insert(schema.equipment)
    .values({ userId, ...input })
    .returning();
  return row;
}

export async function updateEquipment(userId: string, id: string, input: EquipmentInput): Promise<Equipment | null> {
  const [row] = await db()
    .update(schema.equipment)
    .set(input)
    .where(and(eq(schema.equipment.id, id), eq(schema.equipment.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteEquipment(userId: string, id: string): Promise<void> {
  await db()
    .delete(schema.equipment)
    .where(and(eq(schema.equipment.id, id), eq(schema.equipment.userId, userId)));
}

export const KIND_LABELS: Record<EquipmentKind, string> = {
  bike_xc: "XC-Bike",
  bike_trail: "Trail-Bike",
  shoes: "Laufschuhe",
  home_gym: "Heimtraining",
  other: "Sonstiges",
};
