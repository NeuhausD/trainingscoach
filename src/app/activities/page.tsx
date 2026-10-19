import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonPrimary, panel } from "@/components/ui";
import { formatHours, groupByMonth } from "@/lib/domain/progress";
import { RPE_LABELS } from "@/lib/domain/rpe";
import { formatDateTime, formatDuration } from "@/lib/domain/time";
import { listActivities } from "@/lib/master-data/activities";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Aktivitäten" };

export default async function ActivitiesPage() {
  const user = await requireUser();
  const activities = await listActivities(user.id);
  const months = groupByMonth(activities);

  return (
    <>
      <PageHeader
        title="Aktivitäten"
        subtitle="Manuell erfasst oder aus Strava importiert"
        action={
          <Link href="/activities/new" className={buttonPrimary}>
            Erfassen
          </Link>
        }
      />
      {activities.length === 0 ? (
        <p className={`${panel} text-stone`}>
          Noch keine Aktivität. Ein Eishockey-Abend oder ein Studio-Training ist in 30 Sekunden erfasst.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {months.map((month) => (
            <section key={month.key} aria-labelledby={`monat-${month.key}`}>
              <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-2">
                <h2 id={`monat-${month.key}`} className="text-2xl font-semibold">
                  {month.label}
                </h2>
                <span className="text-sm text-stone tabular-nums">
                  {month.totals.sessions} Einheiten, {formatHours(month.totals.seconds)}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone">
                {month.bySport.map((s) => `${s.sport} ${s.sessions} × ${formatHours(s.seconds)}`).join(", ")}
              </p>
              <ul className="mt-2 divide-y divide-mist">
                {month.activities.map((a) => (
                  <li key={a.id}>
                    <Link href={`/activities/${a.id}`} className="flex items-center gap-4 py-3 hover:text-moss">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{a.title ?? a.sportName ?? "Training"}</span>
                        <span className="block text-sm text-stone">
                          {[formatDateTime(a.startedAt), a.title ? a.sportName : null, a.equipmentName, a.source === "strava" ? "Strava" : null]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-2xl font-semibold tabular-nums">{formatDuration(a.durationS)}</span>
                        <span className="block text-sm text-stone">{a.rpe ? `RPE ${a.rpe}, ${RPE_LABELS[a.rpe]}` : Number(a.trainingLoad) > 0 ? `Belastung ${Math.round(Number(a.trainingLoad))}` : ""}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
