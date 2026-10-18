import { auth, signOut } from "@/auth";
import { SEASON_LABELS } from "@/lib/domain/season";
import { seasonForDate } from "@/lib/domain/season";

const sections = [
  { href: "/activities", title: "Aktivitäten", text: "Import aus Strava, FIT-Upload, manuelle Erfassung (P2–P4)" },
  { href: "/plan", title: "Wochenplan", text: "KI-Vorschläge nach Saison, Wetter und Belastung (P6–P7)" },
  { href: "/sports", title: "Sportarten", text: "Saisonale Gewichtung, Ziel-Einheiten pro Woche (P1)" },
  { href: "/equipment", title: "Sportgeräte", text: "Bikes, Laufschuhe, Eisenhorn, Abgleich mit Strava-Gear (P1)" },
  { href: "/metrics", title: "Fortschritt", text: "Gewicht, Ruhepuls, FTP, Kraftwerte (P2, P5)" },
  { href: "/settings/connectors", title: "Connectoren", text: "Strava, KI-Anbieter, Wetter-Standort (P3)" },
];

export default async function DashboardPage() {
  const session = await auth();
  const season = seasonForDate(new Date());
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hallo {session?.user?.name ?? "Athlet"}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Aktuelle Saison: {SEASON_LABELS[season]}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm underline">
            Abmelden
          </button>
        </form>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-medium">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
