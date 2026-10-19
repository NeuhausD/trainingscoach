import { PageHeader } from "@/components/page-header";
import { listStravaGear } from "@/lib/strava/sync";
import { requireUser } from "@/lib/users";
import { createEquipmentAction } from "../actions";
import { EquipmentForm } from "../equipment-form";

export const metadata = { title: "Neues Gerät" };

export default async function NewEquipmentPage() {
  const user = await requireUser();
  const stravaGear = await listStravaGear(user.id);
  return (
    <>
      <PageHeader title="Neues Gerät" backHref="/equipment" backLabel="Geräte" />
      <EquipmentForm action={createEquipmentAction} stravaGear={stravaGear} />
    </>
  );
}
