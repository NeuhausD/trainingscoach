/**
 * Linie als SVG: 2 px, runde Enden, Endpunkt mit 8 px Marker und Ring in
 * Oberflächenfarbe. Eine Serie, eine Farbe; Werte stehen am Ende und im Titel.
 */
export function LineChart({
  points,
  caption,
  formatValue,
  height = 120,
}: {
  points: { x: string; y: number; title: string }[];
  caption: string;
  formatValue: (v: number) => string;
  height?: number;
}) {
  if (points.length === 0) return null;
  const width = 400;
  const pad = { top: 14, right: 70, bottom: 22, left: 8 };
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const xs = points.map((p) => new Date(`${p.x}T00:00:00Z`).getTime());
  const xMin = Math.min(...xs);
  const xSpan = Math.max(...xs) - xMin || 1;
  const px = (i: number) => pad.left + ((xs[i] - xMin) / xSpan) * (width - pad.left - pad.right);
  const py = (y: number) => pad.top + (1 - (y - min) / span) * (height - pad.top - pad.bottom);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={caption}>
        <line x1={pad.left} x2={width - pad.right} y1={py(min)} y2={py(min)} stroke="var(--mist)" strokeWidth={1} />
        <path d={d} fill="none" stroke="var(--moss)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.x} cx={px(i)} cy={py(p.y)} r={i === points.length - 1 ? 5 : 3} fill="var(--moss)" stroke="var(--paper)" strokeWidth={2}>
            <title>{p.title}</title>
          </circle>
        ))}
        <text x={px(points.length - 1) + 10} y={py(last.y) + 5} fontSize={15} fill="var(--ink)" fontWeight={600}>
          {formatValue(last.y)}
        </text>
        <text x={pad.left} y={height - 5} fontSize={12} fill="var(--stone)">
          {formatValue(min)} bis {formatValue(max)}
        </text>
      </svg>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
