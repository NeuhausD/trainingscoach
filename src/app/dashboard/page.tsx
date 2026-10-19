import Link from "next/link";
import { signOut } from "@/auth";
import { SEASON_TEXT_COLOR } from "@/components/season-profile";
import { SportBars } from "@/components/sport-bars";
import { buttonPrimary, buttonSecondary } from "@/components/ui";
import { INTENSITY_LABELS } from "@/lib/domain/intensity";
import { sortByWeightForSeason } from "@/lib/domain/preferences";
import { formatHours, sinceDays, summarizeBySport, totals } from "@/lib/domain/progress";
import { SEASON_LABELS, seasonForDate } from "@/lib/domain/season";
import { formatDate, formatDateTime, formatDuration, utcToLocalParts } from "@/lib/domain/time";
import { listActivities } from "@/lib/master-data/activities";
import { listSports } from "@/lib/master-data/sports";
import { listSuggestions, readMeta } from "@/lib/master-data/suggestions";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Übersicht" };

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const season = seasonForDate(now);
  const today = utcToLocalParts(now).date;
  const [sports, recent, suggestions] = await Promise.all([
    listSports(user.id),
    listActivities(user.id, { since: sinceDays(now, 28) }),
    listSuggestions(user.id, today),
  ]);
  const open = suggestions.filter((s) => s.status === "suggested" || s.status === "accepted");
  const next = open[0] ?? null;
  const following = open.slice(1, 5);
  const bySport = summarizeBySport(recent);
  const sum = totals(recent);
  const last = recent[0] ?? null;
  const focus = sortByWeightForSeason(
    sports.filter((s) => s.active),
    season,
  )
    .map((s) => ({ name: s.name, weight: s.preferences.find((p) => p.season === season)?.weight ?? 0 }))
    .filter((s) => s.weight > 0)
    .slice(0, 4);
  const firstName = user.name?.split(" ")[0] ?? "Athlet";
  const dayLabel = (iso: string) => (iso === today ? "Heute" : formatDate(iso, { weekday: "long", day: "numeric", month: "long" }));

  return (
    <div className="flex flex-col gap-12">
      <p className="text-stone">
        Hallo {firstName}. <span className={`font-semibold ${SEASON_TEXT_COLOR[season]}`}>{SEASON_LABELS[season]}</span>
        {focus.length > 0 && (
          <>
            , Schwerpunkte{" "}
            <Link href="/sports" className="text-ink hover:text-moss hover:underline">
              {focus.map((s) => `${s.name} ${s.weight}`).join(", ")}
            </Link>
          </>
        )}
        {focus.length === 0 && (
          <>
            .{" "}
            <Link href="/sports" className="font-medium text-moss hover:underline">
              Sportarten gewichten
            </Link>
          </>
        )}
      </p>

      <section aria-labelledby="aussicht">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="aussicht" className="text-2xl font-semibold">
            Aussicht
          </h2>
          <Link href="/coach" className="text-sm font-medium text-moss hover:underline">
            Coach
          </Link>
        </div>
        {next ? (
          <>
            <p className="mt-3 text-stone">{dayLabel(next.plannedOn)}</p>
            <h1 className="font-display text-5xl font-semibold leading-none tracking-tight text-balance">
              <Link href="/coach" className="hover:text-moss">
                {next.title}
              </Link>
            </h1>
            <p className="mt-3 text-stone">
              {next.sportName ?? "Sportart offen"}
              {readMeta(next).equipment ? `, ${readMeta(next).equipment}` : ""},{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{next.durationMin}</span> min, {INTENSITY_LABELS[next.intensity]}
              {next.status === "accepted" ? ", angenommen" : ""}
            </p>
            {following.length > 0 && (
              <ul className="mt-5 divide-y divide-mist border-t border-mist">
                {following.map((item) => (
                  <li key={item.id}>
                    <Link href="/coach" className="flex items-baseline gap-4 py-2.5 hover:text-moss">
                      <span className="w-14 shrink-0 text-sm text-stone">{formatDate(item.plannedOn, { weekday: "short", day: "numeric" })}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                      <span className="shrink-0 text-sm text-stone tabular-nums">{item.durationMin} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-tight text-balance">Noch kein Plan für diese Woche</h1>
            <p className="mt-3 text-stone">Der Coach plant aus Saison, Belastung der letzten vier Wochen und Wetter.</p>
          </>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {next ? (
            <Link href="/activities/new" className={buttonPrimary}>
              Training erfassen
            </Link>
          ) : (
            <>
              <Link href="/coach" className={buttonPrimary}>
                Woche planen
              </Link>
              <Link href="/activities/new" className={buttonSecondary}>
                Training erfassen
              </Link>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="rueckblick">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="rueckblick" className="text-2xl font-semibold">
            Rückblick
          </h2>
          <Link href="/progress" className="text-sm font-medium text-moss hover:underline">
            Fortschritt
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-stone">
            Noch keine Aktivität in den letzten vier Wochen.{" "}
            <Link href="/activities/new" className="font-medium text-moss hover:underline">
              Erste Einheit erfassen
            </Link>
          </p>
        ) : (
          <>
            <p className="text-sm text-stone">Letzte vier Wochen</p>
            <p className="mt-1 text-stone">
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{sum.sessions}</span> Einheiten,{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{formatHours(sum.seconds)}</span>, Belastung{" "}
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">{sum.load}</span>
            </p>
            <div className="mt-4">
              <SportBars rows={bySport} caption="Zeit je Sportart in den letzten vier Wochen" />
            </div>
            {last && (
              <p className="mt-4 text-sm text-stone">
                Zuletzt{" "}
                <Link href={`/activities/${last.id}`} className="font-medium text-ink hover:text-moss hover:underline">
                  {last.title ?? last.sportName ?? "Training"}
                </Link>
                , {formatDateTime(last.startedAt)}, {formatDuration(last.durationS)}.{" "}
                <Link href="/activities" className="font-medium text-moss hover:underline">
                  Alle Aktivitäten
                </Link>
              </p>
            )}
          </>
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
