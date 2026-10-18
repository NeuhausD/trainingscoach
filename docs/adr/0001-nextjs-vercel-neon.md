# ADR 0001 – Next.js auf Vercel mit Neon Postgres

Status: akzeptiert · Datum: 2026-10-18

## Kontext
Die App soll gehostet sein, ohne eigenen Server, mit minimalem Betriebsaufwand
und guter Unterstützung für Entwicklung ausschliesslich über Claude Code.

## Entscheidung
Next.js 16 (App Router, TypeScript) auf Vercel, Datenbank Neon Postgres
(serverless) über Drizzle ORM, Dateien in Vercel Blob.

## Alternativen
- SvelteKit/Nuxt: gleichwertig, aber weniger Vercel-Integration (Cron, AI SDK, Blob)
- Supabase statt Neon: brächte eigenes Auth mit, das hier aber Entra ID ist; Neon-Branching passt besser zu Preview-Deployments
- Prisma statt Drizzle: schwerer im Serverless-Kaltstart, Drizzle ist näher an SQL

## Konsequenzen
- Vendor-Bindung an Vercel bei Cron und Blob (ersetzbar, beides hinter kleinen Wrappern)
- Cache Components (Next 16) sind vorerst deaktiviert, weil fast jede Seite Session-abhängig ist; Aktivierung später pro Route möglich
