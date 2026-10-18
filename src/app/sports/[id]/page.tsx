import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { seasonForDate } from "@/lib/domain/season";
import { getSport } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { deleteSportAction, updateSportAction } from "../actions";
import { SportForm } from "../sport-form";

export const metadata = { title: "Sportart – Trainingscoach" };

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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title={sport.name} backHref="/sports" backLabel="Sportarten" />
      {saved && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Gespeichert.
        </p>
      )}
      <SportForm action={updateSportAction} sport={sport} currentSeason={seasonForDate(new Date())} />
      <form action={deleteSportAction} className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <input type="hidden" name="id" value={sport.id} />
        <DeleteButton confirmText={`Sportart «${sport.name}» wirklich löschen?`}>Sportart löschen</DeleteButton>
        <p className="mt-2 text-xs text-zinc-500">
          Aktivitäten dieser Sportart bleiben erhalten und verlieren nur die Zuordnung.
        </p>
      </form>
    </main>
  );
}
