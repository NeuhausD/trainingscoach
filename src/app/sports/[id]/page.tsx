import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { successBox } from "@/components/ui";
import { seasonForDate } from "@/lib/domain/season";
import { getSport } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { deleteSportAction, updateSportAction } from "../actions";
import { SportForm } from "../sport-form";

export const metadata = { title: "Sportart" };

export default async function SportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const sport = await getSport(user.id, id);
  if (!sport) notFound();

  return (
    <>
      <PageHeader title={sport.name} backHref="/sports" backLabel="Sportarten" />
      {saved && (
        <p role="status" aria-live="polite" className={`${successBox} mb-4`}>
          Gespeichert.
        </p>
      )}
      <SportForm action={updateSportAction} sport={sport} currentSeason={seasonForDate(new Date())} />
      <form action={deleteSportAction} className="mt-12 border-t border-mist pt-6">
        <input type="hidden" name="id" value={sport.id} />
        <DeleteButton confirmText={`Sportart «${sport.name}» wirklich löschen?`}>Sportart löschen</DeleteButton>
        <p className="mt-2 text-sm text-stone">
          Aktivitäten dieser Sportart bleiben erhalten und verlieren nur die Zuordnung.
        </p>
      </form>
    </>
  );
}
