import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SeasonProfile } from "@/components/season-profile";
import { buttonPrimary, buttonSecondary, panel } from "@/components/ui";
import { sortByWeightForSeason, weightLabel } from "@/lib/domain/preferences";
import { SEASON_LABELS, seasonForDate } from "@/lib/domain/season";
import { CATEGORY_LABELS, listSports } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";
import { seedMasterDataAction } from "./actions";

export const metadata = { title: "Sportarten" };

export default async function SportsPage() {
  const user = await requireUser();
  const season = seasonForDate(new Date());
  const sports = sortByWeightForSeason(await listSports(user.id), season);

  return (
    <>
      <PageHeader
        title="Sportarten"
        subtitle={`Nach Gewichtung für ${SEASON_LABELS[season]} sortiert`}
        action={
          <div className="flex gap-2">
            <Link href="/equipment" className={buttonSecondary}>
              Geräte
            </Link>
            <Link href="/sports/new" className={buttonSecondary}>
              Neue Sportart
            </Link>
          </div>
        }
      />

      {sports.length === 0 ? (
        <section className={`${panel} flex flex-col gap-4`}>
          <p>
            Noch keine Sportarten. Lege Mountainbike, Jogging, Kraft Studio, Kraft Eisenhorn und Eishockey samt
            saisonaler Gewichtung und die beiden Bikes in einem Schritt an.
          </p>
          <form action={seedMasterDataAction}>
            <button type="submit" className={buttonPrimary}>
              Stammdaten anlegen
            </button>
          </form>
        </section>
      ) : (
        <ul className="divide-y divide-mist">
          {sports.map((sport) => {
            const pref = sport.preferences.find((p) => p.season === season)!;
            return (
              <li key={sport.id}>
                <Link href={`/sports/${sport.id}`} className="flex items-center gap-4 py-4 hover:text-moss">
                  <SeasonProfile preferences={sport.preferences} currentSeason={season} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold">
                      {sport.name}
                      {!sport.active && <span className="ml-2 text-sm font-normal text-stone">inaktiv</span>}
                    </span>
                    <span className="block text-sm text-stone">
                      {CATEGORY_LABELS[sport.category]}, {weightLabel(pref.weight)}
                      {pref.targetSessionsPerWeek != null && `, ${pref.targetSessionsPerWeek} pro Woche`}
                    </span>
                  </span>
                  <span className="font-display text-3xl font-semibold tabular-nums">{pref.weight}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-sm text-stone">
        Die Balken zeigen die Gewichtung je Saison von Frühling bis Winter, 0 = nie, 10 = Schwerpunkt.
      </p>
    </>
  );
}
