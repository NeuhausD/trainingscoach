import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Quelle der Wahrheit für das Datenmodell. Erklärung: docs/03-datenmodell.md

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  entraOid: text("entra_oid").unique(),
  homeLocation: text("home_location"),
  homeLat: numeric("home_lat"),
  homeLon: numeric("home_lon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const SPORT_CATEGORIES = ["endurance", "strength", "team", "other"] as const;
export type SportCategory = (typeof SPORT_CATEGORIES)[number];

export const sports = pgTable(
  "sports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category", { enum: SPORT_CATEGORIES }).notNull(),
    stravaTypes: text("strava_types").array().notNull().default([]),
    active: boolean("active").notNull().default(true),
  },
  (t) => [uniqueIndex("sports_user_name_idx").on(t.userId, t.name)],
);

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const sportPreferences = pgTable(
  "sport_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sportId: uuid("sport_id").notNull().references(() => sports.id, { onDelete: "cascade" }),
    season: text("season", { enum: SEASONS }).notNull(),
    weight: integer("weight").notNull().default(5), // 0..10
    targetSessionsPerWeek: integer("target_sessions_per_week"),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("sport_preferences_sport_season_idx").on(t.sportId, t.season)],
);

export const EQUIPMENT_KINDS = ["bike_xc", "bike_trail", "shoes", "home_gym", "other"] as const;
export type EquipmentKind = (typeof EQUIPMENT_KINDS)[number];

export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", { enum: EQUIPMENT_KINDS }).notNull(),
    stravaGearId: text("strava_gear_id").unique(),
    retired: boolean("retired").notNull().default(false),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("equipment_user_name_idx").on(t.userId, t.name)],
);

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id").references(() => sports.id, { onDelete: "set null" }),
  equipmentId: uuid("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  source: text("source", { enum: ["strava", "fit", "manual"] }).notNull(),
  externalId: text("external_id").unique(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  durationS: integer("duration_s").notNull(),
  distanceM: numeric("distance_m"),
  elevationGainM: numeric("elevation_gain_m"),
  avgHr: integer("avg_hr"),
  maxHr: integer("max_hr"),
  avgPowerW: integer("avg_power_w"),
  trainingLoad: numeric("training_load"),
  rpe: integer("rpe"),
  title: text("title"),
  notes: text("notes"),
  rawSummary: jsonb("raw_summary"),
});

export const bodyMetrics = pgTable("body_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  measuredOn: date("measured_on").notNull(),
  weightKg: numeric("weight_kg"),
  restingHr: integer("resting_hr"),
  bodyFatPct: numeric("body_fat_pct"),
  notes: text("notes"),
});

export const PERFORMANCE_METRICS = [
  "ftp_w",
  "vo2max",
  "squat_1rm_kg",
  "deadlift_1rm_kg",
  "bench_1rm_kg",
  "sprint_peak_w",
  "climb_test_s",
] as const;

export const performanceMetrics = pgTable("performance_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  measuredOn: date("measured_on").notNull(),
  metric: text("metric", { enum: PERFORMANCE_METRICS }).notNull(),
  value: numeric("value").notNull(),
  unit: text("unit").notNull(),
  notes: text("notes"),
});

export const connectors = pgTable("connectors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["strava", "garmin"] }).notNull(),
  externalAthleteId: text("external_athlete_id"),
  accessTokenEnc: text("access_token_enc"),
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  status: text("status", { enum: ["connected", "error", "disconnected"] }).notNull().default("connected"),
});

export const INTENSITIES = [
  "recovery",
  "endurance",
  "tempo",
  "threshold",
  "vo2max",
  "strength",
  "power",
] as const;

export const trainingSuggestions = pgTable("training_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id").references(() => sports.id, { onDelete: "set null" }),
  completedActivityId: uuid("completed_activity_id").references(() => activities.id, { onDelete: "set null" }),
  plannedOn: date("planned_on").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  durationMin: integer("duration_min").notNull(),
  intensity: text("intensity", { enum: INTENSITIES }).notNull(),
  variants: jsonb("variants"),
  status: text("status", { enum: ["suggested", "accepted", "done", "skipped"] }).notNull().default("suggested"),
  model: text("model"),
  contextSnapshot: jsonb("context_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
