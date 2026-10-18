/**
 * Trainingsbelastung, bewusst einfach und nachvollziehbar (docs/03-datenmodell.md).
 * Rückgabe in "Belastungspunkten", vergleichbar mit TSS (100 = 1 h an der Schwelle).
 */
export type LoadInput = {
  durationS: number;
  avgPowerW?: number | null;
  ftpW?: number | null;
  avgHr?: number | null;
  restingHr?: number | null;
  maxHr?: number | null;
  rpe?: number | null; // 1..10
};

export function trainingLoad(input: LoadInput): number {
  const hours = input.durationS / 3600;
  if (hours <= 0) return 0;

  // 1) Leistungsbasiert (TSS-ähnlich, ohne Normalized Power)
  if (input.avgPowerW && input.ftpW && input.ftpW > 0) {
    const intensityFactor = input.avgPowerW / input.ftpW;
    return round(hours * intensityFactor * intensityFactor * 100);
  }

  // 2) Herzfrequenzbasiert (HR-Reserve, TRIMP-ähnlich auf 100/h an der Schwelle skaliert)
  if (input.avgHr && input.restingHr && input.maxHr && input.maxHr > input.restingHr) {
    const hrr = (input.avgHr - input.restingHr) / (input.maxHr - input.restingHr);
    const clamped = Math.min(Math.max(hrr, 0), 1);
    // Schwelle ≈ 0.85 HRR → Faktor 1.0
    const factor = clamped / 0.85;
    return round(hours * factor * factor * 100);
  }

  // 3) Subjektiv (Foster session-RPE): Minuten × RPE, auf 100/h bei RPE 7 skaliert
  if (input.rpe && input.rpe > 0) {
    const minutes = input.durationS / 60;
    return round((minutes * input.rpe) / (60 * 7) * 100);
  }

  return 0;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
