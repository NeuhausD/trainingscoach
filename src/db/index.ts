import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt");
  return drizzle(neon(url), { schema });
}

let cached: ReturnType<typeof createDb> | undefined;

/** Lazy, damit Build und Tests ohne DATABASE_URL laufen. */
export function db() {
  cached ??= createDb();
  return cached;
}

export { schema };
export { SEASONS, SPORT_CATEGORIES, EQUIPMENT_KINDS } from "./schema";
export type { Season, SportCategory, EquipmentKind } from "./schema";
