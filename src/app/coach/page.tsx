import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonSecondary, input, panel } from "@/components/ui";
import { INTENSITY_LABELS } from "@/lib/domain/intensity";
import { planVsActual, shiftDay } from "@/lib/domain/plan-match";
import { sinceDays, weekStartKey } from "@/lib/domain/progress";
import { formatDate, formatDateTime, utcToLocalParts } from "@/lib/domain/time";
import { listActivities } from "@/lib/master-data/activities";
import { listSuggestions, readMeta, type SuggestionRow } from "@/lib/master-data/suggestions";
import { requireUser } from "@/lib/users";
import { PlanForm } from "./plan-form";
import { moveSuggestionAction, reconcileAction, setStatusAction } from "./actions";

export const metadata = { title: "Coach" };
export const maxDuration = 90;

const STATUS_LABEL: Record<SuggestionRow["status"], string> = {
  suggested: "Vorschlag",
  accepted: "Angenommen",
  done: "Erledigt",
  skipped: "Übersprungen",
};

function groupByDay(rows: SuggestionRow[]): { day: string; rows: SuggestionRow[] }[] {
  const map = new Map<string, SuggestionRow[]>();
  for (const r of rows) map.set(r.plannedOn, [...(map.get(r.plannedOn) ?? []), r]);
  return [...map.entries()].map(([day, rows]) => ({ day, rows }));
}

