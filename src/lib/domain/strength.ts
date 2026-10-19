import type { EquipmentSettingsJson } from "@/db/schema";
import { kgForLevel } from "./equipment-settings";

export type SetInput = {
  reps?: string | null;
  weightKg?: string | null;
  level?: string | null;
  rpe?: string | null;
  notes?: string | null;
};

export type SetValues = {
  reps: number | null;
  weightKg: number | null;
  level: number | null;
  rpe: number | null;
  notes: string | null;
};

/** Satz-Eingabe prüfen: Wiederholungen, Gewicht in kg oder Eisenhorn-Stufe (auch Halbstufen). */
export function parseSet(input: SetInput): SetValues {
  const reps = optionalNumber(input.reps, "Wiederholungen", 1, 500, true);
  const weightKg = optionalNumber(input.weightKg, "Gewicht in kg", 0, 1000, false);
  const level = optionalNumber(input.level, "Stufe", 0.5, 50, false);
  const rpe = optionalNumber(input.rpe, "RPE", 1, 10, true);
  if (level !== null && !Number.isInteger(level * 2)) throw new RangeError("Stufe: ganze oder halbe Stufen erwartet");
  if (reps === null && weightKg === null && level === null) throw new RangeError("Satz braucht Wiederholungen, Gewicht oder Stufe");
  return { reps, weightKg, level, rpe, notes: (input.notes ?? "").trim() || null };
}

function optionalNumber(raw: string | null | undefined, label: string, min: number, max: number, integer: boolean): number | null {
  const t = (raw ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new RangeError(`${label}: ${integer ? "ganze Zahl" : "Zahl"} zwischen ${min} und ${max} erwartet`);
  }
  return n;
}

/** Effektives Gewicht eines Satzes: kg direkt, sonst aus der Stufentabelle des Geräts. */
export function effectiveKg(set: { weightKg: number | null; level: number | null }, settings?: EquipmentSettingsJson | null): number | null {
  if (set.weightKg !== null) return set.weightKg;
  if (set.level !== null) return kgForLevel(settings, set.level);
  return null;
}

/** Volumen (kg × Wiederholungen) eines Satzes, null wenn kein Gewicht bekannt. */
export function setVolumeKg(set: { reps: number | null; weightKg: number | null; level: number | null }, settings?: EquipmentSettingsJson | null): number | null {
  const kg = effectiveKg(set, settings);
  if (kg === null || set.reps === null) return null;
  return Math.round(kg * set.reps * 10) / 10;
}

export type MuscleSet = {
  reps: number | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

/**
 * Satzzahl je Muskelgruppe: Primärmuskeln zählen voll, Sekundärmuskeln halb.
 * Grundlage für «welche Muskeln waren zuletzt dran» (P6).
 */
export function setsByMuscle(sets: MuscleSet[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sets) {
    for (const m of s.primaryMuscles) out[m] = (out[m] ?? 0) + 1;
    for (const m of s.secondaryMuscles) if (!s.primaryMuscles.includes(m)) out[m] = (out[m] ?? 0) + 0.5;
  }
  return out;
}

/** Kurztext für einen Satz: "8 × 60 kg", "10 × Stufe 6.5 (24 kg)" oder "12 Wdh.". */
export function describeSet(set: { reps: number | null; weightKg: number | null; level: number | null }, settings?: EquipmentSettingsJson | null): string {
  const reps = set.reps !== null ? `${set.reps} ×` : "";
  if (set.weightKg !== null) return `${reps} ${set.weightKg} kg`.trim();
  if (set.level !== null) {
    const kg = kgForLevel(settings, set.level);
    return `${reps} Stufe ${set.level}${kg !== null ? ` (${kg} kg)` : ""}`.trim();
  }
  return set.reps !== null ? `${set.reps} Wdh.` : "";
}
