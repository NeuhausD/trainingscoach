import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/users";
import { createEquipmentAction } from "../actions";
import { EquipmentForm } from "../equipment-form";

export const metadata = { title: "Neues Gerät" };

export default async function NewEquipmentPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Neues Gerät" backHref="/equipment" backLabel="Geräte" />
      <EquipmentForm action={createEquipmentAction} />
    </>
  );
}
