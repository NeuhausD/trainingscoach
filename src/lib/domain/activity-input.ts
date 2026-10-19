import { trainingLoad } from "./load";
import { parseRpe } from "./rpe";
import { localToUtc } from "./time";

/** Rohwerte aus dem Erfassungsformular (alles Strings, wie FormData sie liefert). */
export type ActivityFormInput = {
  sportId?: string | null;
  equipmentId?: string | null;
  date?: string | null;
  time?: string | null;
  durationMin?: string | null;
  rpe?: string | null;
  title?: string | null;
  notes?: string | null;
  distanceKm?: string | null;
  elevationM?: string | null;
  avgHr?: string | null;
  maxHr?: string | null;
};

export type ActivityValues = {
  sportId: string;
  equipmentId: string | null;
  startedAt: Date;
  durationS: number;
  rpe: number | null;
  title: string | null;
  notes: string | null;
  distanceM: number | null;
  elevationGainM: number | null;
  avgHr: number | null;
  maxHr: number | null;
  trainingLoad: number;
};

function num(raw: string | null | undefined, label: string, opts: { min: number; max: number; integer?: boolean }): number | null {
  const t = (raw ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < opts.min || n > opts.max || (opts.integer && !Number.isInteger(n))) {
    throw new RangeError(`${label}: ${opts.integer ? "ganze Zahl" : "Zahl"} zwischen ${opts.min} und ${opts.max} erwartet`);
  }
  return n;
}

/**
 * Formular → Aktivitätswerte inklusive Belastung. Wirft RangeError mit
 * deutscher Meldung bei ungültigen Eingaben. restingHr stammt aus dem letzten
 * Körperwert und ermöglicht die HF-basierte Belastung.
 */
export function buildActivity(input: ActivityFormInput, context: { restingHr?: number | null } = {}): ActivityValues {
  const sportId = (input.sportId ?? "").trim();
  if (!sportId) throw new RangeError("Sportart fehlt");
  const date = (input.date ?? "").trim();
  const time = (input.time ?? "").trim() || "12:00";
  if (!date) throw new RangeError("Datum fehlt");
  const startedAt = localToUtc(date, time);
  if (startedAt.getTime() > Date.now() + 24 * 3600 * 1000) throw new RangeError("Datum liegt in der Zukunft");

  const durationMin = num(input.durationMin, "Dauer in Minuten", { min: 1, max: 24 * 60, integer: true });
  if (durationMin === null) throw new RangeError("Dauer fehlt");
  const durationS = durationMin * 60;
  const rpe = parseRpe(input.rpe);
  const distanceKm = num(input.distanceKm, "Distanz in km", { min: 0, max: 1000 });
  const elevationGainM = num(input.elevationM, "Höhenmeter", { min: 0, max: 20000, integer: true });
  const avgHr = num(input.avgHr, "Durchschnittspuls", { min: 30, max: 240, integer: true });
  const maxHr = num(input.maxHr, "Maximalpuls", { min: 30, max: 240, integer: true });
  if (avgHr && maxHr && avgHr > maxHr) throw new RangeError("Durchschnittspuls liegt über dem Maximalpuls");

  return {
    sportId,
    equipmentId: (input.equipmentId ?? "").trim() || null,
    startedAt,
    durationS,
    rpe,
    title: (input.title ?? "").trim() || null,
    notes: (input.notes ?? "").trim() || null,
    distanceM: distanceKm === null ? null : Math.round(distanceKm * 1000),
    elevationGainM,
    avgHr,
    maxHr,
    trainingLoad: trainingLoad({ durationS, rpe, avgHr, maxHr, restingHr: context.restingHr ?? null }),
  };
}

/** Schnellauswahl für die Dauer, Minuten. */
export const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;
