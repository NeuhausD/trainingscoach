---
name: ship
description: Abschluss-Checkliste für den Trainingscoach: Qualitätsprüfung, Doku-Abgleich, Commit, Push und PR-Beschreibung. Verwenden bei "/ship" oder wenn Arbeit an einem Branch fertig ist.
---

# Ship

1. `git status` und `git diff --stat` prüfen: nur beabsichtigte Dateien, keine `.env*`, keine Secrets, kein `node_modules`.
2. `npm run check` und `npm run build` ausführen. Rot = nicht shippen, zuerst beheben.
3. Doku-Abgleich: Für jede geänderte Datei unter `src/` prüfen, ob `docs/02-architektur.md`, `docs/03-datenmodell.md`, `docs/04-integrationen.md` oder `docs/05-roadmap.md` (Checkboxen) angepasst werden müssen.
4. Commit(s) mit Conventional Commits auf Englisch. Mehrere logische Änderungen → mehrere Commits.
5. `git push -u origin <branch>`.
6. PR-Beschreibung (Deutsch) im Chat ausgeben, Struktur:
   - Was: 2–4 Sätze
   - Warum: Bezug auf Roadmap-Phase oder Issue
   - Geprüft: welche Befehle, welche manuellen Tests
   - Offen: bekannte Lücken
   Nur einen PR erstellen, wenn der Benutzer das ausdrücklich will.
