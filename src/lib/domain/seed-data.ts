import type { EquipmentKind, Season, SportCategory } from "@/db/schema";

/**
 * Stammdaten des Athleten (docs/01-vision-und-ziele.md, Tabelle «Sportarten»).
 * Reine Daten ohne DB-Bezug; der Seed in src/lib/master-data/seed.ts schreibt sie
 * idempotent in die DB. Gewichtung: 0 = nie, 10 = Schwerpunkt.
 */
export type SeedSport = {
  name: string;
  category: SportCategory;
  stravaTypes: string[];
  seasons: Record<Season, { weight: number; targetSessionsPerWeek: number | null; notes?: string }>;
};

export type SeedEquipment = {
  name: string;
  kind: EquipmentKind;
  notes?: string;
};

export const SEED_SPORTS: SeedSport[] = [
  {
    name: "Mountainbike",
    category: "endurance",
    stravaTypes: ["MountainBikeRide", "Ride", "GravelRide", "EBikeRide", "VirtualRide"],
    seasons: {
      spring: { weight: 7, targetSessionsPerWeek: 2, notes: "Saisonstart, Grundlage auf dem Trail-Bike" },
      summer: { weight: 9, targetSessionsPerWeek: 3, notes: "XC-Bike für Marathons, Trail-Bike für Feierabendrunden" },
      autumn: { weight: 6, targetSessionsPerWeek: 2, notes: "Touren solange die Wege trocken sind" },
      winter: { weight: 1, targetSessionsPerWeek: null, notes: "nur bei trockenen Wegen" },
    },
  },
  {
    name: "Jogging",
    category: "endurance",
    stravaTypes: ["Run", "TrailRun", "VirtualRun"],
    seasons: {
      spring: { weight: 3, targetSessionsPerWeek: null },
      summer: { weight: 2, targetSessionsPerWeek: null },
      autumn: { weight: 5, targetSessionsPerWeek: 1 },
      winter: { weight: 6, targetSessionsPerWeek: 1 },
    },
  },
  {
    name: "Kraft Studio",
    category: "strength",
    stravaTypes: ["WeightTraining", "Workout"],
    seasons: {
      spring: { weight: 5, targetSessionsPerWeek: 1, notes: "Fitline Plaffeien" },
      summer: { weight: 2, targetSessionsPerWeek: null, notes: "Fitline Plaffeien" },
      autumn: { weight: 7, targetSessionsPerWeek: 2, notes: "Fitline Plaffeien" },
      winter: { weight: 8, targetSessionsPerWeek: 2, notes: "Fitline Plaffeien, Kraft und Schnellkraft" },
    },
  },
  {
    name: "Kraft Eisenhorn",
    category: "strength",
    stravaTypes: [],
    seasons: {
      spring: { weight: 5, targetSessionsPerWeek: 1, notes: "Zuhause, 45 min" },
      summer: { weight: 5, targetSessionsPerWeek: 1, notes: "Zuhause, 45 min" },
      autumn: { weight: 5, targetSessionsPerWeek: 1, notes: "Zuhause, 45 min" },
      winter: { weight: 5, targetSessionsPerWeek: 1, notes: "Zuhause, 45 min" },
    },
  },
  {
    name: "Eishockey",
    category: "team",
    stravaTypes: ["IceSkate"],
    seasons: {
      spring: { weight: 1, targetSessionsPerWeek: null, notes: "Saisonende im März" },
      summer: { weight: 0, targetSessionsPerWeek: null },
      autumn: { weight: 5, targetSessionsPerWeek: 1, notes: "Saisonstart Oktober" },
      winter: { weight: 7, targetSessionsPerWeek: 1, notes: "Plausch, fixer Abend" },
    },
  },
  {
    name: "Sonstiges",
    category: "other",
    stravaTypes: [],
    seasons: {
      spring: { weight: 0, targetSessionsPerWeek: null },
      summer: { weight: 0, targetSessionsPerWeek: null },
      autumn: { weight: 0, targetSessionsPerWeek: null },
      winter: { weight: 0, targetSessionsPerWeek: null },
    },
  },
];

export const SEED_EQUIPMENT: SeedEquipment[] = [
  { name: "XC-Bike", kind: "bike_xc", notes: "Marathon und lange Touren" },
  { name: "Trail-Bike", kind: "bike_trail", notes: "Trails und Feierabendrunden" },
];

/** Name der Auffang-Sportart für nicht zuordenbare Importe (docs/03-datenmodell.md). */
export const FALLBACK_SPORT_NAME = "Sonstiges";
