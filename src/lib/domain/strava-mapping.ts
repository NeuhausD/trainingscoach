import { trainingLoad } from "./load";

/**
 * Abbildung von Strava-Aktivitäten auf App-Aktivitäten. Reine Fachlogik ohne
 * Netz oder DB. Es werden nur die Felder gelesen, die die App braucht; an das
 * LLM geht davon nichts (ADR 0004).
 */
export type StravaSummaryActivity = {
  id: number;
  name?: string | null;
  sport_type?: string | null;
  type?: string | null;
  start_date: string;
  moving_time?: number | null;
  elapsed_time?: number | null;
  distance?: number | null;
  total_elevation_gain?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  average_watts?: number | null;
  device_watts?: boolean | null;
  gear_id?: string | null;
  trainer?: boolean | null;
};

export type SportRef = { id: string; name: string; stravaTypes: string[] };
export type EquipmentRef = { id: string; stravaGearId: string | null };

export type MappingContext = {
  sports: SportRef[];
  fallbackSportName: string;
  equipment: EquipmentRef[];
  ftpW?: number | null;
  restingHr?: number | null;
};

export type MappedActivity = {
  externalId: string;
  sportId: string | null;
  equipmentId: string | null;
  unknownGearId: string | null;
  startedAt: Date;
  durationS: number;
  distanceM: number | null;
  elevationGainM: number | null;
  avgHr: number | null;
  maxHr: number | null;
  avgPowerW: number | null;
  trainingLoad: number;
  title: string | null;
  rawSummary: { stravaId: number; sportType: string | null; gearId: string | null; trainer: boolean };
};

export function stravaExternalId(id: number | string): string {
  return `strava:${id}`;
}

/** Sportart nach Strava-`sport_type` (Fallback `type`); unbekannt → Sportart «Sonstiges». */
export function resolveSport(sportType: string | null | undefined, sports: SportRef[], fallbackSportName: string): string | null {
  const key = (sportType ?? "").trim();
  if (key) {
    const match = sports.find((s) => s.stravaTypes.some((t) => t.toLowerCase() === key.toLowerCase()));
    if (match) return match.id;
  }
  return sports.find((s) => s.name === fallbackSportName)?.id ?? null;
}

export function resolveEquipment(gearId: string | null | undefined, equipment: EquipmentRef[]): { equipmentId: string | null; unknownGearId: string | null } {
  if (!gearId) return { equipmentId: null, unknownGearId: null };
  const match = equipment.find((e) => e.stravaGearId === gearId);
  return match ? { equipmentId: match.id, unknownGearId: null } : { equipmentId: null, unknownGearId: gearId };
}

function round(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

export function mapStravaActivity(a: StravaSummaryActivity, ctx: MappingContext): MappedActivity {
  const durationS = Math.max(0, round(a.moving_time ?? a.elapsed_time) ?? 0);
  const avgHr = round(a.average_heartrate);
  const maxHr = round(a.max_heartrate);
  const avgPowerW = a.device_watts ? round(a.average_watts) : null;
  const sportType = a.sport_type ?? a.type ?? null;
  const gear = resolveEquipment(a.gear_id, ctx.equipment);
  return {
    externalId: stravaExternalId(a.id),
    sportId: resolveSport(sportType, ctx.sports, ctx.fallbackSportName),
    equipmentId: gear.equipmentId,
    unknownGearId: gear.unknownGearId,
    startedAt: new Date(a.start_date),
    durationS,
    distanceM: round(a.distance),
    elevationGainM: round(a.total_elevation_gain),
    avgHr,
    maxHr,
    avgPowerW,
    trainingLoad: trainingLoad({ durationS, avgPowerW, ftpW: ctx.ftpW ?? null, avgHr, maxHr, restingHr: ctx.restingHr ?? null }),
    title: (a.name ?? "").trim() || null,
    rawSummary: { stravaId: a.id, sportType, gearId: a.gear_id ?? null, trainer: !!a.trainer },
  };
}

export type StravaGear = { id: string; name?: string | null; nickname?: string | null; frame_type?: number | null; retired?: boolean | null };

/** Gerätetyp aus Strava-Gear: Velo mit Rahmentyp 1 (MTB) → Trail-Bike als Vorschlag, sonst «Sonstiges»; Typ wird vom Athleten nachgepflegt. */
export function gearToEquipment(gear: StravaGear): { name: string; kind: "bike_xc" | "bike_trail" | "shoes" | "home_gym" | "other"; stravaGearId: string; retired: boolean } {
  const name = (gear.nickname ?? gear.name ?? "").trim() || `Strava-Gear ${gear.id}`;
  const isBike = gear.id.startsWith("b");
  const isShoe = gear.id.startsWith("g");
  const kind = isShoe ? "shoes" : isBike && gear.frame_type === 1 ? "bike_trail" : "other";
  return { name, kind, stravaGearId: gear.id, retired: !!gear.retired };
}

/** Unix-Zeit (Sekunden) für den `after`-Parameter: heute minus Anzahl Tage. */
export function afterTimestamp(now: Date, days: number): number {
  return Math.floor((now.getTime() - days * 86400000) / 1000);
}
