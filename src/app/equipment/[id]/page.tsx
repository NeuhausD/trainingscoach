import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { getEquipment } from "@/lib/master-data/equipment";
import { listStravaGear } from "@/lib/strava/sync";
import { requireUser } from "@/lib/users";
import { deleteEquipmentAction, updateEquipmentAction } from "../actions";
import { EquipmentForm } from "../equipment-form";

export const metadata = { title: "Gerät" };

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [item, stravaGear] = await Promise.all([getEquipment(user.id, id), listStravaGear(user.id)]);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={item.name} backHref="/equipment" backLabel="Geräte" />
      <EquipmentForm action={updateEquipmentAction} item={item} stravaGear={stravaGear} />
      <form action={deleteEquipmentAction} className="mt-12 border-t border-mist pt-6">
        <input type="hidden" name="id" value={item.id} />
        <DeleteButton confirmText={`Gerät «${item.name}» wirklich löschen?`}>Gerät löschen</DeleteButton>
        <p className="mt-2 text-sm text-stone">
          Ein nicht mehr genutztes Gerät besser als ausgemustert markieren, damit alte Aktivitäten die Zuordnung
          behalten.
        </p>
      </form>
    </>
  );
}
