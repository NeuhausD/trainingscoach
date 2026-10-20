import Link from "next/link";
import { NavLinks } from "./nav-links";

/**
 * Rahmen aller Seiten: Kopfzeile mit Wortmarke und darunter die
 * Tab-Navigation, beides oben fixiert. Keine Leiste am unteren Rand, weil
 * dort auf dem iPhone die Wischgeste und die Safari-Adressleiste liegen.
 * Ohne Session (Login-Seite) nur die Wortmarke.
 */
export function AppShell({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  return (
    <>
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-moss focus:px-3 focus:py-2 focus:text-moss-ink"
      >
        Zum Inhalt springen
      </a>
      <header className="sticky top-0 z-40 border-b border-mist bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 pt-3 pb-2 sm:py-3">
          <Link href="/dashboard" className="font-display text-xl font-semibold tracking-tight hover:text-moss">
            Trainingscoach
          </Link>
          {signedIn && (
            <div className="flex items-center gap-3">
              <nav aria-label="Hauptnavigation" className="hidden sm:block">
                <NavLinks />
              </nav>
              <Link href="/settings/connectors" className="text-sm font-medium text-stone hover:text-moss">
                Einstellungen
              </Link>
            </div>
          )}
        </div>
        {signedIn && (
          <nav aria-label="Hauptnavigation" className="mx-auto max-w-2xl px-2 sm:hidden">
            <NavLinks />
          </nav>
        )}
      </header>
      <main id="inhalt" className="mx-auto max-w-2xl px-4 py-6 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </>
  );
}
