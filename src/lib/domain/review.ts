import { MUSCLE_LABELS } from "./eisenhorn-catalog";
import { setsByMuscle, type MuscleSet } from "./strength";

/**
 * Bewertung des Rückblicks nach Leistungsnutzen: Haben die Einheiten der
 * letzten vier Wochen die Leistung weitergebracht? Geprüft werden
 * Trainingsreize (Grundlage, Intensität, lange Einheiten, Kraft), die
 * Steigerung gegenüber den vier Wochen davor, Regelmässigkeit und Erholung.
 * Reine Fachlogik ohne DB, Schwellen bewusst einfach (docs/03-datenmodell.md).
 */
export type ReviewActivity = {
  sportName: string | null;
  category: "endurance" | "strength" | "team" | "other" | null;
  durationS: number;
  trainingLoad: number | string | null;
  rpe: number | null;
  startedAt: Date;
};

export type Verdict = "gut" | "mittel" | "zu wenig" | "zu viel" | "offen";

export type Dimension = {
  key: "base" | "intensity" | "long" | "strength" | "progression" | "consistency" | "recovery";
  label: string;
  verdict: Verdict;
  /** Kurzwert, z. B. «4 h 10 pro Woche». */
  value: string;
  /** Ein Satz: was das für die Leistung heisst. */
  note: string;
};

export type Review = {
  overall: "wirksam" | "teilweise wirksam" | "wenig wirksam" | "offen";
  headline: string;
  text: string;
  dimensions: Dimension[];
};

/** Belastungspunkte je Stunde, ab der eine Einheit als intensiv gilt (100/h entspricht der Schwelle). */
export const INTENSE_LOAD_PER_HOUR = 70;
/** RPE, ab der eine Einheit als intensiv gilt, wenn keine Belastung je Stunde vorliegt. */
export const INTENSE_RPE = 7;
/** Dauer, ab der eine Ausdauereinheit als lang gilt (Grundlage für Touren und Marathons). */
export const LONG_SESSION_MIN = 120;
/** Hauptmuskelgruppen für Kraft und Schnellkraft. */
const KEY_MUSCLES = ["legs", "glutes", "core", "back", "chest", "shoulders"];

