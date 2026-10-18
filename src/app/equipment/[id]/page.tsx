import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { getEquipment } from "@/lib/master-data/equipment";
import { requireUser } from "@/lib/users";
import { deleteEquipmentAction, updateEquipmentAction } from "../actions";
import { EquipmentForm } from "../equipment-form";

export const metadata = { title: "Gerät – Trainingscoach" };

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const item = await getEquipment(user.id, id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title={item.name} backHref="/equipment" backLabel="Sportgeräte" />
      <EquipmentForm action={updateEquipmentAction} item={item} />
      <form action={deleteEquipmentAction} className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <input type="hidden" name="id" value={item.id} />
        <DeleteButton confirmText={`Gerät «${item.name}» wirklich löschen?`}>Gerät löschen</DeleteButton>
        <p className="mt-2 text-xs text-zinc-500">
          Tipp: Ein nicht mehr genutztes Gerät besser als «ausgemustert» markieren, damit alte Aktivitäten die Zuordnung
          behalten.
        </p>
      </form>
    </main>
  );
}
