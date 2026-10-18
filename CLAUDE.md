# Trainingscoach – Regeln für Claude Code

Persönliche Trainings-Coach-App (Hobby-Sport: Mountainbike, Jogging, Kraft,
Eishockey). Next.js 16 auf Vercel, Neon Postgres, Auth.js mit Entra ID,
Vercel AI SDK. Sprache der Doku und UI: Deutsch (Schweiz, «ss» statt «ß»).
Code, Bezeichner und Commits: Englisch.

## Zuerst lesen
- `docs/01-vision-und-ziele.md` (Was und warum)
- `docs/02-architektur.md` (Struktur, Abläufe)
- `docs/05-roadmap.md` (aktuelle Phase)
- `AGENTS.md` enthält Hinweise von Next.js 16 zu geänderten APIs; vor Next-spezifischem Code `node_modules/next/dist/docs/` konsultieren.

## Arbeitsweise
- Feature-Arbeit mit dem Skill `/feature`, Abschluss mit `/ship`, Entscheidungen mit `/adr`.
- Vor dem Commit: `npm run check` (Lint, Typecheck, Tests) muss grün sein; vor dem PR zusätzlich `npm run build`.
- Fachlogik gehört nach `src/lib/domain` (ohne Next/DB-Imports) und bekommt Vitest-Tests.
- Jede Verhaltensänderung aktualisiert die passende Doku in `docs/` im gleichen Commit.
- Keine Secrets im Repo. Neue Env-Variablen in `.env.example` dokumentieren.

## Fachliche Leitplanken
- Strava-Rohdaten nie an ein LLM senden (ADR 0004). Der KI-Kontext wird in `src/lib/ai/context.ts` gebaut und besteht aus Aggregaten und manuellen Daten.
- Strava-Tokens nur verschlüsselt speichern (`src/lib/crypto.ts`).
- Login ist auf `ALLOWED_EMAILS` beschränkt; nie aufweichen.
- Garmin: kein Scraping, keine inoffiziellen Bibliotheken (ADR 0003).

## Konventionen
- Conventional Commits (`feat(strava): ...`, `fix(auth): ...`, `docs: ...`).
- Branches `feat/<thema>`, `fix/<thema>`; `main` ist deploybar.
- Datums- und Zeitlogik in UTC speichern, in `Europe/Zurich` anzeigen.
- Einheiten: Meter, Sekunden, Watt, Kilogramm in der DB; Umrechnung nur in der UI.
