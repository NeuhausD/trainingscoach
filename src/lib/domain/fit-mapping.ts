import { trainingLoad } from "./load";
import { resolveSport, type MappingContext } from "./strava-mapping";

/**
 * Abbildung einer FIT-Datei (Garmin-Export) auf eine App-Aktivität. Reine
 * Fachlogik: bekommt die vom FIT-SDK dekodierten Nachrichten als einfache
 * Objekte und kennt weder Datei noch DB. Es werden nur Summenwerte der
 * Session gelesen, keine Records (ADR 0003, ADR 0004).
 */
export type FitFileId = {
  serialNumber: number | null;
  timeCreated: Date | null;
  product: string | null;
};

export type FitSession = {
  startTime: Date;
  sport: string | null;
  subSport: string | null;
  totalTimerTime: number | null;
  totalElapsedTime: number | null;
  totalDistance: number | null;
  totalAscent: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  normalizedPower: number | null;
  trainingStressScore: number | null;
  totalTrainingEffect: number | null;
  totalAnaerobicTrainingEffect: number | null;
  trainingLoadPeak: number | null;
  totalCalories: number | null;
};

export type FitSummary = {
  fileId: FitFileId;
  session: FitSession;
  /** VO2max aus der undokumentierten Nachricht 140 (ml/kg/min), falls plausibel. */
  vo2max: number | null;
};

/** Garmin-Zusatzwerte, die Strava nicht liefert. */
export type GarminExtras = {
  aerobicTe: number | null;
  anaerobicTe: number | null;
  garminLoad: number | null;
  caloriesKcal: number | null;
};

export type FitMappedActivity = {
  externalId: string;
  sportId: string | null;
  startedAt: Date;
  durationS: number;
  distanceM: number | null;
  elevationGainM: number | null;
  avgHr: number | null;
  maxHr: number | null;
  avgPowerW: number | null;
  trainingLoad: number;
  extras: GarminExtras;
  rawSummary: { fit: { serialNumber: number | null; timeCreated: string | null; product: string | null; sport: string | null; subSport: string | null } };
};

/** Minimale Sicht auf die vom SDK dekodierten Nachrichten (`Decoder.read().messages`). */
export type DecodedMessages = {
  fileIdMesgs?: Array<Record<string, unknown>>;
  sessionMesgs?: Array<Record<string, unknown>>;
  /** Unbekannte Nachrichten mit `includeUnknownData`: Schlüssel ist die Nachrichtennummer, Felder die Feldnummer. */
  [key: string]: unknown;
};

/** Nachricht 140, Feld 7: MaxMET; VO2max = Wert × 3.5 / 65536 (ml/kg/min). */
const VO2MAX_MESSAGE = "140";
const VO2MAX_FIELD = "7";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "bigint") return Number(v);
  return null;
}

