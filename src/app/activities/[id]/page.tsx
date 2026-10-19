import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { buttonSecondary, panel, successBox } from "@/components/ui";
import { feasibleExercises } from "@/lib/domain/eisenhorn-catalog";
import { MUSCLE_LABELS } from "@/lib/domain/eisenhorn-catalog";
import { RPE_LABELS } from "@/lib/domain/rpe";
import { describeSet, setVolumeKg, setsByMuscle } from "@/lib/domain/strength";
import { formatDateTime, formatDuration } from "@/lib/domain/time";
import { getActivity, listSets } from "@/lib/master-data/activities";
import { getEquipment } from "@/lib/master-data/equipment";
import { countCatalog, listExercises } from "@/lib/master-data/exercises";
import { getSport } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { addSetAction, deleteActivityAction, deleteSetAction, seedCatalogAction } from "../actions";
import { SetForm } from "../set-form";

export const metadata = { title: "Aktivität" };

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; exercise?: string }>;
}) {
  const user = await requireUser();
  const [{ id }, { saved, exercise: lastExercise }] = await Promise.all([params, searchParams]);
  const activity = await getActivity(user.id, id);
  if (!activity) notFound();

  const [sport, equipment, sets, exercises, catalogCount] = await Promise.all([
    activity.sportId ? getSport(user.id, activity.sportId) : null,
    activity.equipmentId ? getEquipment(user.id, activity.equipmentId) : null,
    listSets(activity.id),
    listExercises(user.id),
    countCatalog(),
  ]);
  const isStrength = sport?.category === "strength" || sets.length > 0;
  const isEisenhorn = equipment?.kind === "home_gym";
  const settings = equipment?.settings ?? null;
  const feasibleNumbers = new Set(feasibleExercises(settings).map((e) => String(e.number)));
  const options = exercises.filter((e) => {
    if (e.source === "manual") return true;
    if (isEisenhorn) return e.source === "eisenhorn" && feasibleNumbers.has(e.externalRef ?? "");
    return e.source === "free-exercise-db";
  });
  const muscles = setsByMuscle(
    sets.map((s) => ({ reps: s.reps, primaryMuscles: s.exercise?.primaryMuscles ?? [], secondaryMuscles: s.exercise?.secondaryMuscles ?? [] })),
  );
  const muscleSummary = Object.entries(muscles)
    .sort(([, a], [, b]) => b - a)
    .map(([m, n]) => `${MUSCLE_LABELS[m] ?? m} ${n}`)
    .join(", ");
  const facts: [string, string][] = [
    ["Wann", formatDateTime(activity.startedAt)],
    ["Dauer", formatDuration(activity.durationS)],
    ["Anstrengung", activity.rpe ? `RPE ${activity.rpe}, ${RPE_LABELS[activity.rpe]}` : "nicht erfasst"],
    ["Belastung", activity.trainingLoad ? `${Math.round(Number(activity.trainingLoad))} Punkte` : "–"],
  ];
  if (activity.equipmentName) facts.push(["Gerät", activity.equipmentName]);
  if (activity.distanceM) facts.push(["Distanz", `${(Number(activity.distanceM) / 1000).toFixed(1)} km`]);
  if (activity.elevationGainM) facts.push(["Höhenmeter", `${Math.round(Number(activity.elevationGainM))} m`]);
  if (activity.avgHr) facts.push(["Puls", `Ø ${activity.avgHr}${activity.maxHr ? `, max. ${activity.maxHr}` : ""}`]);
  if (activity.avgPowerW) facts.push(["Leistung", `Ø ${activity.avgPowerW} W`]);
  const stravaId = activity.source === "strava" && activity.externalId ? activity.externalId.replace("strava:", "") : null;

  return (
    <>
      <PageHeader
        title={activity.title ?? activity.sportName ?? "Training"}
        subtitle={activity.title ? (activity.sportName ?? undefined) : undefined}
        backHref="/activities"
        backLabel="Aktivitäten"
        action={
          <Link href={`/activities/${activity.id}/edit`} className={buttonSecondary}>
            Bearbeiten
          </Link>
        }
      />
      {saved && (
        <p role="status" aria-live="polite" className={`${successBox} mb-4`}>
          Gespeichert.
        </p>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-sm text-stone">{k}</dt>
            <dd className="font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {activity.notes && <p className="mt-4 whitespace-pre-line text-stone">{activity.notes}</p>}
      {stravaId && (
        <p className="mt-4 text-sm text-stone">
          Aus Strava importiert.{" "}
          <a href={`https://www.strava.com/activities/${stravaId}`} className="font-medium text-moss hover:underline" rel="noreferrer" target="_blank">
            Auf Strava ansehen
          </a>
        </p>
      )}

      {isStrength && (
        <section id="saetze" className="mt-10 flex flex-col gap-4" aria-labelledby="saetze-titel">
          <div>
            <h2 id="saetze-titel" className="text-2xl font-semibold">
              Sätze
            </h2>
            {muscleSummary && <p className="text-sm text-stone">Muskelgruppen: {muscleSummary}</p>}
          </div>
          {sets.length > 0 && (
            <ol className="divide-y divide-mist">
              {sets.map((s) => {
                const volume = setVolumeKg({ reps: s.reps, weightKg: s.weightKg === null ? null : Number(s.weightKg), level: s.level === null ? null : Number(s.level) }, settings);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-sm text-stone tabular-nums">{s.position}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.exercise?.name ?? "Übung"}</span>
                      <span className="block text-sm text-stone">
                        {describeSet({ reps: s.reps, weightKg: s.weightKg === null ? null : Number(s.weightKg), level: s.level === null ? null : Number(s.level) }, settings)}
                        {s.rpe ? `, RPE ${s.rpe}` : ""}
                        {volume !== null ? `, ${volume} kg Volumen` : ""}
                      </span>
                    </span>
                    <form action={deleteSetAction}>
                      <input type="hidden" name="activityId" value={activity.id} />
                      <input type="hidden" name="setId" value={s.id} />
                      <button type="submit" className="text-sm text-stone hover:text-danger" aria-label={`Satz ${s.position} löschen`}>
                        Löschen
                      </button>
                    </form>
                  </li>
                );
              })}
            </ol>
          )}
          {catalogCount === 0 ? (
            <form action={seedCatalogAction} className={`${panel} flex flex-col gap-3`}>
              <input type="hidden" name="back" value={`/activities/${activity.id}`} />
              <p className="text-stone">Der Übungskatalog ist noch leer. Lege Eisenhorn- und Studio-Übungen in einem Schritt an.</p>
              <button type="submit" className={buttonSecondary}>
                Übungskatalog anlegen
              </button>
            </form>
          ) : (
            <SetForm
              action={addSetAction}
              activityId={activity.id}
              exercises={options.map((e) => ({ id: e.id, name: e.name, source: e.source, primaryMuscles: e.primaryMuscles }))}
              defaultExerciseId={lastExercise ?? sets.at(-1)?.exerciseId ?? null}
              useLevels={isEisenhorn}
            />
          )}
        </section>
      )}

      <form action={deleteActivityAction} className="mt-12 border-t border-mist pt-6">
        <input type="hidden" name="id" value={activity.id} />
        <DeleteButton confirmText="Aktivität samt Sätzen wirklich löschen?">Aktivität löschen</DeleteButton>
      </form>
    </>
  );
}
