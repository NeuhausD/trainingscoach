# 03 – Datenmodell

Quelle der Wahrheit ist `src/db/schema.ts` (Drizzle). Dieses Dokument erklärt
die Zusammenhänge.

```mermaid
erDiagram
    users ||--o{ sports : "definiert"
    users ||--o{ equipment : "besitzt"
    users ||--o{ activities : "absolviert"
    users ||--o{ body_metrics : "erfasst"
    users ||--o{ performance_metrics : "erfasst"
    users ||--o{ connectors : "verbindet"
    users ||--o{ training_suggestions : "erhält"
    sports ||--o{ sport_preferences : "hat saisonale Gewichtung"
    sports ||--o{ activities : "klassifiziert"
    sports ||--o{ training_suggestions : "betrifft"
    equipment o|--o{ activities : "verwendet in"
    activities o|--o{ training_suggestions : "erfüllt"
    activities ||--o{ exercise_sets : "besteht aus"
    exercises o|--o{ exercise_sets : "Übung"
    users o|--o{ exercises : "eigene Übungen (user_id NULL = Katalog)"

    users {
        uuid id PK
        text email UK
        text name
        text entra_oid UK
        text home_location
        numeric home_lat
        numeric home_lon
        timestamptz created_at
    }
    sports {
        uuid id PK
        uuid user_id FK
        text name
        text category "endurance | strength | team | other"
        text[] strava_types "Ride, MountainBikeRide, Run, WeightTraining, IceSkate"
        bool active
    }
    sport_preferences {
        uuid id PK
        uuid sport_id FK
        text season "spring | summer | autumn | winter"
        int weight "0..10"
        int target_sessions_per_week
        text notes
    }
    equipment {
        uuid id PK
        uuid user_id FK
        text name
        text kind "bike_xc | bike_trail | shoes | home_gym | other"
        text strava_gear_id UK
        bool retired
        text notes
        jsonb settings "Modell, Kolben, Stufen, Seilzug, Zubehör, Stufe→kg"
    }
    activities {
        uuid id PK
        uuid user_id FK
        uuid sport_id FK
        uuid equipment_id FK
        text source "strava | fit | manual"
        text external_id UK "strava activity id"
        timestamptz started_at
        int duration_s
        numeric distance_m
        numeric elevation_gain_m
        int avg_hr
        int max_hr
        int avg_power_w
        numeric training_load
        int rpe "1..10, manuell"
        text title
        text notes
        jsonb raw_summary
    }
    exercises {
        uuid id PK
        uuid user_id FK "NULL = gemeinsamer Katalog"
        text name
        text source "eisenhorn | free-exercise-db | manual"
        text external_ref UK "Eisenhorn-Nummer oder free-exercise-db-ID"
        text[] primary_muscles
        text[] secondary_muscles
        text[] accessories "griffstange, griffband, blocker, karabiner, seilzug"
        bool requires_cable_pulley
        text url
    }
    exercise_sets {
        uuid id PK
        uuid activity_id FK
        uuid exercise_id FK
        int position
        int reps
        numeric weight_kg
        numeric level "Eisenhorn-Stufe"
        int rpe
        text notes
    }
    body_metrics {
        uuid id PK
        uuid user_id FK
        date measured_on
        numeric weight_kg
        int resting_hr
        numeric body_fat_pct
        text notes
    }
    performance_metrics {
        uuid id PK
        uuid user_id FK
        date measured_on
        text metric "ftp_w | vo2max | squat_1rm_kg | deadlift_1rm_kg | bench_1rm_kg | sprint_peak_w | climb_test_s"
        numeric value
        text unit
        text notes
    }
    connectors {
        uuid id PK
        uuid user_id FK "unique mit provider"
        text provider "strava"
        text external_athlete_id "Strava-Athlete-ID, Schlüssel für Webhooks"
        text athlete_name
        text access_token_enc "AES-GCM"
        text refresh_token_enc "AES-GCM"
        timestamptz expires_at
        timestamptz last_sync_at
        text last_error
        text status "connected | error | disconnected"
    }
    training_suggestions {
        uuid id PK
        uuid user_id FK
        uuid sport_id FK
        uuid completed_activity_id FK
        date planned_on
        text title
        text description
        int duration_min
        text intensity "recovery | endurance | tempo | threshold | vo2max | strength | power"
        jsonb variants
        text status "suggested | accepted | done | skipped"
        text model "z. B. claude-sonnet-5-5"
        jsonb context_snapshot
    }
```

## Migrationen und Seed

- Migrationen liegen in `drizzle/` und entstehen mit `npm run db:generate` aus
  `src/db/schema.ts`; `npm run db:migrate` (`scripts/migrate.ts`, Neon-HTTP-Treiber,
  läuft auch in Cloud-Sessions) spielt sie ein (`db:push` nur für Wegwerf-Datenbanken).
- Eindeutigkeit: `sports(user_id, name)`, `equipment(user_id, name)` und
  `sport_preferences(sport_id, season)`. Dadurch sind Seed und Speichern der
  Präferenzen idempotente Upserts.
- Der Benutzer wird beim ersten Seitenaufruf nach dem Login aus der Session
  angelegt (`lib/users.ts`, Upsert über `entra_oid`).
