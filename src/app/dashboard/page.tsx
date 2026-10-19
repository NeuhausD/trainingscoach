import Link from "next/link";
import { signOut } from "@/auth";
import { SeasonProfile, SEASON_TEXT_COLOR } from "@/components/season-profile";
import { sortByWeightForSeason, weightLabel } from "@/lib/domain/preferences";
import { SEASON_LABELS, SEASON_MONTHS, seasonForDate } from "@/lib/domain/season";
import { listEquipment } from "@/lib/master-data/equipment";
import { listSports } from "@/lib/master-data/sports";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Übersicht" };

const upcoming = [
  { title: "Aktivitäten", text: "Import aus Strava, FIT-Upload, manuelle Erfassung", phase: "P2 bis P4" },
  { title: "Fortschritt", text: "Gewicht, Ruhepuls, FTP, Kraftwerte", phase: "P2 und P5" },
  { title: "Wochenplan", text: "KI-Vorschläge nach Saison, Wetter und Belastung", phase: "P6 und P7" },
  { title: "Connectoren", text: "Strava, KI-Anbieter, Wetter-Standort", phase: "P3" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const season = seasonForDate(new Date());
  const [sports, equipment] = await Promise.all([listSports(user.id), listEquipment(user.id)]);
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
        <h2 id="demnaechst" className="text-2xl font-semibold">
          Demnächst
        </h2>
        <ul className="mt-3 divide-y divide-mist">
          {upcoming.map((item) => (
            <li key={item.title} className="flex items-baseline justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-sm text-stone">{item.text}</span>
              </span>
              <span className="shrink-0 text-sm text-stone">{item.phase}</span>
            </li>
          ))}
        </ul>
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
