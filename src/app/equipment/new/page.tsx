import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/users";
import { createEquipmentAction } from "../actions";
import { EquipmentForm } from "../equipment-form";

export const metadata = { title: "Neues Gerät – Trainingscoach" };

export default async function NewEquipmentPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Neues Gerät" backHref="/equipment" backLabel="Sportgeräte" />
      <EquipmentForm action={createEquipmentAction} />
    </main>
  );
}
