import catalog from "./eisenhorn-catalog.json";
import type { EquipmentSettingsJson } from "@/db/schema";

/**
 * Übungskatalog des Eisenhorn (Hersteller-Übungsdatenbank, Stand Oktober 2026).
 * Enthält nur Fakten: Nummer, Name, Muskelgruppen, nötiges Zubehör. Anleitung
 * und Video bleiben beim Hersteller und werden verlinkt (docs/adr/0006).
 */
export type MuscleGroup = (typeof catalog.muscles)[number];

export type EisenhornExercise = {
  number: number;
  name: string;
  slug: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  accessories: string[];
  requiresCablePulley: boolean;
};

export const EISENHORN_EXERCISES: EisenhornExercise[] = catalog.exercises;

export const MUSCLE_LABELS: Record<string, string> = {
  back: "Rücken",
  biceps: "Bizeps",
  calves: "Waden",
  chest: "Brust",
  core: "Bauch und Rumpf",
  forearms: "Unterarme",
  glutes: "Po",
  legs: "Beine",
  neck: "Nacken",
  shoulders: "Schultern",
  triceps: "Trizeps",
};

export function exerciseUrl(exercise: EisenhornExercise): string {
  return `https://eisenhorn.com/de-ch/training/kraftuebungen/${exercise.slug}/`;
}

/** Gerätezubehör aus den Settings in die Katalog-Schlüssel übersetzen (griffstange, griffband, blocker, karabiner, seilzug). */
export function availableAccessories(settings: EquipmentSettingsJson | null | undefined): Set<string> {
  const keys = new Set<string>();
  for (const a of settings?.accessories ?? []) {
    const low = a.toLowerCase();
    for (const key of ["griffstange", "griffband", "blocker", "karabiner", "seilzug"]) {
      if (low.includes(key)) keys.add(key);
    }
  }
  if (settings?.cablePulley) keys.add("seilzug");
  return keys;
}

/** Übungen, die mit dem vorhandenen Zubehör ausführbar sind, optional nach Muskelgruppe gefiltert. */
export function feasibleExercises(
  settings: EquipmentSettingsJson | null | undefined,
  muscle?: string,
): EisenhornExercise[] {
  const have = availableAccessories(settings);
  return EISENHORN_EXERCISES.filter(
    (e) =>
      e.accessories.every((a) => have.has(a)) &&
      (!muscle || e.primaryMuscles.includes(muscle) || e.secondaryMuscles.includes(muscle)),
  );
}

/** Umbauaufwand: 0 = nur Horn, 1 = ein Zubehörteil, 2 = mehrere Teile oder Blocker/Seilzug. */
export function setupEffort(exercise: EisenhornExercise): 0 | 1 | 2 {
  const n = exercise.accessories.length;
  if (n === 0) return 0;
  if (n === 1 && !exercise.accessories.some((a) => a === "blocker" || a === "seilzug")) return 1;
  return 2;
}