function date(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

export function vo2maxFromMaxMet(raw: number | null): number | null {
  if (raw === null || raw <= 0) return null;
  const value = Math.round((raw * 3.5) / 65536 * 10) / 10;
  return value >= 20 && value <= 95 ? value : null;
}

/** Dekodierte Nachrichten zu einer Zusammenfassung; `null`, wenn keine Session enthalten ist. */
export function summarizeFit(messages: DecodedMessages): FitSummary | null {
  const file = messages.fileIdMesgs?.[0] ?? {};
  const sessions = messages.sessionMesgs ?? [];
  const session = sessions.find((s) => date(s.startTime)) ?? null;
  if (!session) return null;

  const unknown = messages[VO2MAX_MESSAGE];
  let vo2max: number | null = null;
  if (Array.isArray(unknown)) {
    for (const m of unknown as Array<Record<string, unknown>>) {
      const candidate = vo2maxFromMaxMet(num(m?.[VO2MAX_FIELD]));
      if (candidate !== null) vo2max = candidate;
    }
  }

  return {
    fileId: {
      serialNumber: num(file.serialNumber),
      timeCreated: date(file.timeCreated),
      product: str(file.garminProduct) ?? str(file.product),
    },
    session: {
      startTime: date(session.startTime) as Date,
      sport: str(session.sport),
      subSport: str(session.subSport),
      totalTimerTime: num(session.totalTimerTime),
      totalElapsedTime: num(session.totalElapsedTime),
      totalDistance: num(session.totalDistance),
      totalAscent: num(session.totalAscent),
      avgHeartRate: num(session.avgHeartRate),
      maxHeartRate: num(session.maxHeartRate),
      avgPower: num(session.avgPower),
      normalizedPower: num(session.normalizedPower),
      trainingStressScore: num(session.trainingStressScore),
      totalTrainingEffect: num(session.totalTrainingEffect),
      totalAnaerobicTrainingEffect: num(session.totalAnaerobicTrainingEffect),
      trainingLoadPeak: num(session.trainingLoadPeak),
      totalCalories: num(session.totalCalories),
    },
    vo2max,
  };
}

/** Eindeutige Kennung je Datei: Seriennummer der Uhr und Erstellzeit, sonst Startzeit der Session. */
export function fitExternalId(summary: FitSummary): string {
  const serial = summary.fileId.serialNumber ?? 0;
  const created = summary.fileId.timeCreated ?? summary.session.startTime;
  return `fit:${serial}:${Math.floor(created.getTime() / 1000)}`;
}

/**
 * FIT-Sportart und Unterart auf den Strava-Typ abbilden, mit dem die Sportarten
 * der App konfiguriert sind. Unbekannt → null (Auffang-Sportart).
 */
export function fitSportType(sport: string | null, subSport: string | null): string | null {
  const s = (sport ?? "").toLowerCase();
  const sub = (subSport ?? "").toLowerCase();
  switch (s) {
    case "cycling":
      if (sub === "mountain") return "MountainBikeRide";
      if (sub === "gravel_cycling") return "GravelRide";
      if (sub.startsWith("e_bike")) return "EBikeRide";
      if (sub === "indoor_cycling" || sub === "virtual_activity" || sub === "spin") return "VirtualRide";
      return "Ride";
    case "e_biking":
      return "EBikeRide";
    case "running":
      if (sub === "trail") return "TrailRun";
      if (sub === "treadmill" || sub === "indoor_running" || sub === "virtual_activity") return "VirtualRun";
      return "Run";
    case "hiking":
    case "mountaineering":
      return "Hike";
    case "walking":
      return "Walk";
    case "alpine_skiing":
      return "AlpineSki";
    case "cross_country_skiing":
      return "NordicSki";
    case "snowboarding":
      return "Snowboard";
    case "snowshoeing":
      return "Snowshoe";
    case "ice_skating":
      return "IceSkate";
    case "inline_skating":
      return "InlineSkate";
    case "swimming":
      return "Swim";
    case "rowing":
      return "Rowing";
    case "training":
      if (sub === "strength_training") return "WeightTraining";
      if (sub === "yoga") return "Yoga";
      return "Workout";
    case "fitness_equipment":
      if (sub === "indoor_cycling") return "VirtualRide";
      if (sub === "elliptical") return "Elliptical";
      if (sub === "stair_climbing") return "StairStepper";
      if (sub === "indoor_rowing") return "Rowing";
      if (sub === "treadmill") return "VirtualRun";
      return "Workout";
    default:
      return null;
  }
}

function roundOrNull(n: number | null, digits = 0): number | null {
  if (n === null) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function garminExtras(session: FitSession): GarminExtras {
  return {
    aerobicTe: roundOrNull(session.totalTrainingEffect, 1),
    anaerobicTe: roundOrNull(session.totalAnaerobicTrainingEffect, 1),
    garminLoad: roundOrNull(session.trainingLoadPeak, 0),
    caloriesKcal: roundOrNull(session.totalCalories, 0),
  };
}

export function mapFitActivity(summary: FitSummary, ctx: Pick<MappingContext, "sports" | "fallbackSportName" | "ftpW" | "restingHr">): FitMappedActivity {
  const s = summary.session;
  const durationS = Math.max(0, Math.round(s.totalTimerTime ?? s.totalElapsedTime ?? 0));
  const avgHr = roundOrNull(s.avgHeartRate);
  const maxHr = roundOrNull(s.maxHeartRate);
  const avgPowerW = roundOrNull(s.avgPower);
  return {
    externalId: fitExternalId(summary),
    sportId: resolveSport(fitSportType(s.sport, s.subSport), ctx.sports, ctx.fallbackSportName),
    startedAt: s.startTime,
    durationS,
    distanceM: roundOrNull(s.totalDistance),
    elevationGainM: roundOrNull(s.totalAscent),
    avgHr,
    maxHr,
    avgPowerW,
    trainingLoad: trainingLoad({ durationS, avgPowerW, ftpW: ctx.ftpW, avgHr, maxHr, restingHr: ctx.restingHr }),
    extras: garminExtras(s),
    rawSummary: {
      fit: {
        serialNumber: summary.fileId.serialNumber,
        timeCreated: summary.fileId.timeCreated?.toISOString() ?? null,
        product: summary.fileId.product,
        sport: s.sport,
        subSport: s.subSport,
      },
    },
  };
}

export type MatchCandidate = { id: string; startedAt: Date; durationS: number };

/** Startzeit darf so weit abweichen (Uhr vs. Strava-Upload). */
export const MATCH_START_TOLERANCE_S = 180;

/**
 * Bestehende Aktivität (typisch aus Strava), die dieselbe Einheit beschreibt:
 * Start innerhalb von drei Minuten und Dauer innerhalb von 25 % oder 10 Minuten.
 * Bei mehreren Treffern gewinnt der nächste Start.
 */
export function matchExistingActivity(fit: { startedAt: Date; durationS: number }, candidates: MatchCandidate[]): MatchCandidate | null {
  let best: { c: MatchCandidate; diff: number } | null = null;
  for (const c of candidates) {
    const diff = Math.abs(c.startedAt.getTime() - fit.startedAt.getTime()) / 1000;
    if (diff > MATCH_START_TOLERANCE_S) continue;
    const durationDiff = Math.abs(c.durationS - fit.durationS);
    const tolerance = Math.max(600, 0.25 * Math.max(c.durationS, fit.durationS));
    if (durationDiff > tolerance) continue;
    if (!best || diff < best.diff) best = { c, diff };
  }
  return best?.c ?? null;
}

/** Werte, die eine bestehende Aktivität aus der FIT-Datei ergänzt: nur Lücken füllen, Strava-Werte bleiben. */
export function fillGaps<T extends { maxHr: number | null; avgHr: number | null; avgPowerW: number | null; elevationGainM: number | null; distanceM: number | null }>(
  existing: T,
  fit: FitMappedActivity,
): Partial<Pick<T, "maxHr" | "avgHr" | "avgPowerW" | "elevationGainM" | "distanceM">> {
  const patch: Record<string, number> = {};
  if (existing.maxHr === null && fit.maxHr !== null) patch.maxHr = fit.maxHr;
  if (existing.avgHr === null && fit.avgHr !== null) patch.avgHr = fit.avgHr;
  if (existing.avgPowerW === null && fit.avgPowerW !== null) patch.avgPowerW = fit.avgPowerW;
  if (existing.elevationGainM === null && fit.elevationGainM !== null) patch.elevationGainM = fit.elevationGainM;
  if (existing.distanceM === null && fit.distanceM !== null) patch.distanceM = fit.distanceM;
  return patch as Partial<Pick<T, "maxHr" | "avgHr" | "avgPowerW" | "elevationGainM" | "distanceM">>;
}

export const TE_LABELS: [number, string][] = [
  [0.9, "kein Effekt"],
  [1.9, "gering"],
  [2.9, "erhaltend"],
  [3.9, "verbessernd"],
  [4.9, "stark verbessernd"],
  [5, "überbeansprucht"],
];

/** Garmin-Skala 0–5 in Worte (wie in Garmin Connect). */
export function describeTrainingEffect(te: number | null): string | null {
  if (te === null) return null;
  const hit = TE_LABELS.find(([max]) => te <= max) ?? TE_LABELS[TE_LABELS.length - 1];
  return hit[1];
}
