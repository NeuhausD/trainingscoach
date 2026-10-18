---
name: coach-prompt
description: Prompt, Kontextaufbau und Zod-Schema des KI-Coaches anpassen und mit Beispielkontext gegen den konfigurierten Anbieter testen. Verwenden bei "/coach-prompt" oder wenn Trainingsvorschläge inhaltlich verbessert werden sollen.
---

# KI-Coach anpassen

Dateien: `src/lib/ai/provider.ts` (Anbieter), `src/lib/ai/context.ts` (Kontextaufbau), `src/lib/ai/coach.ts` (Prompt, Schema, Aufruf), `src/lib/ai/__fixtures__/` (Beispielkontexte).

1. Leitplanke prüfen: Der Kontext darf nur Aggregate und manuelle Daten enthalten (ADR 0004). Keine Strava-Rohfelder in `context.ts` aufnehmen.
2. Änderung am Prompt oder Schema umsetzen. Schema-Änderungen brauchen eine Migration, falls `training_suggestions` betroffen ist.
3. Test mit Fixture: `npm run coach:try -- <fixture-name>` ruft den konfigurierten Anbieter mit dem Beispielkontext auf und gibt das Ergebnis aus (braucht `ANTHROPIC_API_KEY` oder `OPENAI_API_KEY` in `.env.local`).
4. Mindestens zwei Fixtures prüfen: Sommer bei gutem Wetter (MTB-Schwerpunkt) und Winter bei Schnee (Studio, Eisenhorn, Eishockey).
5. Ergebnis bewerten: passt zu Saison-Gewichtung, Belastung der letzten 4 Wochen, Zielen (Ausdauer MTB, Kraft/Schnellkraft). Varianten vorhanden (Indoor/Outdoor, kurz/lang).
6. Änderung am Verhalten in `docs/04-integrationen.md` Abschnitt KI dokumentieren.
