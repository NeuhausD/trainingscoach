import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonPrimary, panel } from "@/components/ui";
import { RPE_LABELS } from "@/lib/domain/rpe";
import { formatDateTime, formatDuration } from "@/lib/domain/time";
import { listActivities } from "@/lib/master-data/activities";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Aktivitäten" };

export default async function ActivitiesPage() {
  const user = await requireUser();
  const activities = await listActivities(user.id, { limit: 60 });

  return (
    <>
      <PageHeader
        title="Aktivitäten"
        subtitle="Manuell erfasst; Strava-Import folgt in Phase P3"
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
        <ul className="divide-y divide-mist">
          {activities.map((a) => (
            <li key={a.id}>
              <Link href={`/activities/${a.id}`} className="flex items-center gap-4 py-4 hover:text-moss">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold">{a.title ?? a.sportName ?? "Training"}</span>
                  <span className="block text-sm text-stone">
                    {[formatDateTime(a.startedAt), a.title ? a.sportName : null, a.equipmentName].filter(Boolean).join(", ")}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-2xl font-semibold tabular-nums">{formatDuration(a.durationS)}</span>
                  <span className="block text-sm text-stone">
                    {a.rpe ? `RPE ${a.rpe}, ${RPE_LABELS[a.rpe]}` : "ohne RPE"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
