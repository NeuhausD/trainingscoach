# 01 – Vision und Ziele

## Vision

**Trainingscoach** ist eine persönliche Web-App für einen Hobby-Sportler, die
Training dokumentiert, Fortschritte sichtbar macht und auf Basis der aktuell
gewünschten Sportarten (Saison, Monat, Wetter) KI-gestützte Trainingsvorschläge
liefert.

Die App ersetzt weder Garmin Connect noch Strava. Sie sitzt **darüber**: sie
zieht Aktivitäten aus Strava (dorthin synchronisiert Garmin automatisch),
ergänzt sie um eigene Daten (Körpergewicht, Leistungstests, Sportarten-Präferenzen,
Ausrüstung) und macht daraus Planung und Auswertung.

## Sportarten (Ist)

| Sportart | Saison | Ort / Gerät | Charakter |
|---|---|---|---|
| Mountainbike Touren und Trails | Sommer (Frühling bis Herbst) | XC-Bike (Marathon), Trail/Enduro-Bike | Ausdauer, Technik |
| Mountainbike Marathons | Sommer, einzelne Events | XC-Bike | Wettkampf, nur zum Spass |
| Jogging | ganzjährig, gelegentlich | – | Grundlagenausdauer |
| Krafttraining Studio | Herbst, Winter, Frühling | Fitline Studio Plaffeien | Kraft, Schnellkraft |
| Krafttraining zuhause | ganzjährig | eigenes Gerät («Eisenhorn») | Kraft, Ergänzung |
| Eishockey (Plausch) | Winter | Halle | Intervall, Spass |

## Persönliche Ziele

1. Allgemeine Fitness verbessern
2. Ausdauer auf dem Mountainbike verbessern (Touren, Marathons)
3. Kraft und Schnellkraft verbessern (Sprints, Rampen)

Daraus abgeleitete, messbare Kennzahlen (siehe `03-datenmodell.md`, Tabelle `performance_metrics`):

- Ausdauer: Wochen-/Monatsvolumen (h, km, Höhenmeter), durchschnittliche
  Leistung oder Herzfrequenz auf Referenzstrecken, FTP-Schätzung (sofern
  Leistungsmesser vorhanden, sonst HF-basiert), VO2max-Schätzung von Garmin
- Kraft: Hauptübungen (Kniebeuge, Kreuzheben, Bankdrücken, …) mit Gewicht × Wiederholungen,
  Sprungtests (optional)
- Allgemein: Körpergewicht, Ruhepuls, Schlaf (sofern aus Garmin erreichbar)

## Ziele der App (funktional)

| # | Ziel | Priorität |
|---|---|---|
| F1 | Trainingsdokumentation: Aktivitäten aus Strava importieren, manuell erfassen, FIT-Dateien aus Garmin Connect hochladen | Muss |
| F2 | Sportarten verwalten inkl. saisonaler Präferenz (z. B. Herbst mehr Joggen/Fitness, Sommer mehr MTB) | Muss |
| F3 | Sportgeräte verwalten (z. B. zwei Mountainbikes), Zuordnung zu Aktivitäten, Abgleich mit Strava-Gear | Muss |
| F4 | Trainingsvorschläge und -varianten, KI-gestützt, unter Berücksichtigung von Präferenzen, Saison, Wetter, letzter Belastung | Muss |
| F5 | Fortschrittsanzeige (Volumen, Intensität, Trend) | Muss |
| F6 | Fitness-Fortschritte: Leistungswerte und Körpergewicht erfassen und anzeigen | Muss |
| F7 | Connectoren verwalten (Strava verbinden/trennen, Sync-Status, API-Keys für KI) | Muss |
| F8 | Login über Microsoft 365 / Entra ID | Muss |
| F9 | Wochenplan: Vorschläge annehmen, verschieben, als erledigt markieren | Soll |
| F10 | Garmin Connect direkt anbinden | Kann (API aktuell nicht verfügbar, siehe `04-integrationen.md`) |

## Systemziele

- Entwicklung ausschliesslich über Claude Code (Cloud-Sessions oder lokal), kein weiteres IDE-Setup nötig
- Code auf GitHub (bestehender Account), CI über GitHub Actions
- Hosting auf Vercel, Datenbank Neon Postgres (serverless, Vercel-Integration)
- KI-Anbindung über das Vercel AI SDK, Anbieter umschaltbar (Anthropic, OpenAI)
- Dokumentation als Markdown mit Mermaid im Repo (`docs/`)
- Benutzerverwaltung mit Microsoft Entra ID (Auth.js)

## Nicht-Ziele (vorerst)

- Mehrmandantenfähigkeit oder öffentlicher Betrieb (App ist für einen oder wenige Benutzer)
- Native Mobile-App (responsive Web reicht, Garmin-Uhr bleibt Erfassungsgerät)
- Ersatz von Garmin Connect als Rohdaten-Archiv
- Ernährungs-Tracking
