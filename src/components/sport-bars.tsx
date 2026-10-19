import { formatHours, type SportSummary } from "@/lib/domain/progress";

/**
 * Balken je Sportart (Zeit als Länge, Einheiten als Label). Eine Grösse, eine
 * Farbe (Moos); Text in Tinte, Beschriftung am Balkenende. Tabellensicht ist
 * die Aktivitätenliste.
 */
export function SportBars({ rows, caption }: { rows: SportSummary[]; caption: string }) {
  const max = Math.max(1, ...rows.map((r) => r.seconds));
  return (
    <figure>
      <ol className="flex flex-col gap-2" aria-label={caption}>
        {rows.map((r) => {
          const pct = Math.max(2, Math.round((r.seconds / max) * 100));
          const label = `${formatHours(r.seconds)}, ${r.sessions} ×`;
          return (
            <li key={r.sport} className="grid grid-cols-[7rem_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr]">
              <span className="truncate text-sm font-medium">{r.sport}</span>
              <span className="flex items-center gap-2" title={`${r.sport}: ${r.sessions} Einheiten, ${formatHours(r.seconds)}, Belastung ${r.load}`}>
                <span aria-hidden="true" className="block h-5 rounded-r-[4px] bg-moss" style={{ width: `${pct}%`, maxWidth: "calc(100% - 7rem)" }} />
                <span className="shrink-0 text-sm text-stone tabular-nums">{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
