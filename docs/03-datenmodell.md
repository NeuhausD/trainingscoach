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
        uuid user_id FK
        text provider "strava"
        text external_athlete_id
        text access_token_enc
        text refresh_token_enc
        timestamptz expires_at
        timestamptz last_sync_at
        text status
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

## Fachliche Regeln

- **Saison** wird aus dem Datum abgeleitet (`lib/domain/season.ts`): Frühling März–Mai, Sommer Juni–August, Herbst September–November, Winter Dezember–Februar. Der Athlet kann die Gewichtung pro Sportart und Saison in `sport_preferences` setzen (0 = nie, 10 = Schwerpunkt).
- **Sportart-Zuordnung** beim Import: Strava `sport_type` → `sports.strava_types`. Nicht zuordenbare Aktivitäten landen in einer Sportart «Sonstiges» und können manuell umgehängt werden.
- **Ausrüstung** beim Import: Strava `gear_id` → `equipment.strava_gear_id`. Unbekanntes Gear wird automatisch als neues Gerät angelegt (Name aus Strava), Typ wird nachträglich gesetzt.
- **Belastung** (`training_load`): wenn Leistungsdaten vorhanden, TSS-ähnlich aus Leistung und FTP; sonst HF-basiert (TRIMP); bei Kraft und Eishockey aus Dauer × RPE. Berechnung in `lib/domain/load.ts`, bewusst einfach und nachvollziehbar.
- **Fortschritt**: Vergleich rollierender 4-Wochen-Fenster (Volumen, Belastung, Höhenmeter), Trend der `performance_metrics` je Metrik, Gewichtstrend als 7-Tage-Mittel.
- **Vorschläge** werden nie automatisch zu Aktivitäten. Erst wenn eine passende Aktivität importiert wird oder der Athlet sie als erledigt markiert, wird `completed_activity_id` gesetzt.
