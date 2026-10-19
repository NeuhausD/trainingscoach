import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { utcToLocalParts } from "@/lib/domain/time";
import { getActivity } from "@/lib/master-data/activities";
import { listEquipment } from "@/lib/master-data/equipment";
import { listSports } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { updateActivityAction } from "../../actions";
import { ActivityForm } from "../../activity-form";

export const metadata = { title: "Aktivität bearbeiten" };

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [activity, sports, equipment] = await Promise.all([getActivity(user.id, id), listSports(user.id), listEquipment(user.id)]);
  if (!activity) notFound();
  const local = utcToLocalParts(activity.startedAt);

  return (
    <>
      <PageHeader title="Bearbeiten" subtitle={activity.title ?? activity.sportName ?? undefined} backHref={`/activities/${id}`} backLabel="Aktivität" />
      <ActivityForm
        action={updateActivityAction}
        sports={sports.filter((s) => s.active || s.id === activity.sportId).map((s) => ({ id: s.id, name: s.name, category: s.category }))}
        equipment={equipment.filter((e) => !e.retired || e.id === activity.equipmentId).map((e) => ({ id: e.id, name: e.name, kind: e.kind }))}
        defaults={{
          id: activity.id,
          sportId: activity.sportId ?? "",
          equipmentId: activity.equipmentId,
          date: local.date,
          time: local.time,
          durationMin: Math.round(activity.durationS / 60),
          rpe: activity.rpe,
          title: activity.title ?? "",
          notes: activity.notes ?? "",
          distanceKm: activity.distanceM ? String(Math.round(Number(activity.distanceM) / 10) / 100) : "",
          elevationM: activity.elevationGainM ? String(Math.round(Number(activity.elevationGainM))) : "",
          avgHr: activity.avgHr ? String(activity.avgHr) : "",
          maxHr: activity.maxHr ? String(activity.maxHr) : "",
        }}
      />
    </>
  );
}
