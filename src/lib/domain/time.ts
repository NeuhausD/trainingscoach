/**
 * Zeitlogik: gespeichert wird UTC, angezeigt und eingegeben wird Europe/Zurich
 * (CLAUDE.md). Ohne Zeitzonen-Bibliothek, nur Intl.
 */
export const APP_TIME_ZONE = "Europe/Zurich";

function tzParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Offset der Zeitzone gegenüber UTC in Minuten zum gegebenen Zeitpunkt (Zürich: 60 oder 120). */
export function tzOffsetMinutes(date: Date, timeZone = APP_TIME_ZONE): number {
  const p = tzParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** "2026-07-06" + "18:30" in Zürcher Ortszeit → UTC-Zeitpunkt. */
export function localToUtc(dateIso: string, time: string, timeZone = APP_TIME_ZONE): Date {
  const dm = dateIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tm = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) throw new RangeError("Datum oder Zeit nicht lesbar (erwartet JJJJ-MM-TT und HH:MM)");
  const [y, mo, d] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
  const [h, mi] = [Number(tm[1]), Number(tm[2])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) throw new RangeError("Datum oder Zeit ungültig");
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let result = guess - tzOffsetMinutes(new Date(guess), timeZone) * 60000;
  // Zweiter Durchgang für den Tag der Zeitumstellung
  result = guess - tzOffsetMinutes(new Date(result), timeZone) * 60000;
  return new Date(result);
}

/** UTC-Zeitpunkt → { date: "2026-07-06", time: "18:30" } in Zürcher Ortszeit. */
export function utcToLocalParts(date: Date, timeZone = APP_TIME_ZONE): { date: string; time: string } {
  const p = tzParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/** Datum "2026-07-06" → "6. Juli 2026" (de-CH). */
export function formatDate(dateIso: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  const d = typeof dateIso === "string" ? new Date(`${dateIso}T12:00:00Z`) : dateIso;
  return new Intl.DateTimeFormat("de-CH", { timeZone: APP_TIME_ZONE, ...opts }).format(d);
}

/** Zeitpunkt → "Mo, 6. Juli, 18:30" */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Sekunden → "1 h 30 min" oder "45 min". */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
