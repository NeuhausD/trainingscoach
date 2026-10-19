import { PageHeader } from "@/components/page-header";
import { successBox } from "@/components/ui";
import { METRIC_INFO, weightTrend, type PerformanceMetric } from "@/lib/domain/metrics";
import { formatDate, utcToLocalParts } from "@/lib/domain/time";
import { listBodyMetrics, listPerformanceMetrics } from "@/lib/master-data/metrics";
import { requireUser } from "@/lib/users";
import { createBodyMetricAction, createPerformanceMetricAction, deleteBodyMetricAction, deletePerformanceMetricAction } from "./actions";
import { BodyMetricForm, PerformanceMetricForm } from "./metric-forms";

export const metadata = { title: "Werte" };

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const today = utcToLocalParts(new Date()).date;
  const [body, performance] = await Promise.all([listBodyMetrics(user.id, 30), listPerformanceMetrics(user.id)]);
  const trend = weightTrend(body.map((b) => ({ measuredOn: b.measuredOn, weightKg: b.weightKg === null ? null : Number(b.weightKg) })));
  const latestHr = body.find((b) => b.restingHr !== null)?.restingHr ?? null;
  const byMetric = new Map<PerformanceMetric, typeof performance>();
  for (const p of performance) {
    const list = byMetric.get(p.metric) ?? [];
    list.push(p);
    byMetric.set(p.metric, list);
  }

  return (
    <>
      <PageHeader title="Werte" subtitle="Körperwerte schnell notieren, Leistungswerte nach Tests festhalten" />
      {saved && (
        <p role="status" aria-live="polite" className={`${successBox} mb-4`}>
          Gespeichert.
        </p>
      )}

      <section aria-labelledby="koerper" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="koerper" className="text-2xl font-semibold">
            Körperwerte
          </h2>
          <p className="text-right text-sm text-stone">
            {trend !== null && (
              <span className="block">
                7-Tage-Mittel <span className="font-display text-2xl font-semibold text-ink tabular-nums">{trend} kg</span>
              </span>
            )}
            {latestHr !== null && <span className="block">Ruhepuls zuletzt {latestHr}</span>}
          </p>
        </div>
        <BodyMetricForm action={createBodyMetricAction} today={today} />
        {body.length > 0 && (
          <ul className="divide-y divide-mist">
            {body.slice(0, 14).map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2">
                <span className="w-28 shrink-0 text-sm text-stone">{formatDate(b.measuredOn, { day: "numeric", month: "short" })}</span>
                <span className="flex-1 tabular-nums">
                  {b.weightKg !== null && `${Number(b.weightKg)} kg`}
                  {b.weightKg !== null && b.restingHr !== null && ", "}
                  {b.restingHr !== null && `Puls ${b.restingHr}`}
                </span>
                <form action={deleteBodyMetricAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className="text-sm text-stone hover:text-danger" aria-label={`Eintrag vom ${formatDate(b.measuredOn)} löschen`}>
                    Löschen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="leistung" aria-labelledby="leistung-titel" className="mt-12 flex flex-col gap-4">
        <h2 id="leistung-titel" className="text-2xl font-semibold">
          Leistungswerte
        </h2>
        <PerformanceMetricForm action={createPerformanceMetricAction} today={today} />
        {byMetric.size > 0 && (
          <dl className="flex flex-col gap-4">
            {[...byMetric.entries()].map(([metric, rows]) => (
              <div key={metric}>
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{METRIC_INFO[metric].label}</span>
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    {Number(rows[0].value)} {rows[0].unit}
                  </span>
                </dt>
                <dd>
                  <ul className="divide-y divide-mist">
                    {rows.slice(0, 5).map((r) => (
                      <li key={r.id} className="flex items-center gap-3 py-1.5 text-sm">
                        <span className="w-28 shrink-0 text-stone">{formatDate(r.measuredOn, { day: "numeric", month: "short", year: "2-digit" })}</span>
                        <span className="flex-1 tabular-nums">
                          {Number(r.value)} {r.unit}
                          {r.notes && <span className="text-stone">, {r.notes}</span>}
                        </span>
                        <form action={deletePerformanceMetricAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="text-stone hover:text-danger" aria-label={`${METRIC_INFO[metric].label} vom ${formatDate(r.measuredOn)} löschen`}>
                            Löschen
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </>
  );
}
