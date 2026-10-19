---
name: feature
description: Setzt ein Feature des Trainingscoach von der Planung bis zum PR-fertigen Stand um. Verwenden bei "/feature <Beschreibung>" oder wenn eine Roadmap-Phase (docs/05-roadmap.md) umgesetzt werden soll.
---

# Feature umsetzen

Eingabe: $ARGUMENTS (Beschreibung oder Roadmap-Phase, z. B. "P3 Strava OAuth").

## 1. Verstehen
- Lies die betroffenen Abschnitte in `docs/05-roadmap.md`, `docs/02-architektur.md`, `docs/03-datenmodell.md`.
- Prüfe bestehende Module in `src/lib` und `src/app`, bevor du Neues anlegst.
- Nenne in zwei Sätzen Ziel und Fertig-Kriterium.

## 2. Planen (kurz, im Chat)
- Liste der Dateien, die entstehen oder sich ändern.
- Datenmodell-Änderungen → Migration mit `npm run db:generate`.
- Welche Fachlogik nach `src/lib/domain` kommt und welche Tests sie bekommt.
- Offene Entscheidungen: wenn architekturrelevant, `/adr` anlegen.

## 3. Umsetzen
- Fachlogik zuerst mit Tests (Vitest), dann DB, dann Route Handler / Server Actions, dann UI.
- Next.js 16: `proxy.ts` statt Middleware, Route Handler in `app/api/**/route.ts`; bei Unsicherheit `node_modules/next/dist/docs/` lesen.
- UI auf Deutsch, Tailwind, mobil zuerst (die App wird oft am Handy genutzt). Tokens und Bausteine aus `docs/07-design.md` und `src/components/` verwenden; neue Seiten mit `/frontend-design` planen.
- Neue Env-Variablen in `.env.example` und `docs/setup/` ergänzen.

## 4. Prüfen
- `npm run check` und `npm run build` müssen grün sein. Fehler beheben, nicht ignorieren.
- Betroffene Doku in `docs/` aktualisieren (Diagramme in Mermaid anpassen).

## 5. Abschluss
- Zusammenfassung: was gebaut, was getestet, was offen.
- Für Commit, Push und PR-Text den Skill `/ship` verwenden.