function load(a: ReviewActivity): number {
  const n = Number(a.trainingLoad ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function loadPerHour(a: ReviewActivity): number {
  return a.durationS > 0 ? load(a) / (a.durationS / 3600) : 0;
}

export function isIntense(a: ReviewActivity): boolean {
  const lph = loadPerHour(a);
  if (lph > 0) return lph >= INTENSE_LOAD_PER_HOUR;
  return (a.rpe ?? 0) >= INTENSE_RPE;
}

function hours(list: ReviewActivity[]): number {
  return list.reduce((n, a) => n + a.durationS, 0) / 3600;
}

function fmtHours(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return hh === 0 ? `${mm} min` : `${hh} h ${String(mm).padStart(2, "0")}`;
}

function pct(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function compare(cur: number, prev: number, unit: string, digits = 1): string {
  const p = pct(cur, prev);
  if (p === null) return `${cur.toFixed(digits)} ${unit}`;
  return `${cur.toFixed(digits)} ${unit} (${p >= 0 ? "+" : ""}${p} %)`;
}

export function reviewWindow(current: ReviewActivity[], previous: ReviewActivity[], recentSets: MuscleSet[], now: Date, weeks = 4): Review {
  const dims: Dimension[] = [];
  const endurance = current.filter((a) => a.category === "endurance");
  const prevEndurance = previous.filter((a) => a.category === "endurance");
  const strength = current.filter((a) => a.category === "strength");
  const prevStrength = previous.filter((a) => a.category === "strength");

  // Grundlage: Ausdauerstunden pro Woche
  const baseH = hours(endurance) / weeks;
  const prevBaseH = hours(prevEndurance) / weeks;
  dims.push({
    key: "base",
    label: "Grundlage",
    verdict: baseH >= 3 ? "gut" : baseH >= 1.5 ? "mittel" : "zu wenig",
    value: `${fmtHours(baseH)} Ausdauer pro Woche${pct(baseH, prevBaseH) !== null ? ` (${pct(baseH, prevBaseH)! >= 0 ? "+" : ""}${pct(baseH, prevBaseH)} %)` : ""}`,
    note:
      baseH >= 3
        ? "Genug Umfang, um die Ausdauerbasis zu halten und auszubauen."
        : baseH >= 1.5
          ? "Hält die Basis knapp; für Touren und Marathons fehlt Umfang."
          : "Zu wenig Umfang, die Ausdauerbasis baut ab.",
  });

  // Intensität: intensive Einheiten pro Woche (Ausdauer und Team)
  const intenseCandidates = current.filter((a) => a.category === "endurance" || a.category === "team");
  const intense = intenseCandidates.filter(isIntense);
  const intensePerWeek = intense.length / weeks;
  const prevIntense = previous.filter((a) => (a.category === "endurance" || a.category === "team") && isIntense(a)).length / weeks;
  dims.push({
    key: "intensity",
    label: "Intensität",
    verdict: intensePerWeek >= 0.75 && intensePerWeek <= 2.25 ? "gut" : intensePerWeek > 2.25 ? "zu viel" : intensePerWeek >= 0.5 ? "mittel" : "zu wenig",
    value: `${intense.length} intensive von ${intenseCandidates.length} Einheiten${prevIntense > 0 || intensePerWeek > 0 ? `, zuvor ${Math.round(prevIntense * weeks)}` : ""}`,
    note:
      intensePerWeek >= 0.75 && intensePerWeek <= 2.25
        ? "Ein bis zwei harte Reize pro Woche: so steigt die Schwelle."
        : intensePerWeek > 2.25
          ? "Mehr als zwei harte Einheiten pro Woche, die Erholung leidet."
          : "Kaum harte Reize, Schwelle und Schnellkraft stagnieren.",
  });

  // Lange Einheiten
  const long = endurance.filter((a) => a.durationS >= LONG_SESSION_MIN * 60);
  const prevLong = prevEndurance.filter((a) => a.durationS >= LONG_SESSION_MIN * 60);
  dims.push({
    key: "long",
    label: "Lange Einheiten",
    verdict: long.length >= 3 ? "gut" : long.length >= 1 ? "mittel" : "zu wenig",
    value: `${long.length} ab ${LONG_SESSION_MIN} min, zuvor ${prevLong.length}`,
    note:
      long.length >= 3
        ? "Fast jede Woche eine lange Ausfahrt: gut für Touren und Marathons."
        : long.length >= 1
          ? "Eine lange Einheit alle zwei Wochen reicht nur zum Halten."
          : "Keine lange Einheit: die Ermüdungsresistenz für Marathons fehlt.",
  });

  // Kraft: Einheiten pro Woche und Muskelabdeckung
  const strengthPerWeek = strength.length / weeks;
  const counts = setsByMuscle(recentSets);
  const missing = KEY_MUSCLES.filter((m) => (counts[m] ?? 0) === 0).map((m) => MUSCLE_LABELS[m] ?? m);
  const strengthVerdict: Verdict = strengthPerWeek >= 1.5 ? "gut" : strengthPerWeek >= 0.75 ? "mittel" : "zu wenig";
  dims.push({
    key: "strength",
    label: "Kraft",
    verdict: strengthVerdict,
    value: `${strength.length} Einheiten, zuvor ${prevStrength.length}${recentSets.length > 0 ? `, ${recentSets.length} Sätze erfasst` : ""}`,
    note:
      strengthVerdict === "gut"
        ? missing.length > 0 && recentSets.length > 0
          ? `Regelmässig, aber ohne ${missing.join(", ")}.`
          : "Zwei Krafteinheiten pro Woche: Kraft und Schnellkraft entwickeln sich."
        : strengthVerdict === "mittel"
          ? "Eine Einheit pro Woche hält die Kraft, baut sie kaum auf."
          : "Zu wenig Kraft für Sprints und Rampen.",
  });

  // Steigerung: Belastung aktuell gegen davor
  const curLoad = current.reduce((n, a) => n + load(a), 0);
  const prevLoad = previous.reduce((n, a) => n + load(a), 0);
  const change = pct(curLoad, prevLoad);
  let progVerdict: Verdict = "offen";
  let progNote = "Noch kein Vergleich, es fehlen die vier Wochen davor.";
  if (change !== null) {
    if (change > 25) {
      progVerdict = "zu viel";
      progNote = "Belastung steigt zu steil, Verletzungs- und Überlastungsrisiko.";
    } else if (change >= 5) {
      progVerdict = "gut";
      progNote = "Belastung steigt moderat, der Körper passt sich an.";
    } else if (change >= -10) {
      progVerdict = "mittel";
      progNote = "Belastung hält das Niveau, Fortschritt braucht mehr Reiz.";
    } else {
      progVerdict = "zu wenig";
      progNote = "Belastung sinkt deutlich; als Entlastung gut, sonst Formverlust.";
    }
  }
  dims.push({ key: "progression", label: "Steigerung", verdict: progVerdict, value: compare(curLoad, prevLoad, "Punkte", 0), note: progNote });

  // Regelmässigkeit: längste Pause in Tagen
  const sorted = [...current].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  let gap = 0;
  const windowStart = now.getTime() - weeks * 7 * 86_400_000;
  let last = windowStart;
  for (const a of sorted) {
    gap = Math.max(gap, (a.startedAt.getTime() - last) / 86_400_000);
    last = a.startedAt.getTime();
  }
  gap = Math.max(gap, (now.getTime() - last) / 86_400_000);
  const gapDays = Math.round(gap);
  dims.push({
    key: "consistency",
    label: "Regelmässigkeit",
    verdict: gapDays <= 4 ? "gut" : gapDays <= 7 ? "mittel" : "zu wenig",
    value: `${current.length} Einheiten, längste Pause ${gapDays} Tage`,
    note: gapDays <= 4 ? "Keine langen Pausen, Anpassungen bleiben erhalten." : gapDays <= 7 ? "Eine Woche Pause kostet schon etwas Form." : "Lange Pausen, ein Teil der Anpassung geht verloren.",
  });

  // Erholung: letzte 7 Tage gegen Wochenmittel (ACWR)
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const acute = current.filter((a) => a.startedAt.getTime() >= weekAgo).reduce((n, a) => n + load(a), 0);
  const chronic = curLoad / weeks;
  const ratio = chronic > 0 ? acute / chronic : null;
  dims.push({
    key: "recovery",
    label: "Erholung",
    verdict: ratio === null ? "offen" : ratio > 1.5 ? "zu viel" : ratio < 0.6 ? "zu wenig" : "gut",
    value: ratio === null ? "noch keine Belastung" : `letzte Woche ${Math.round(acute)} von im Mittel ${Math.round(chronic)} Punkten (${ratio.toFixed(2)})`,
    note:
      ratio === null
        ? "Ohne Belastungsdaten keine Aussage."
        : ratio > 1.5
          ? "Akute Belastung weit über dem Mittel: jetzt Erholung einplanen."
          : ratio < 0.6
            ? "Letzte Woche deutlich unter dem Mittel: Erholung oder verlorener Reiz."
            : "Belastung und Erholung im Gleichgewicht.",
  });

  const judged = dims.filter((d) => d.verdict !== "offen");
  const good = judged.filter((d) => d.verdict === "gut").length;
  const bad = judged.filter((d) => d.verdict === "zu wenig" || d.verdict === "zu viel");
  let overall: Review["overall"];
  if (current.length === 0) overall = "offen";
  else if (bad.length === 0 && good >= judged.length - 1) overall = "wirksam";
  else if (bad.length <= 2) overall = "teilweise wirksam";
  else overall = "wenig wirksam";
  const headline = { wirksam: "Wirksam trainiert", "teilweise wirksam": "Teilweise wirksam", "wenig wirksam": "Wenig wirksam", offen: "Keine Einheiten" }[overall];
  const text =
    overall === "offen"
      ? "Ohne Einheiten in den letzten vier Wochen gibt es nichts zu bewerten."
      : bad.length > 0
        ? bad.map((d) => `${d.label} ${d.verdict}`).join(", ") + "."
        : "Reize, Steigerung und Erholung passen zu den Zielen Ausdauer und Schnellkraft.";
  return { overall, headline, text, dimensions: dims };
}
