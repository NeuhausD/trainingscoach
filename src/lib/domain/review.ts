/**
 * Bewertung des Rückblicks: waren die letzten Wochen gut, zu wenig, zu kurz
 * oder zu wenig intensiv? Vergleich je Sportart mit dem Saisonziel
 * (Einheiten pro Woche) und mit den Wochen davor (Dauer, Belastung je Stunde).
 * Reine Fachlogik ohne DB.
 */
export type ReviewSport = { name: string; active: boolean; selfPlanned?: boolean; weight: number; targetSessionsPerWeek: number | null };

export type ReviewActivity = { sportName: string | null; durationS: number; trainingLoad: number | string | null };

export type Verdict = "gut" | "zu wenig" | "mehr als geplant" | "offen";

export type SportVerdict = {
  sport: string;
  sessions: number;
  seconds: number;
  load: number;
  targetSessions: number | null;
  verdict: Verdict;
  /** Kurzform für die Balkenbeschriftung, z. B. «5 × von 8». */
  hint: string | null;
  notes: string[];
};

export type Review = {
  overall: "gut" | "mittel" | "zu wenig" | "offen";
  headline: string;
  text: string;
  sports: SportVerdict[];
};

const LOW_SHARE = 0.75;
const HIGH_SHARE = 1.5;
const SHORTER = 0.8;
const LESS_INTENSE = 0.8;

type Agg = { sessions: number; seconds: number; load: number };

function aggregate(activities: ReviewActivity[]): Map<string, Agg> {
  const map = new Map<string, Agg>();
  for (const a of activities) {
    const name = a.sportName ?? "Ohne Sportart";
    const agg = map.get(name) ?? { sessions: 0, seconds: 0, load: 0 };
    agg.sessions += 1;
    agg.seconds += a.durationS;
    const l = Number(a.trainingLoad ?? 0);
    agg.load += Number.isFinite(l) ? l : 0;
    map.set(name, agg);
  }
  return map;
}

function avgMin(agg: Agg): number {
  return agg.sessions === 0 ? 0 : Math.round(agg.seconds / agg.sessions / 60);
}

function loadPerHour(agg: Agg): number {
  return agg.seconds === 0 ? 0 : agg.load / (agg.seconds / 3600);
}

export function reviewWindow(current: ReviewActivity[], previous: ReviewActivity[], sports: ReviewSport[], weeks = 4): Review {
  const cur = aggregate(current);
  const prev = aggregate(previous);
  const bySport = new Map(sports.map((s) => [s.name, s]));
  const names = new Set<string>([...cur.keys(), ...sports.filter((s) => s.active && s.weight > 0).map((s) => s.name)]);

  const rows: SportVerdict[] = [];
  for (const name of names) {
    const agg = cur.get(name) ?? { sessions: 0, seconds: 0, load: 0 };
    const sport = bySport.get(name);
    const target = sport?.active && sport.targetSessionsPerWeek ? sport.targetSessionsPerWeek * weeks : null;
    let verdict: Verdict = "offen";
    let hint: string | null = null;
    if (target !== null) {
      const share = agg.sessions / target;
      verdict = share < LOW_SHARE ? "zu wenig" : share > HIGH_SHARE ? "mehr als geplant" : "gut";
      hint = `${agg.sessions} × von ${target}`;
    } else if (sport?.active && sport.weight >= 7 && agg.sessions === 0) {
      verdict = "zu wenig";
      hint = "Schwerpunkt ohne Einheit";
    }

    const notes: string[] = [];
    const p = prev.get(name);
    if (agg.sessions > 0 && p && p.sessions > 0) {
      const a = avgMin(agg);
      const b = avgMin(p);
      if (b > 0 && a < b * SHORTER) notes.push(`kürzer als zuvor (Ø ${a} statt ${b} min)`);
      const li = loadPerHour(agg);
      const lp = loadPerHour(p);
      if (lp > 0 && li > 0 && li < lp * LESS_INTENSE) notes.push("weniger intensiv als zuvor");
    }
    rows.push({ sport: name, sessions: agg.sessions, seconds: agg.seconds, load: Math.round(agg.load), targetSessions: target, verdict, hint, notes });
  }
  rows.sort((a, b) => b.seconds - a.seconds || (b.targetSessions ?? 0) - (a.targetSessions ?? 0) || a.sport.localeCompare(b.sport));

  const judged = rows.filter((r) => r.verdict !== "offen" && !(bySport.get(r.sport)?.selfPlanned && r.verdict === "zu wenig"));
  const low = judged.filter((r) => r.verdict === "zu wenig");
  const withNotes = rows.filter((r) => r.notes.length > 0);
  let overall: Review["overall"];
  if (judged.length === 0) overall = "offen";
  else if (low.length === 0 && withNotes.length === 0) overall = "gut";
  else if (low.length >= Math.ceil(judged.length / 2)) overall = "zu wenig";
  else overall = "mittel";

  const headline = { gut: "Gut unterwegs", mittel: "Teilweise unter Ziel", "zu wenig": "Unter Ziel", offen: "Ohne Ziele" }[overall];
  const parts: string[] = [];
  if (low.length > 0) parts.push(`Zu wenig: ${low.map((r) => r.sport).join(", ")}`);
  for (const r of withNotes) parts.push(`${r.sport} ${r.notes.join(", ")}`);
  const text =
    overall === "offen"
      ? "Setze unter Sportarten Einheiten pro Woche, dann bewertet der Rückblick die Wochen."
      : parts.length > 0
        ? parts.join(". ") + "."
        : "Einheiten, Dauer und Intensität passen zum Saisonziel.";
  return { overall, headline, text, sports: rows };
}
