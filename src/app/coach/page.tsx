import { PageHeader } from "@/components/page-header";
import { panel } from "@/components/ui";
import { INTENSITY_LABELS } from "@/lib/domain/intensity";
import { formatDate, formatDateTime, utcToLocalParts } from "@/lib/domain/time";
import { listSuggestions, readMeta, type SuggestionRow } from "@/lib/master-data/suggestions";
import { requireUser } from "@/lib/users";
import { PlanForm } from "./plan-form";
import { setStatusAction } from "./actions";

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
  const rows = await listSuggestions(user.id, today);
  const planMeta = rows.map((r) => readMeta(r).plan).find((p) => p);
  const days = groupByDay(rows);
  const weekdayFmt: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

  return (
    <>
      <PageHeader title="Coach" subtitle="Wochenplan aus Saison, Belastung, Wetter und Eisenhorn. Nur Aggregate gehen an das Modell." />
      <PlanForm hasPlan={rows.length > 0} />

      {planMeta && (
        <section className="mt-8" aria-labelledby="woche">
          <h2 id="woche" className="text-2xl font-semibold">
            Diese Woche
          </h2>
          <p className="mt-1 text-stone">{planMeta.summary}</p>
          <p className="mt-1 text-sm text-stone">
            Ziel-Belastung <span className="font-semibold text-ink tabular-nums">{Math.round(planMeta.weeklyLoadTarget)}</span>, erstellt{" "}
            {formatDateTime(new Date(planMeta.generatedAt))}
          </p>
        </section>
      )}

      {rows.length === 0 ? (
        <p className={`${panel} mt-8 text-stone`}>Noch kein Plan. «Woche planen» erstellt Vorschläge für die nächsten sieben Tage.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {days.map(({ day, rows }) => (
            <section key={day} aria-labelledby={`tag-${day}`}>
              <h3 id={`tag-${day}`} className="border-b-2 border-ink pb-1 text-lg font-semibold">
                {formatDate(day, weekdayFmt)}
                {day === today && <span className="ml-2 text-sm font-medium text-moss">heute</span>}
              </h3>
              <ul className="divide-y divide-mist">
                {rows.map((r) => {
                  const meta = readMeta(r);
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
                      <div className="mt-3 flex items-center gap-4">
                        <span className={`rounded-control px-2 py-0.5 text-xs font-semibold ${r.status === "accepted" || r.status === "done" ? "bg-moss/10 text-moss" : "bg-mist/60 text-stone"}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                        {r.status !== "accepted" && r.status !== "done" && (
                          <StatusButton id={r.id} status="accepted">
                            Annehmen
                          </StatusButton>
                        )}
                        {r.status !== "skipped" && r.status !== "done" && (
                          <StatusButton id={r.id} status="skipped">
                            Überspringen
                          </StatusButton>
                        )}
                        {(r.status === "accepted" || r.status === "skipped") && (
                          <StatusButton id={r.id} status="suggested">
                            Zurücksetzen
                          </StatusButton>
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
