# Strava

1. https://www.strava.com/settings/api → App anlegen
   - Kategorie «Data Importer», Website `https://<vercel-domain>`, Callback-Domain nur die Domain ohne Protokoll, z. B. `trainingscoach-zeta.vercel.app`. Strava erlaubt eine Domain pro App; Previews und lokale Entwicklung laufen damit nicht (ggf. zweite App mit `localhost`).
   - Ein App-Symbol ist Pflicht, bevor Strava die Zugangsdaten zeigt.
2. In Vercel setzen: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` (von der Strava-Seite), `STRAVA_WEBHOOK_VERIFY_TOKEN` (frei gewählt, z. B. `openssl rand -hex 16`) und `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`). Die Tokens auf der Strava-Seite («Dein Zugriffs-Token», «Aktualisierungs-Token») werden nicht gebraucht.
3. In der App unter `/settings/connectors` «Mit Strava verbinden». Scope: `read,activity:read_all,profile:read_all`. Danach «Letzte 12 Monate importieren».
4. Webhook-Subscription einmalig anlegen (Production-URL muss erreichbar sein; Strava ruft `GET /api/strava/webhook` zur Validierung auf):

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://<vercel-domain>/api/strava/webhook \
  -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN
```

   Prüfen: `curl "https://www.strava.com/api/v3/push_subscriptions?client_id=$STRAVA_CLIENT_ID&client_secret=$STRAVA_CLIENT_SECRET"`. Pro App gibt es genau eine Subscription.
5. Garmin Connect → Strava Auto-Sync sicherstellen (Garmin Connect App → Einstellungen → Verbundene Apps).
6. `CRON_SECRET` in Vercel setzen; der nächtliche Cron (`vercel.json`, 03:15 UTC) gleicht die letzten 30 Tage ab.

## Ablauf in der App

- `/api/strava/connect` setzt ein State-Cookie und leitet zu Strava.
- `/api/strava/callback` prüft State und Scope, tauscht den Code und speichert Access- und Refresh-Token verschlüsselt in `connectors`.
- Import und Abgleich (`src/lib/strava/sync.ts`): Aktivitäten seit Datum holen (200 je Seite), Sportart über `sports.strava_types`, Gerät über `equipment.strava_gear_id`, unbekanntes Gear als neues Gerät anlegen, Belastung berechnen. Manuell gesetzte Sportart oder Gerät bleiben bei Aktualisierungen erhalten.
- Webhook `POST /api/strava/webhook` antwortet sofort und verarbeitet das Ereignis nach der Antwort (`after()`): Aktivität anlegen, aktualisieren oder löschen, Widerruf der Berechtigung markiert den Connector als getrennt.
- «Strava trennen» ruft `oauth/deauthorize` auf und löscht die Tokens; Aktivitäten bleiben.