function StatusButton({ id, status, children }: { id: string; status: SuggestionRow["status"]; children: React.ReactNode }) {
  return (
    <form action={setStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="text-sm font-medium text-moss hover:underline">
        {children}
      </button>
    </form>
  );
}

export default async function CoachPage() {
  const user = await requireUser();
  const now = new Date();
  const today = utcToLocalParts(now).date;
  const weekStart = weekStartKey(now);
  const [rows, weekActivities] = await Promise.all([listSuggestions(user.id, weekStart), listActivities(user.id, { since: sinceDays(now, 7) })]);
  const planMeta = rows.map((r) => readMeta(r).plan).find((p) => p);
  const week = planVsActual(
    weekStart,
    rows.map((r) => ({ ...r, sportName: r.sportName })),
    weekActivities,
  );
  const hasWeekData = week.planned.sessions > 0 || week.actual.sessions > 0;
  const days = groupByDay(rows);
  const weekdayFmt: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
  const activityById = new Map(weekActivities.map((a) => [a.id, a]));
  const maxMin = Math.max(1, ...week.bySport.map((s) => Math.max(s.plannedMin, s.actualMin)));

  return (
    <>
      <PageHeader title="Coach" subtitle="Wochenplan aus Saison, Belastung, Wetter und Eisenhorn. Nur Aggregate gehen an das Modell." />
      <PlanForm hasPlan={rows.some((r) => r.plannedOn >= today)} />

      <section className="mt-8" aria-labelledby="woche">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="woche" className="text-2xl font-semibold">
            Diese Woche
          </h2>
          <span className="text-sm text-stone">
            {formatDate(week.weekStart, { day: "numeric", month: "short" })} bis {formatDate(week.weekEnd, { day: "numeric", month: "short" })}
          </span>
        </div>
        {planMeta && <p className="mt-1 text-stone">{planMeta.summary}</p>}
        {hasWeekData ? (
          <>
            <p className="mt-2 text-stone">
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{week.done.sessions}</span> von{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{week.planned.sessions}</span> geplanten Einheiten erledigt,{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{week.actual.minutes}</span> min trainiert von{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{week.planned.minutes}</span> min geplant
              {planMeta ? `, Ziel-Belastung ${Math.round(planMeta.weeklyLoadTarget)}` : ""}.
            </p>
            <figure className="mt-4">
              <ol className="flex flex-col gap-2" aria-label="Trainierte Minuten gegenüber geplanten Minuten je Sportart">
                {week.bySport.map((s) => {
                  const planW = Math.round((s.plannedMin / maxMin) * 100);
                  const actW = Math.round((s.actualMin / maxMin) * 100);
                  return (
                    <li key={s.sport} className="grid grid-cols-[7rem_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr]">
                      <span className="truncate text-sm font-medium">{s.sport}</span>
                      <span className="flex items-center gap-3">
                        <span className="relative h-5 flex-1" title={`${s.sport}: ${s.actualMin} min trainiert, ${s.plannedMin} min geplant`}>
                          <span className="absolute inset-y-0 left-0 rounded-r-[4px] border border-stone/40" style={{ width: `${Math.max(planW, s.plannedMin > 0 ? 2 : 0)}%` }} aria-hidden="true" />
                          <span className="absolute inset-y-1 left-0 rounded-r-[4px] bg-moss" style={{ width: `${Math.max(actW, s.actualMin > 0 ? 2 : 0)}%` }} aria-hidden="true" />
                        </span>
                        <span className="w-28 shrink-0 text-sm text-stone tabular-nums">
                          {s.actualMin} / {s.plannedMin} min
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <figcaption className="mt-2 text-sm text-stone">Ausgefüllt: trainiert. Rahmen: geplant.</figcaption>
            </figure>
          </>
        ) : (
          <p className="mt-2 text-stone">Noch nichts geplant oder trainiert in dieser Woche.</p>
        )}
        <form action={reconcileAction} className="mt-3">
          <button type="submit" className="text-sm font-medium text-moss hover:underline">
            Mit Aktivitäten abgleichen
          </button>
          <span className="ml-2 text-sm text-stone">Neue Aktivitäten erledigen passende Vorschläge automatisch.</span>
        </form>
      </section>

      {rows.length === 0 ? (
        <p className={`${panel} mt-8 text-stone`}>Noch kein Plan. «Woche planen» erstellt Vorschläge für die nächsten sieben Tage.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {days.map(({ day, rows }) => (
            <section key={day} aria-labelledby={`tag-${day}`} className={day < today ? "opacity-75" : ""}>
              <h3 id={`tag-${day}`} className="border-b-2 border-ink pb-1 text-lg font-semibold">
                {formatDate(day, weekdayFmt)}
                {day === today && <span className="ml-2 text-sm font-medium text-moss">heute</span>}
              </h3>
              <ul className="divide-y divide-mist">
                {rows.map((r) => {
                  const meta = readMeta(r);
                  const done = activityById.get(r.completedActivityId ?? "");
                  const muted = r.status === "skipped";
                  return (
                    <li key={r.id} className={`py-4 ${muted ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm text-stone">
                            {r.sportName ?? "Sportart offen"}
                            {meta.equipment ? `, ${meta.equipment}` : ""}
                            {meta.quick ? ", zwischendurch" : ""}
                          </p>
                          <h4 className="text-xl font-semibold leading-tight">{r.title}</h4>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-3xl font-semibold leading-none tabular-nums">
                            {r.durationMin}
                            <span className="text-base font-medium text-stone"> min</span>
                          </p>
                          <p className="text-sm text-stone">{INTENSITY_LABELS[r.intensity]}</p>
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-line">{r.description}</p>
                      {meta.quick && <p className="mt-1 text-sm text-stone">Muskeln: {meta.quick.muscles.join(", ")}</p>}
                      {meta.rationale && <p className="mt-1 text-sm text-stone">Warum: {meta.rationale}</p>}
                      {meta.variants.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-moss">
                            {meta.variants.length === 1 ? "1 Variante" : `${meta.variants.length} Varianten`}
                          </summary>
                          <ul className="mt-2 flex flex-col gap-2 border-l-2 border-mist pl-3">
                            {meta.variants.map((v) => (
                              <li key={v.label}>
                                <span className="font-medium">
                                  {v.label} ({v.durationMin} min)
                                </span>
                                <span className="block text-sm text-stone">{v.description}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {r.status === "done" && done && (
                        <p className="mt-2 text-sm text-stone">
                          Erledigt mit{" "}
                          <Link href={`/activities/${done.id}`} className="font-medium text-moss hover:underline">
                            {done.title ?? done.sportName ?? "Aktivität"}
                          </Link>
                          , {formatDateTime(done.startedAt)}.
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className={`rounded-control px-2 py-0.5 text-xs font-semibold ${r.status === "accepted" || r.status === "done" ? "bg-moss/10 text-moss" : "bg-mist/60 text-stone"}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                        {r.status === "suggested" && (
                          <StatusButton id={r.id} status="accepted">
                            Annehmen
                          </StatusButton>
                        )}
                        {r.status !== "done" && (
                          <StatusButton id={r.id} status="done">
                            Erledigt
                          </StatusButton>
                        )}
                        {r.status !== "skipped" && r.status !== "done" && (
                          <StatusButton id={r.id} status="skipped">
                            Überspringen
                          </StatusButton>
                        )}
                        {r.status !== "suggested" && (
                          <StatusButton id={r.id} status="suggested">
                            Zurücksetzen
                          </StatusButton>
                        )}
                        {r.status !== "done" && (
                          <details className="w-full sm:w-auto">
                            <summary className="cursor-pointer text-sm font-medium text-moss">Verschieben</summary>
                            <form action={moveSuggestionAction} className="mt-2 flex items-end gap-2">
                              <input type="hidden" name="id" value={r.id} />
                              <label className="flex-1">
                                <span className="block text-sm font-medium">Neuer Tag</span>
                                <input type="date" name="plannedOn" defaultValue={shiftDay(r.plannedOn, 1)} min={today} required className={`${input} mt-1`} />
                              </label>
                              <button type="submit" className={buttonSecondary}>
                                Verschieben
                              </button>
                            </form>
                          </details>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
