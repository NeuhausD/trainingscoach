# Vercel und Neon

1. Auf vercel.com «Add New Project», GitHub-Repo `trainingscoach` importieren. Framework wird als Next.js erkannt.
2. Im Vercel-Projekt unter «Storage» eine Neon-Postgres-Datenbank anlegen (Marketplace). Vercel setzt `DATABASE_URL` automatisch.
3. Optional «Storage» → Blob Store anlegen (Name `trainingscoach-files`, Region Frankfurt, für FIT-Dateien). Beim Verbinden mit dem Projekt setzt Vercel `BLOB_READ_WRITE_TOKEN`; erst damit legt der FIT-Upload die Dateien ab, ohne Token werden sie nur ausgewertet.
4. Env-Variablen gemäss `.env.example` setzen (Production, Preview, Development):
   `AUTH_SECRET` (`openssl rand -base64 32`), Entra-Werte, `ALLOWED_EMAILS`, `AI_PROVIDER`, `ANTHROPIC_API_KEY` oder `OPENAI_API_KEY`, `TOKEN_ENCRYPTION_KEY`.
5. Migrationen: `npm run db:migrate` mit `DATABASE_URL` der Neon-DB (spielt `drizzle/*.sql` über den Neon-HTTP-Treiber ein; `db:push` nur für Wegwerf-Branches). Danach Stammdaten: `npm run db:seed -- <deine E-Mail>` oder nach dem ersten Login auf `/sports` «Stammdaten anlegen».
   In Claude-Code-Cloud-Sessions: `DATABASE_URL` als Umgebungsvariable der Cloud-Umgebung setzen und `*.neon.tech` unter «Allowed domains» freigeben. Die npm-Skripte setzen `NODE_USE_ENV_PROXY=1`, damit Node den Proxy der Session nutzt; `drizzle-kit migrate` selbst (WebSocket) funktioniert dort nicht.
6. Eigene Domain optional; die Redirect-URI in Entra muss zur produktiven URL passen.
7. Settings → Functions → Function Region auf Frankfurt (fra1) stellen, damit die Functions neben der Neon-DB (eu-central-1) laufen.
8. Settings → Git muss `NeuhausD/trainingscoach` zeigen, sonst baut Vercel nicht.

Cron-Jobs stehen in `vercel.json` und laufen nur in Production.
