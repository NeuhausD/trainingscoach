import Link from "next/link";
import { NavLinks } from "./nav-links";

/**
 * Rahmen aller Seiten: Kopfzeile mit Wortmarke, Tab-Navigation unten am Handy
 * und oben ab Tablet. Ohne Session (Login-Seite) nur die Wortmarke.
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
      <header className="border-b border-mist">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="font-display text-xl font-semibold tracking-tight hover:text-moss"
          >
            Trainingscoach
          </Link>
          {signedIn && (
            <nav aria-label="Hauptnavigation" className="hidden sm:block">
              <NavLinks />
            </nav>
          )}
        </div>
      </header>
      <main id="inhalt" className={`mx-auto max-w-2xl px-4 py-6 ${signedIn ? "pb-28 sm:pb-12" : "pb-12"}`}>
        {children}
      </main>
      {signedIn && (
        <nav
          aria-label="Hauptnavigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-paper pb-[env(safe-area-inset-bottom)] sm:hidden"
        >
          <NavLinks bottom />
        </nav>
      )}
    </>
  );
}
