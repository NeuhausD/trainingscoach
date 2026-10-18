import Link from "next/link";
import { SEASONS } from "@/db";
import { PageHeader } from "@/components/page-header";
import { buttonPrimary, buttonSecondary, card, hint } from "@/components/ui";
import { sortByWeightForSeason, weightLabel } from "@/lib/domain/preferences";
import { SEASON_LABELS, seasonForDate } from "@/lib/domain/season";
import { CATEGORY_LABELS, listSports } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { seedMasterDataAction } from "./actions";

export const metadata = { title: "Sportarten – Trainingscoach" };

export default async function SportsPage() {
  const user = await requireUser();
  const season = seasonForDate(new Date());
  const sports = sortByWeightForSeason(await listSports(user.id), season);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Sportarten"
        subtitle={`Sortiert nach Gewichtung für ${SEASON_LABELS[season]}`}
        action={
          <Link href="/sports/new" className={buttonSecondary}>
            Neu
          </Link>
        }
      />

      {sports.length === 0 ? (
        <section className={`${card} flex flex-col gap-4`}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Noch keine Sportarten. Lege die bekannten Sportarten (Mountainbike, Jogging, Kraft Studio, Kraft Eisenhorn,
            Eishockey) samt saisonaler Gewichtung und die beiden Bikes in einem Schritt an.
          </p>
          <form action={seedMasterDataAction}>
            <button type="submit" className={buttonPrimary}>
              Stammdaten anlegen
            </button>
          </form>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {sports.map((sport) => (
            <li key={sport.id}>
              <Link href={`/sports/${sport.id}`} className={`${card} block hover:border-zinc-400 dark:hover:border-zinc-600`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">
                    {sport.name}
                    {!sport.active && <span className="ml-2 text-xs text-zinc-500">inaktiv</span>}
                  </h2>
                  <span className="text-xs text-zinc-500">{CATEGORY_LABELS[sport.category]}</span>
                </div>
                <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {SEASONS.map((s) => {
                    const p = sport.preferences.find((x) => x.season === s)!;
                    const current = s === season;
                    return (
                      <div
                        key={s}
                        className={`rounded-md px-1 py-2 ${current ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800"}`}
                      >
                        <dt className="text-[11px] uppercase tracking-wide opacity-70">{SEASON_LABELS[s]}</dt>
                        <dd className="text-lg font-semibold leading-tight">{p.weight}</dd>
                        <dd className="text-[11px] opacity-70">
                          {p.targetSessionsPerWeek != null ? `${p.targetSessionsPerWeek}×/Wo` : weightLabel(p.weight)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className={`${hint} mt-6`}>Gewichtung 0 = nie, 10 = Schwerpunkt. Die aktuelle Saison ist hervorgehoben.</p>
    </main>
  );
}
