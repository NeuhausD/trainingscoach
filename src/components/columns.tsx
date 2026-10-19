/**
 * Säulen in einer Farbe (Moos), maximal 24 px breit, 4 px Rundung an der
 * Datenkappe, Basislinie als Hairline. Beschriftet werden nur die
 * hervorgehobene Säule (z. B. aktuelle Woche) und die x-Achse selektiv; jede
 * Säule hat einen Hover-Titel.
 */
export type ColumnDatum = { key: string; value: number; label: string; title: string; highlight?: boolean };

export function Columns({ data, height = 96, caption, xLabelEvery = 1 }: { data: ColumnDatum[]; height?: number; caption: string; xLabelEvery?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div className="flex items-end gap-1 border-b border-mist" style={{ height }} role="img" aria-label={caption}>
        {data.map((d) => {
          const h = Math.max(d.value > 0 ? 3 : 0, Math.round((d.value / max) * (height - 20)));
          return (
            <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center justify-end" title={d.title}>
              {d.highlight && d.value > 0 && <span className="mb-1 text-[11px] text-stone tabular-nums">{Math.round(d.value)}</span>}
              <span
                aria-hidden="true"
                className={`block w-full max-w-6 rounded-t-[4px] ${d.highlight ? "bg-moss" : "bg-stone/50"}`}
                style={{ height: h }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1">
        {data.map((d, i) => (
          <span key={d.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[11px] text-stone">
            {i % xLabelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
