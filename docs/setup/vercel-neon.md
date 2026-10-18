# Vercel und Neon

1. Auf vercel.com «Add New Project», GitHub-Repo `trainingscoach` importieren. Framework wird als Next.js erkannt.
2. Im Vercel-Projekt unter «Storage» eine Neon-Postgres-Datenbank anlegen (Marketplace). Vercel setzt `DATABASE_URL` automatisch.
3. «Storage» → Blob Store anlegen (für FIT-Uploads). Vercel setzt `BLOB_READ_WRITE_TOKEN`.
4. Env-Variablen gemäss `.env.example` setzen (Production und Preview getrennt):
   `AUTH_SECRET` (`openssl rand -base64 32`), Entra-Werte, `ALLOWED_EMAILS`, `AI_PROVIDER`, `ANTHROPIC_API_KEY` oder `OPENAI_API_KEY`, `TOKEN_ENCRYPTION_KEY`.
5. Migrationen: lokal oder in der Session `npm run db:push` gegen die Neon-URL (später `db:migrate` in CI).
6. Eigene Domain optional; die Redirect-URI in Entra muss zur produktiven URL passen.

Cron-Jobs stehen in `vercel.json` und laufen nur in Production.
