import type { INTENSITIES } from "@/db/schema";
import { isValidDay } from "./plan-match";

/** Eigene Einheit im Wochenplan (vom Athleten geplant), aus dem Formular. */
export type PlanEntryInput = {
  sportId: string | null;
  date: string | null;
  durationMin: string | null;
  intensity: string | null;
  title: string | null;
  description: string | null;
};

export type PlanEntry = {
  sportId: string;
  plannedOn: string;
  durationMin: number;
  intensity: (typeof INTENSITIES)[number];
  title: string;
  description: string;
};

const INTENSITY_SET = new Set(["recovery", "endurance", "tempo", "threshold", "vo2max", "strength", "power"]);

export function parsePlanEntry(input: PlanEntryInput, sportNames: Record<string, string>): PlanEntry {
  const sportId = (input.sportId ?? "").trim();
  if (!sportId || !(sportId in sportNames)) throw new Error("Sportart fehlt");
  if (!isValidDay(input.date)) throw new Error("Datum fehlt oder ist ungültig");
  const durationMin = Number(input.durationMin);
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 480) throw new Error("Dauer muss zwischen 5 und 480 Minuten liegen");
  const intensity = (input.intensity ?? "").trim();
  if (!INTENSITY_SET.has(intensity)) throw new Error("Intensität fehlt");
  const title = (input.title ?? "").trim().slice(0, 80) || sportNames[sportId];
  const description = (input.description ?? "").trim().slice(0, 2000);
  return { sportId, plannedOn: input.date, durationMin, intensity: intensity as PlanEntry["intensity"], title, description };
}
