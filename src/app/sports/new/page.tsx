import { PageHeader } from "@/components/page-header";
import { seasonForDate } from "@/lib/domain/season";
import { requireUser } from "@/lib/users";
import { createSportAction } from "../actions";
import { SportForm } from "../sport-form";

export const metadata = { title: "Neue Sportart – Trainingscoach" };

export default async function NewSportPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Neue Sportart" backHref="/sports" backLabel="Sportarten" />
      <SportForm action={createSportAction} currentSeason={seasonForDate(new Date())} />
    </main>
  );
}
