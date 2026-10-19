import Link from "next/link";
import { Columns } from "@/components/columns";
import { LineChart } from "@/components/line-chart";
import { PageHeader } from "@/components/page-header";
import { SportBars } from "@/components/sport-bars";
import { buttonSecondary, panel } from "@/components/ui";
import { METRIC_INFO, type PerformanceMetric } from "@/lib/domain/metrics";
import {
  compareWindows,
  formatHours,
  metricDeltas,
  monthlyBySport,
  percentChange,
  sinceDays,
  summarizeBySport,
  weeklyBuckets,
  weightSeries,
} from "@/lib/domain/progress";
import { formatDate } from "@/lib/domain/time";
import { listActivities } from "@/lib/master-data/activities";
import { listBodyMetrics, listPerformanceMetrics } from "@/lib/master-data/metrics";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Fortschritt" };

function Delta({ current, previous, format }: { current: number; previous: number; format: (v: number) => string }) {
  const pct = percentChange(current, previous);
  if (pct === null) return <span className="text-sm text-stone">keine Vorperiode</span>;
  const sign = pct > 0 ? "+" : "";
  return (
    <span className={`text-sm ${pct >= 0 ? "text-moss" : "text-stone"}`}>
      {sign}
      {pct} % <span className="text-stone">({format(previous)} davor)</span>
    </span>
  );
}

