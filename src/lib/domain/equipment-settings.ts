import { z } from "zod";
import type { EquipmentSettingsJson } from "@/db/schema";

/**
 * Gerätespezifische Parameter, heute für Heimtrainingsgeräte wie das Eisenhorn:
 * Modell, Kolben, Anzahl Widerstandsstufen, Seilzug, Zubehör und optional die
 * Zuordnung Stufe → Kilogramm. Beim Erfassen eines Kraftsatzes wird später die
 * Stufe gespeichert und über kgPerLevel in Kilogramm umgerechnet.
 */
export const equipmentSettingsSchema = z.object({
  model: z.string().trim().max(80).optional(),
  piston: z.string().trim().max(40).optional(),
  levels: z.number().int().min(1).max(50).optional(),
  halfSteps: z.boolean().optional(),
  cablePulley: z.boolean().optional(),
  accessories: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  kgPerLevel: z.record(z.string(), z.number().min(0).max(1000)).optional(),
});

export type EquipmentSettings = z.infer<typeof equipmentSettingsSchema>;

export type SettingsFormInput = {
  model?: string | null;
  piston?: string | null;
  levels?: string | null;
  halfSteps?: boolean;
  cablePulley?: boolean;
  accessories?: string | null;
  kgPerLevel?: string | null;
};

/** Formularfelder in Settings umwandeln; leere Felder fallen weg. Wirft bei ungültigen Werten. */
export function parseSettingsForm(input: SettingsFormInput): EquipmentSettings | null {
  const levelsRaw = (input.levels ?? "").trim();
  const candidate: EquipmentSettings = {
    model: (input.model ?? "").trim() || undefined,
    piston: (input.piston ?? "").trim() || undefined,
    levels: levelsRaw ? Number(levelsRaw) : undefined,
    halfSteps: input.halfSteps || undefined,
    cablePulley: input.cablePulley || undefined,
    accessories: splitList(input.accessories),
    kgPerLevel: parseKgPerLevel(input.kgPerLevel),
  };
  if (candidate.levels !== undefined && !Number.isInteger(candidate.levels)) {
    throw new RangeError("Anzahl Stufen muss eine ganze Zahl sein");
  }
  const parsed = equipmentSettingsSchema.safeParse(candidate);
  if (!parsed.success) throw new RangeError(parsed.error.issues[0]?.message ?? "Ungültige Geräteparameter");
  const cleaned = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  return Object.keys(cleaned).length === 0 ? null : (cleaned as EquipmentSettings);
}

function splitList(raw: string | null | undefined): string[] | undefined {
  const items = (raw ?? "")
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

/** "1=6, 1.5=7.5, 2=9" oder zeilenweise "1: 6" → { "1": 6, "1.5": 7.5, "2": 9 }. Dezimalpunkt, Komma trennt Einträge. */
export function parseKgPerLevel(raw: string | null | undefined): Record<string, number> | undefined {
  const text = (raw ?? "").trim();
  if (!text) return undefined;
  const out: Record<string, number> = {};
  for (const part of text.split(/[,\n;]+/)) {
    const item = part.trim();
    if (!item) continue;
    const m = item.match(/^(\d+(?:\.\d+)?)\s*[=:]\s*(\d+(?:\.\d+)?)$/);
    if (!m) throw new RangeError(`Stufenangabe nicht lesbar: «${item}» (erwartet z. B. 3=12.5, Einträge mit Komma trennen)`);
    out[m[1]] = Number(m[2]);
  }
  return Object.keys(out).length ? out : undefined;
}

/** Umkehrung von parseKgPerLevel für das Formular, sortiert nach Stufe. */
export function formatKgPerLevel(map: Record<string, number> | undefined): string {
  if (!map) return "";
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, kg]) => `${level}=${kg}`)
    .join(", ");
}

/** Kilogramm für eine Stufe, falls in den Settings hinterlegt. */
export function kgForLevel(settings: EquipmentSettingsJson | null | undefined, level: number): number | null {
  const kg = settings?.kgPerLevel?.[String(level)];
  return typeof kg === "number" ? kg : null;
}

/** Kurze Zusammenfassung für Listen, z. B. «Kolben 16, 10 Stufen, ohne Seilzug». */
export function describeSettings(settings: EquipmentSettingsJson | null | undefined): string {
  if (!settings) return "";
  const parts: string[] = [];
  if (settings.model) parts.push(settings.model);
  if (settings.piston) parts.push(`Kolben ${settings.piston}`);
  if (settings.levels) parts.push(`${settings.levels} Stufen${settings.halfSteps ? " mit Halbstufen" : ""}`);
  if (settings.cablePulley !== undefined) parts.push(settings.cablePulley ? "mit Seilzug" : "ohne Seilzug");
  return parts.join(", ");
}
