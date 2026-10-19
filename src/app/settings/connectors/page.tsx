import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { buttonPrimary, buttonSecondary, errorBox, hint, panel, successBox } from "@/components/ui";
import { formatDateTime } from "@/lib/domain/time";
import { getStravaConnector } from "@/lib/master-data/connectors";
import { countStravaActivities } from "@/lib/strava/sync";
import { requireUser } from "@/lib/users";
import { disconnectStravaAction, syncStravaAction } from "./actions";

export const metadata = { title: "Connectoren" };
export const maxDuration = 60;

const ERRORS: Record<string, string> = {
  state: "Die Anmeldung bei Strava wurde nicht korrekt abgeschlossen (State stimmt nicht). Bitte erneut verbinden.",
  scope: "Strava hat den Zugriff auf Aktivitäten nicht freigegeben. Beim Verbinden bitte alle Häkchen setzen.",
  code: "Strava hat keinen Code zurückgegeben. Bitte erneut verbinden.",
  access_denied: "Du hast die Verbindung bei Strava abgelehnt.",
};

export default async function ConnectorsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; disconnected?: string; error?: string; synced?: string; updated?: string; gear?: string; days?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const connector = await getStravaConnector(user.id);
  const connected = connector?.status !== undefined && connector.status !== "disconnected";
  const imported = connected ? await countStravaActivities(user.id) : 0;
  const configured = !!process.env.STRAVA_CLIENT_ID;

  return (
    <>
      <PageHeader title="Connectoren" subtitle="Strava liefert die Garmin-Aktivitäten; Garmin direkt folgt, sobald das Developer Program wieder offen ist." />
      {sp.connected && (
        <p role="status" className={`${successBox} mb-4`}>
          Strava ist verbunden. Starte jetzt den Import der letzten 12 Monate.
        </p>
      )}
      {sp.disconnected && (
        <p role="status" className={`${successBox} mb-4`}>
          Strava wurde getrennt. Importierte Aktivitäten bleiben erhalten.
        </p>
      )}
      {sp.synced !== undefined && (
        <p role="status" className={`${successBox} mb-4`}>
          Abgleich der letzten {sp.days} Tage: {sp.synced} neu, {sp.updated} aktualisiert, {sp.gear} Geräte aus Strava angelegt.
        </p>
      )}
      {sp.error && (
        <p role="alert" className={`${errorBox} mb-4`}>
          {ERRORS[sp.error] ?? `Strava-Fehler: ${sp.error}`}
        </p>
      )}

      <section className={`${panel} flex flex-col gap-4`} aria-labelledby="strava">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="strava" className="text-2xl font-semibold">
            Strava
          </h2>
          <span className={`text-sm font-medium ${connected ? "text-moss" : "text-stone"}`}>
            {connector?.status === "error" ? "Fehler" : connected ? "Verbunden" : "Nicht verbunden"}
          </span>
        </div>

        {connected ? (
          <>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-stone">Athlet</dt>
                <dd className="font-semibold">{connector?.athleteName ?? connector?.externalAthleteId ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-stone">Letzter Abgleich</dt>
                <dd className="font-semibold">{connector?.lastSyncAt ? formatDateTime(connector.lastSyncAt) : "noch nie"}</dd>
              </div>
              <div>
                <dt className="text-stone">Importierte Aktivitäten</dt>
                <dd className="font-semibold tabular-nums">{imported}</dd>
              </div>
              <div>
                <dt className="text-stone">Token gültig bis</dt>
                <dd className="font-semibold">{connector?.expiresAt ? formatDateTime(connector.expiresAt) : "–"}</dd>
              </div>
            </dl>
            {connector?.lastError && (
              <p role="alert" className={errorBox}>
                Letzter Fehler: {connector.lastError}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <form action={syncStravaAction}>
                <input type="hidden" name="days" value={imported === 0 ? 365 : 30} />
                <button type="submit" className={buttonPrimary}>
                  {imported === 0 ? "Letzte 12 Monate importieren" : "Letzte 30 Tage abgleichen"}
                </button>
              </form>
              {imported > 0 && (
                <form action={syncStravaAction}>
                  <input type="hidden" name="days" value={365} />
                  <button type="submit" className={buttonSecondary}>
                    12 Monate erneut abgleichen
                  </button>
                </form>
              )}
            </div>
            <p className={hint}>
              Neue Aktivitäten kommen per Webhook sofort an, nachts gleicht ein Cron die letzten 30 Tage ab. Unbekannte
              Ausrüstung wird als Gerät angelegt; Typ unter Geräte prüfen.
            </p>
            <form action={disconnectStravaAction} className="border-t border-mist pt-4">
              <DeleteButton confirmText="Strava wirklich trennen? Importierte Aktivitäten bleiben erhalten.">Strava trennen</DeleteButton>
            </form>
          </>
        ) : (
          <>
            <p className="text-stone">
              Verbinde dein Strava-Konto, damit die Aktivitäten der Garmin-Uhr automatisch hier erscheinen, mit Sportart
              und Bike. Berechtigungen: Profil lesen, Aktivitäten lesen.
            </p>
            {configured ? (
              <a href="/api/strava/connect" className={buttonPrimary}>
                Mit Strava verbinden
              </a>
            ) : (
              <p role="alert" className={errorBox}>
                STRAVA_CLIENT_ID ist nicht gesetzt. Einrichtung in docs/setup/strava.md.
              </p>
            )}
          </>
        )}
      </section>

      <section className={`${panel} mt-6 flex flex-col gap-2`} aria-labelledby="ki">
        <h2 id="ki" className="text-2xl font-semibold">
          KI-Anbieter
        </h2>
        <p className="text-stone">
          {process.env.AI_PROVIDER ?? "anthropic"}
          {process.env.AI_MODEL ? `, Modell ${process.env.AI_MODEL}` : ", Standardmodell"}. Wird über Env-Variablen in Vercel
          gesetzt; der KI-Coach folgt in Phase P6.
        </p>
      </section>
    </>
  );
}
