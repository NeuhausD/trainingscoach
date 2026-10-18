# Strava

1. https://www.strava.com/settings/api → App anlegen
   - Authorization Callback Domain: `localhost` (Entwicklung) bzw. die Vercel-Domain (Production). Strava erlaubt nur eine Domain pro App; für Entwicklung und Production ggf. zwei Apps anlegen.
2. `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` setzen, `STRAVA_WEBHOOK_VERIFY_TOKEN` frei wählen.
3. In der App unter `/settings/connectors` «Strava verbinden». Scope: `read,activity:read_all,profile:read_all`.
4. Webhook-Subscription einmalig anlegen (Production-URL):

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://<vercel-domain>/api/strava/webhook \
  -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN
```

5. Garmin Connect → Strava Auto-Sync sicherstellen (Garmin Connect App → Einstellungen → Verbundene Apps).
