import Link from "next/link";
import { signOut } from "@/auth";
import { SeasonProfile, SEASON_TEXT_COLOR } from "@/components/season-profile";
import { SportBars } from "@/components/sport-bars";
import { buttonPrimary } from "@/components/ui";
import { formatHours, sinceDays, summarizeBySport, totals } from "@/lib/domain/progress";
import { listActivities } from "@/lib/master-data/activities";
import { sortByWeightForSeason, weightLabel } from "@/lib/domain/preferences";
import { SEASON_LABELS, SEASON_MONTHS, seasonForDate } from "@/lib/domain/season";
import { listEquipment } from "@/lib/master-data/equipment";
import { listSports } from "@/lib/master-data/sports";
import { listSuggestions } from "@/lib/master-data/suggestions";
import { formatDate, utcToLocalParts } from "@/lib/domain/time";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Übersicht" };

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const season = seasonForDate(now);
  const [sports, equipment, recent, suggestions] = await Promise.all([
    listSports(user.id),
    listEquipment(user.id),
    listActivities(user.id, { since: sinceDays(now, 28) }),
    listSuggestions(user.id, utcToLocalParts(now).date),
  ]);
  const upcoming = suggestions.filter((s) => s.status !== "skipped").slice(0, 4);
  const bySport = summarizeBySport(recent);
  const sum = totals(recent);
  const ranked = sortByWeightForSeason(
    sports.filter((s) => s.active),
    season,
  );
  const focus = ranked.filter((s) => (s.preferences.find((p) => p.season === season)?.weight ?? 0) > 0);
  const activeEquipment = equipment.filter((e) => !e.retired);
  const firstName = user.name?.split(" ")[0] ?? "Athlet";

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="saison">
        <p className="text-stone">Hallo {firstName}, aktuelle Saison</p>
        <h1 id="saison" className={`text-7xl font-bold leading-none tracking-tight ${SEASON_TEXT_COLOR[season]}`}>
          {SEASON_LABELS[season]}
        </h1>
        <p className="mt-1 text-stone">{SEASON_MONTHS[season]}</p>
        <Link href="/activities/new" className={`${buttonPrimary} mt-5`}>
          Training erfassen
        </Link>
      </section>

      <section aria-labelledby="vier-wochen">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="vier-wochen" className="text-2xl font-semibold">
            Letzte 4 Wochen
          </h2>
          <Link href="/progress" className="text-sm font-medium text-moss hover:underline">
            Fortschritt
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-stone">Noch keine Aktivität in den letzten vier Wochen.</p>
        ) : (
          <>
            <p className="mt-1 text-stone">
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{sum.sessions}</span> Einheiten,{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{formatHours(sum.seconds)}</span>, Belastung{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{sum.load}</span>
            </p>
            <div className="mt-4">
              <SportBars rows={bySport} caption="Zeit je Sportart in den letzten vier Wochen" />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="schwerpunkte">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="schwerpunkte" className="text-2xl font-semibold">
            Schwerpunkte
          </h2>
          <Link href="/sports" className="text-sm font-medium text-moss hover:underline">
            Alle Sportarten
          </Link>
        </div>
        {focus.length === 0 ? (
          <p className="mt-3 text-stone">
            Noch keine Sportart mit Gewichtung für {SEASON_LABELS[season]}.{" "}
            <Link href="/sports" className="font-medium text-moss hover:underline">
              Sportarten einrichten
            </Link>
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-mist">
            {focus.map((sport) => {
              const pref = sport.preferences.find((p) => p.season === season)!;
              return (
                <li key={sport.id}>
                  <Link href={`/sports/${sport.id}`} className="flex items-center gap-4 py-3 hover:text-moss">
                    <SeasonProfile preferences={sport.preferences} currentSeason={season} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{sport.name}</span>
                      <span className="block text-sm text-stone">
                        {weightLabel(pref.weight)}
                        {pref.targetSessionsPerWeek != null && `, ${pref.targetSessionsPerWeek} pro Woche`}
                      </span>
                    </span>
                    <span className="font-display text-3xl font-semibold tabular-nums">{pref.weight}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="geraete">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="geraete" className="text-2xl font-semibold">
            Geräte
          </h2>
          <Link href="/equipment" className="text-sm font-medium text-moss hover:underline">
            Alle Geräte
          </Link>
        </div>
        {activeEquipment.length === 0 ? (
          <p className="mt-3 text-stone">
            Noch keine Geräte.{" "}
            <Link href="/equipment/new" className="font-medium text-moss hover:underline">
              Gerät anlegen
            </Link>
          </p>
        ) : (
          <p className="mt-3 text-stone">{activeEquipment.map((e) => e.name).join(", ")}</p>
        )}
      </section>

      <section aria-labelledby="demnaechst">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="demnaechst" className="text-2xl font-semibold">
            Demnächst
          </h2>
          <Link href="/coach" className="text-sm font-medium text-moss hover:underline">
            Coach
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-stone">
            Noch kein Wochenplan.{" "}
            <Link href="/coach" className="font-medium text-moss hover:underline">
              Woche planen
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-mist">
            {upcoming.map((item) => (
              <li key={item.id}>
                <Link href="/coach" className="flex items-baseline justify-between gap-4 py-3 hover:text-moss">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.title}</span>
                    <span className="block text-sm text-stone">
                      {formatDate(item.plannedOn, { weekday: "short", day: "numeric", month: "short" })}, {item.sportName ?? "Sportart offen"}
                      {item.status === "accepted" ? ", angenommen" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-2xl font-semibold tabular-nums">
                    {item.durationMin}
                    <span className="text-sm font-medium text-stone"> min</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="text-sm font-medium text-stone hover:text-ink">
          Abmelden
        </button>
      </form>
    </div>
  );
}
