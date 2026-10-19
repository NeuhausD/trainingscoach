# Trainingscoach

Persönliche Trainings-Coach-App für Hobby-Sport (Mountainbike, Jogging,
Krafttraining, Eishockey): Dokumentation, Fortschritt und KI-gestützte
Trainingsvorschläge nach Saison, Wetter und Belastung.

- Stack: Next.js 16, TypeScript, Tailwind 4, Auth.js (Microsoft Entra ID), Drizzle + Neon Postgres, Vercel AI SDK (Anthropic/OpenAI), Vercel
- Doku: [`docs/`](docs/README.md) (Architektur mit Mermaid, Datenmodell, Integrationen, Roadmap, ADRs, Setup)
- Entwicklung: ausschliesslich mit Claude Code, siehe [`docs/06-entwicklungsworkflow.md`](docs/06-entwicklungsworkflow.md) und [`CLAUDE.md`](CLAUDE.md)

## Schnellstart

```bash
npm ci
cp .env.example .env.local   # Werte eintragen, siehe docs/setup/
npm run db:migrate           # Migrationen in die Neon-DB
npm run db:seed              # Stammdaten (Sportarten, Bikes) für die erste Adresse aus ALLOWED_EMAILS
npm run dev                  # http://localhost:3000
```

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run check` | Lint, Typecheck, Tests |
| `npm run build` | Produktions-Build (wie Vercel) |
| `npm run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle (Migration generieren, einspielen, Schema pushen, Studio) |
| `npm run db:seed -- <email>` | Stammdaten und Übungskatalog anlegen (idempotent) |
| `npm run coach:try -- summer-good-weather` | KI-Coach mit Beispielkontext aufrufen |

## Status

Phasen P0 bis P2 (Stammdaten, Design, manuelle Erfassung) umgesetzt. Nächste Schritte in [`docs/05-roadmap.md`](docs/05-roadmap.md).
