import { PageHeader } from "@/components/page-header";
import { sortByWeightForSeason } from "@/lib/domain/preferences";
import { seasonForDate } from "@/lib/domain/season";
import { utcToLocalParts } from "@/lib/domain/time";
import { lastActivityForSport } from "@/lib/master-data/activities";
import { listEquipment } from "@/lib/master-data/equipment";
import { listSports } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { createActivityAction } from "../actions";
import { ActivityForm } from "../activity-form";

export const metadata = { title: "Training erfassen" };

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ sport?: string }> }) {
  const user = await requireUser();
  const { sport: sportParam } = await searchParams;
  const now = new Date();
  const season = seasonForDate(now);
  const [sports, equipment] = await Promise.all([listSports(user.id), listEquipment(user.id)]);
  const activeSports = sortByWeightForSeason(
    sports.filter((s) => s.active),
    season,
  );
  const defaultSport = activeSports.find((s) => s.id === sportParam) ?? activeSports[0];
  const last = defaultSport ? await lastActivityForSport(user.id, defaultSport.id) : null;
  const local = utcToLocalParts(now);
  // Startzeit auf 5 Minuten runden, damit die Eingabe selten angepasst werden muss
  const [h, m] = local.time.split(":").map(Number);
  const rounded = `${String(h).padStart(2, "0")}:${String(Math.floor(m / 5) * 5).padStart(2, "0")}`;

  return (
    <>
      <PageHeader title="Training erfassen" backHref="/activities" backLabel="Aktivitäten" />
      {activeSports.length === 0 ? (
        <p className="text-stone">Zuerst unter Sportarten mindestens eine aktive Sportart anlegen.</p>
      ) : (
        <ActivityForm
          action={createActivityAction}
          sports={activeSports.map((s) => ({ id: s.id, name: s.name, category: s.category }))}
          equipment={equipment.filter((e) => !e.retired).map((e) => ({ id: e.id, name: e.name, kind: e.kind }))}
          defaults={{
            sportId: defaultSport?.id ?? "",
            equipmentId: last?.equipmentId ?? null,
            date: local.date,
            time: rounded,
            durationMin: last ? Math.round(last.durationS / 60) : 60,
            rpe: last?.rpe ?? null,
            title: "",
            notes: "",
            distanceKm: "",
            elevationM: "",
            avgHr: "",
            maxHr: "",
          }}
        />
      )}
    </>
  );
}