- Seed (`lib/domain/seed-data.ts`, Ausführung in `lib/master-data/seed.ts`):
  Sportarten Mountainbike, Jogging, Kraft Studio, Kraft Eisenhorn, Eishockey
  und «Sonstiges» mit Gewichtung je Saison sowie die Geräte «XC-Bike» und
  «Trail-Bike». Läuft über `npm run db:seed -- <email>` oder den Button
  «Stammdaten anlegen» auf der leeren Sportarten-Seite. Bestehende Sportarten
  (gleicher Name) werden nie überschrieben; Geräte werden nur angelegt, wenn
  noch keines dieses Typs existiert (umbenannte Bikes bleiben allein).

## Fachliche Regeln

- **Saison** wird aus dem Datum abgeleitet (`lib/domain/season.ts`): Frühling März–Mai, Sommer Juni–August, Herbst September–November, Winter Dezember–Februar. Der Athlet kann die Gewichtung pro Sportart und Saison in `sport_preferences` setzen (0 = nie, 10 = Schwerpunkt; Validierung und Vervollständigung auf vier Saisons in `lib/domain/preferences.ts`). Fehlt ein Eintrag, gilt Gewichtung 5. Die Sportarten-Seite sortiert nach der Gewichtung der aktuellen Saison.
- **Sportart-Zuordnung** beim Import: Strava `sport_type` → `sports.strava_types`. Nicht zuordenbare Aktivitäten landen in einer Sportart «Sonstiges» und können manuell umgehängt werden.
- **Geräteparameter** (`equipment.settings`, Validierung in `lib/domain/equipment-settings.ts`): nur für Heimtrainingsgeräte wie das Eisenhorn. Modell, Kolben, Anzahl Stufen, Halbstufen, Seilzug, Zubehör und optional die Tabelle Stufe → Kilogramm. Die Widerstandsstufe wird je Kraftsatz erfasst (P2) und über die Tabelle in Kilogramm umgerechnet.
- **Übungskatalog** (ADR 0006): Tabelle `exercises` mit `user_id NULL` für den gemeinsamen Katalog: 161 Eisenhorn-Übungen aus `lib/domain/eisenhorn-catalog.json` (Nummer, Muskelgruppen, Zubehör) und kuratierte Studio-Übungen aus `lib/domain/gym-exercises.ts` (Muskelzuordnung aus free-exercise-db). Elf Muskel-Schlüssel: back, biceps, calves, chest, core, forearms, glutes, legs, neck, shoulders, triceps. Eigene Übungen entstehen beim Erfassen eines Satzes («Neue Übung»). Der Katalog wird mit `npm run db:seed` oder dem Button «Übungskatalog anlegen» befüllt; `feasibleExercises()` filtert Eisenhorn-Übungen nach vorhandenem Zubehör.
- **Manuelle Erfassung** (`lib/domain/activity-input.ts`): Datum und Startzeit werden in `Europe/Zurich` eingegeben und als UTC gespeichert (`lib/domain/time.ts`). Dauer in Minuten, RPE 1–10 (`lib/domain/rpe.ts`), optional Distanz, Höhenmeter, Puls. Die Belastung wird beim Speichern berechnet: HF-basiert, wenn Durchschnitts- und Maximalpuls sowie ein Ruhepuls aus `body_metrics` vorliegen, sonst aus Dauer × RPE.
- **Kraftsätze** (`lib/domain/strength.ts`): je Satz Wiederholungen plus Gewicht in kg (Studio) oder Eisenhorn-Stufe; Kilogramm aus der Stufe über `equipment.settings.kgPerLevel`. `setsByMuscle()` zählt Sätze je Muskelgruppe (Primär 1, Sekundär 0.5) als Grundlage für Vorschläge in P6.
- **Körper- und Leistungswerte** (`lib/domain/metrics.ts`): Gewicht und Ruhepuls pro Tag, Leistungswerte mit Einheit je Kennzahl; `weightTrend()` liefert das 7-Tage-Mittel.
- **Ausrüstung** beim Import: Strava `gear_id` → `equipment.strava_gear_id`. Unbekanntes Gear wird automatisch als neues Gerät angelegt (Name aus Strava, MTB-Rahmen → Trail-Bike als Vorschlag, sonst «Sonstiges»), Typ wird nachträglich gesetzt. Bestehende Geräte bekommen ihre Gear-ID im Geräteformular.
- **Strava-Import** (`lib/domain/strava-mapping.ts`, `lib/strava/sync.ts`): `activities.external_id` = `strava:<id>`, Quelle `strava`. Beim Aktualisieren bleiben manuell gesetzte Sportart und Gerät erhalten, Messwerte und Titel werden übernommen. `raw_summary` enthält nur Strava-ID, Sporttyp, Gear-ID und Trainer-Flag, keine Streams. Belastung aus Leistung (nur `device_watts`) mit FTP aus `performance_metrics`, sonst Puls, sonst 0.
- **Belastung** (`training_load`): wenn Leistungsdaten vorhanden, TSS-ähnlich aus Leistung und FTP; sonst HF-basiert (TRIMP); bei Kraft und Eishockey aus Dauer × RPE. Berechnung in `lib/domain/load.ts`, bewusst einfach und nachvollziehbar.
- **Fortschritt**: Vergleich rollierender 4-Wochen-Fenster (Volumen, Belastung, Höhenmeter), Trend der `performance_metrics` je Metrik, Gewichtstrend als 7-Tage-Mittel.
- **Vorschläge** werden nie automatisch zu Aktivitäten. Erst wenn eine passende Aktivität importiert wird oder der Athlet sie als erledigt markiert, wird `completed_activity_id` gesetzt.