export default async function ProgressPage() {
  const user = await requireUser();
  const now = new Date();
  const [activities, body, performance] = await Promise.all([
    listActivities(user.id, { since: sinceDays(now, 400) }),
    listBodyMetrics(user.id, 200),
    listPerformanceMetrics(user.id, 200),
  ]);
  const cmp = compareWindows(activities, now);
  const weeks = weeklyBuckets(activities, now, 12);
  const year = monthlyBySport(activities, now, 12, 6);
  const weight = weightSeries(
    body.map((b) => ({ measuredOn: b.measuredOn, weightKg: b.weightKg === null ? null : Number(b.weightKg) })),
    now,
    90,
  );
  const metrics = metricDeltas(performance);
  const fourWeeks = summarizeBySport(activities.filter((a) => a.startedAt >= sinceDays(now, 28)));
  const monthLabel = (key: string) => new Intl.DateTimeFormat("de-CH", { month: "short", timeZone: "UTC" }).format(new Date(`${key}-15T00:00:00Z`));
  const cellMax = Math.max(1, ...year.sports.flatMap((s) => s.months.map((m) => m.seconds)));

  return (
    <>
      <PageHeader
        title="Fortschritt"
        subtitle="Vier Wochen im Vergleich, Belastung je Woche, Jahresübersicht, Gewicht und Leistungswerte"
        action={
          <Link href="/metrics" className={buttonSecondary}>
            Werte erfassen
          </Link>
        }
      />

      <section aria-labelledby="vergleich" className="flex flex-col gap-3">
        <h2 id="vergleich" className="text-2xl font-semibold">
          Letzte 4 Wochen gegenüber den 4 davor
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: "Einheiten", cur: cmp.current.sessions, prev: cmp.previous.sessions, format: (v: number) => String(Math.round(v)) },
              { label: "Zeit", cur: cmp.current.seconds, prev: cmp.previous.seconds, format: formatHours },
              { label: "Belastung", cur: cmp.current.load, prev: cmp.previous.load, format: (v: number) => String(Math.round(v)) },
              { label: "Höhenmeter", cur: cmp.current.elevationM, prev: cmp.previous.elevationM, format: (v: number) => `${Math.round(v)} m` },
            ] as const
          ).map((tile) => (
            <div key={tile.label} className={panel}>
              <dt className="text-sm text-stone">{tile.label}</dt>
              <dd className="font-display text-3xl font-semibold leading-none tabular-nums">{tile.format(tile.cur)}</dd>
              <dd className="mt-1">
                <Delta current={tile.cur} previous={tile.prev} format={tile.format} />
              </dd>
            </div>
          ))}
        </dl>
        {fourWeeks.length > 0 && <SportBars rows={fourWeeks} caption="Zeit je Sportart in den letzten vier Wochen" />}
      </section>

      <section aria-labelledby="wochen" className="mt-10 flex flex-col gap-3">
        <div>
          <h2 id="wochen" className="text-2xl font-semibold">
            Belastung je Woche
          </h2>
          <p className="text-sm text-stone">Letzte 12 Wochen, aktuelle Woche hervorgehoben. Belastung in Punkten, 100 entspricht einer Stunde an der Schwelle.</p>
        </div>
        <Columns
          caption="Belastung je Woche, letzte 12 Wochen"
          xLabelEvery={3}
          data={weeks.map((w, i) => ({
            key: w.weekStart,
            value: w.load,
            label: formatDate(w.weekStart, { day: "numeric", month: "numeric" }).replace(/\.$/, ""),
            title: `Woche ab ${formatDate(w.weekStart)}: ${w.sessions} Einheiten, ${formatHours(w.seconds)}, Belastung ${w.load}`,
            highlight: i === weeks.length - 1,
          }))}
        />
      </section>

      <section aria-labelledby="jahr" className="mt-10 flex flex-col gap-3">
        <div>
          <h2 id="jahr" className="text-2xl font-semibold">
            Jahresübersicht
          </h2>
          <p className="text-sm text-stone">Stunden je Monat und Sportart, letzte 12 Monate.</p>
        </div>
        {year.sports.length === 0 ? (
          <p className="text-stone">Noch keine Aktivitäten in den letzten 12 Monaten.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {year.sports.map((s) => (
              <div key={s.sport}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{s.sport}</span>
                  <span className="text-sm text-stone tabular-nums">{formatHours(s.totalSeconds)}</span>
                </div>
                <div className="mt-1 flex items-end gap-1" role="img" aria-label={`${s.sport}: Stunden je Monat`}>
                  {s.months.map((m) => (
                    <span key={m.key} className="flex min-w-0 flex-1 flex-col items-center" title={`${s.sport}, ${monthLabel(m.key)}: ${m.sessions} Einheiten, ${formatHours(m.seconds)}`}>
                      <span
                        aria-hidden="true"
                        className={`block w-full max-w-5 rounded-t-[3px] ${m.seconds > 0 ? "bg-moss" : "bg-mist"}`}
                        style={{ height: Math.max(m.seconds > 0 ? 3 : 2, Math.round((m.seconds / cellMax) * 40)) }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-1">
              {year.months.map((m) => (
                <span key={m} className="min-w-0 flex-1 truncate text-center text-[11px] text-stone">
                  {monthLabel(m)}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="gewicht" className="mt-10 flex flex-col gap-3">
        <div>
          <h2 id="gewicht" className="text-2xl font-semibold">
            Gewicht
          </h2>
          <p className="text-sm text-stone">Messungen der letzten 90 Tage.</p>
        </div>
        {weight.length === 0 ? (
          <p className="text-stone">
            Noch keine Messung.{" "}
            <Link href="/metrics" className="font-medium text-moss hover:underline">
              Gewicht erfassen
            </Link>
          </p>
        ) : (
          <>
            <LineChart
              caption="Gewicht in Kilogramm, letzte 90 Tage"
              formatValue={(v) => `${v} kg`}
              points={weight.map((p) => ({ x: p.date, y: p.kg, title: `${formatDate(p.date)}: ${p.kg} kg, 7-Tage-Mittel ${p.mean7} kg` }))}
            />
            <p className="text-sm text-stone">
              7-Tage-Mittel zuletzt <span className="font-semibold text-ink tabular-nums">{weight[weight.length - 1].mean7} kg</span>
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="leistung" className="mt-10 flex flex-col gap-3">
        <h2 id="leistung" className="text-2xl font-semibold">
          Leistungswerte
        </h2>
        {metrics.length === 0 ? (
          <p className="text-stone">
            Noch keine Leistungswerte.{" "}
            <Link href="/metrics#leistung" className="font-medium text-moss hover:underline">
              Wert erfassen
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-mist">
            {metrics.map((m) => (
              <li key={m.metric} className="flex items-center gap-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{METRIC_INFO[m.metric as PerformanceMetric]?.label ?? m.metric}</span>
                  <span className="block text-sm text-stone">{formatDate(m.measuredOn)}</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-2xl font-semibold tabular-nums">
                    {m.latest} {m.unit}
                  </span>
                  <span className="block text-sm text-stone tabular-nums">
                    {m.delta === null ? "erste Messung" : `${m.delta > 0 ? "+" : ""}${m.delta} ${m.unit} seit letzter Messung`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
