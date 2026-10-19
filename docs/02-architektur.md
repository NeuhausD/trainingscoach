# 02 – Architektur

## Systemkontext

```mermaid
C4Context
    title Systemkontext Trainingscoach
    Person(athlete, "Athlet", "Hobby-Sportler, einziger aktiver Benutzer")
    System(app, "Trainingscoach", "Next.js App auf Vercel: Dokumentation, Planung, KI-Vorschläge")
    System_Ext(entra, "Microsoft Entra ID", "Login mit M365-Konto")
    System_Ext(strava, "Strava API", "Aktivitäten und Ausrüstung (Gear)")
    System_Ext(garmin, "Garmin Connect", "Quelle der Rohdaten; sync nach Strava, FIT-Export")
    System_Ext(llm, "Anthropic / OpenAI", "KI-Trainingsvorschläge")
    System_Ext(weather, "Open-Meteo", "Wettervorhersage für Plaffeien / Freiburg")
    Rel(athlete, app, "nutzt", "HTTPS")
    Rel(app, entra, "OIDC Login")
    Rel(app, strava, "OAuth2, REST, Webhooks")
    Rel(garmin, strava, "automatischer Sync (vom Athleten konfiguriert)")
    Rel(athlete, app, "lädt FIT-Dateien hoch (Fallback)")
    Rel(app, llm, "Vercel AI SDK")
    Rel(app, weather, "REST, ohne Key")
```

## Container

```mermaid
flowchart LR
    subgraph Browser
        UI[React UI<br/>Next.js App Router]
    end
    subgraph Vercel
        RSC[Server Components<br/>+ Server Actions]
        API[Route Handlers<br/>/api/*]
        CRON[Vercel Cron<br/>Sync, Wochenplan]
    end
    subgraph Daten
        PG[(Neon Postgres<br/>Drizzle ORM)]
        BLOB[(Vercel Blob<br/>FIT-Dateien)]
    end
    subgraph Extern
        ENTRA[Entra ID]
        STRAVA[Strava]
        AI[Anthropic / OpenAI]
        MET[Open-Meteo]
    end
    UI --> RSC
    UI --> API
    RSC --> PG
    API --> PG
    API --> BLOB
    CRON --> API
    RSC --> ENTRA
    API --> STRAVA
    STRAVA -- Webhook --> API
    API --> AI
    API --> MET
```

## Technologie-Entscheidungen

| Bereich | Wahl | Begründung |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | Vercel-nativ, Server Components, Route Handlers, Cron |
| UI | Tailwind CSS 4 | Schnell, keine Design-System-Abhängigkeit |
| Auth | Auth.js v5 (`next-auth@beta`) mit Provider `microsoft-entra-id` | Offizieller Entra-ID-Provider, JWT-Session ohne DB-Adapter |
| DB | Neon Postgres + Drizzle ORM | Serverless, Vercel-Marketplace, typsichere Migrationen |
| Dateien | Vercel Blob | FIT-Uploads, einfache Anbindung |
| KI | Vercel AI SDK 7 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`) | Ein Interface, Anbieter per Env umschaltbar, strukturierte Ausgaben mit Zod |
| Wetter | Open-Meteo | Kostenlos, ohne Key, 7-Tage-Vorhersage |
| Tests | Vitest | Schnell, TS-nativ |
| CI | GitHub Actions | Lint, Typecheck, Build, Tests pro PR |

Details zu den Entscheidungen in `docs/adr/`.

## Modulstruktur (Code)

```text
src/
  app/                    Routen (App Router)
    (auth)/login          Login-Seite
    dashboard/            Übersicht, Fortschritt
    activities/           Aktivitätenliste, Detail, manuelle Erfassung, FIT-Upload
    plan/                 Wochenplan und KI-Vorschläge
    sports/               Sportarten und saisonale Präferenzen (Liste, new, [id]; actions.ts)
    equipment/            Sportgeräte (Liste, new, [id]; actions.ts)
    metrics/              Körpergewicht, Leistungswerte
    settings/connectors/  Strava verbinden, KI-Anbieter
    api/auth/[...nextauth] Auth.js Handler
    api/strava/*          OAuth-Callback, Webhook, Sync
    api/coach/*           KI-Vorschläge
    api/cron/*            geplante Jobs
  auth.ts                 Auth.js Konfiguration
  proxy.ts                Routen-Schutz (Next.js 16 "Proxy", früher Middleware)
  db/                     Drizzle Schema, Client, Migrationen
  lib/
    users.ts              Session -> DB-Benutzer (Upsert)
    master-data/          DB-Zugriffe für Sportarten, Präferenzen, Geräte, Seed
    domain/               reine Fachlogik (Saison, Belastung, Präferenzen, Seed-Daten), gut testbar
    strava/               API-Client, Mapping Strava -> Activity
    fit/                  FIT-Parser
    ai/                   Provider-Auswahl, Prompts, Zod-Schemas
    weather/              Open-Meteo Client
  components/             UI-Bausteine (AppShell, NavLinks, SeasonProfile, PageHeader, SubmitButton, DeleteButton, ui.ts)
drizzle/                  generierte SQL-Migrationen (db:generate / db:migrate)
docs/                     Architektur, ADRs, Setup
.claude/                  Projekt-Skills und Einstellungen für Claude Code
```

## Ablauf: Login

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as Next.js (Auth.js)
    participant E as Entra ID
    B->>A: GET /dashboard
    A->>A: proxy.ts: keine Session
    A-->>B: Redirect /login
    B->>A: Sign in mit Microsoft
    A-->>B: Redirect login.microsoftonline.com/{tenant}/v2.0
    B->>E: Anmeldung (MFA etc.)
    E-->>B: Redirect /api/auth/callback/microsoft-entra-id?code=...
    B->>A: Callback
    A->>E: Code gegen Token tauschen
    A->>A: Allowlist prüfen (ALLOWED_EMAILS)
    A-->>B: Session-Cookie (JWT), Redirect /dashboard
    B->>A: GET /sports (oder andere Seite mit Daten)
    A->>A: requireUser(): Benutzer aus Session anlegen/aktualisieren (Upsert entra_oid)
```

Seiten und Server Actions, die Daten lesen oder schreiben, holen den Benutzer
über `lib/users.ts#requireUser()`. Server Actions prüfen die Session damit
selbst, weil sie per POST direkt erreichbar sind.

## Ablauf: Strava-Sync

```mermaid
sequenceDiagram
    participant U as Athlet
    participant G as Garmin Epix 2 / Connect
    participant S as Strava
    participant A as Trainingscoach
    participant DB as Postgres
    U->>G: Aktivität aufzeichnen
    G->>S: automatischer Upload (Garmin Connect -> Strava)
    S->>A: Webhook: activity create
    A->>S: GET /activities/{id} (mit gespeichertem Refresh-Token)
    A->>S: GET /gear/{gear_id} (falls unbekannt)
    A->>DB: upsert activity, equipment
    A->>A: Kennzahlen neu berechnen (Wochenvolumen, Belastung)
    Note over A: Nachtlicher Cron holt zusätzlich die letzten 30 Tage als Sicherheitsnetz
```

## Ablauf: KI-Trainingsvorschlag

```mermaid
sequenceDiagram
    participant U as Athlet
    participant A as Trainingscoach
    participant DB as Postgres
    participant W as Open-Meteo
    participant L as LLM (Anthropic/OpenAI)
    U->>A: "Vorschläge für diese Woche"
    A->>DB: Präferenzen (Saison), Geräte, aggregierte Belastung 4 Wochen, Ziele, letzte Leistungswerte
    A->>W: 7-Tage-Vorhersage für Standort
    A->>A: Kontext zusammenstellen (nur aggregierte Kennzahlen, keine Rohdaten)
    A->>L: generateObject(schema: Wochenplan)
    L-->>A: strukturierter Plan (Einheiten mit Sportart, Dauer, Intensität, Variante)
    A->>DB: Vorschläge speichern (Status: vorgeschlagen)
    A-->>U: Plan anzeigen, annehmen / verwerfen / variieren
```

Wichtig: Der KI-Kontext enthält **nur aggregierte und selbst berechnete
Kennzahlen** sowie manuell erfasste Daten. Rohdaten aus der Strava-API werden
nicht an das Modell gesendet. Hintergrund in `04-integrationen.md`
(Strava-API-Bedingungen).

## Deployment

```mermaid
flowchart LR
    DEV[Claude Code Session] -- git push --> GH[GitHub Repo]
    GH -- PR --> CI[GitHub Actions<br/>lint, typecheck, test, build]
    GH -- Push main --> VERCEL[Vercel<br/>Production]
    GH -- PR Branch --> PREVIEW[Vercel<br/>Preview Deployment]
    VERCEL --> NEON[(Neon Postgres<br/>main branch)]
    PREVIEW --> NEONDEV[(Neon Postgres<br/>preview branch)]
```

Umgebungen:

| Umgebung | Auslöser | DB | Entra-Redirect-URI |
|---|---|---|---|
| Lokal / Cloud-Session | `npm run dev` | Neon dev-branch | `http://localhost:3000/api/auth/callback/microsoft-entra-id` |
| Preview | PR | Neon preview-branch | `https://<preview>.vercel.app/...` (Wildcard in Entra nicht möglich, daher Preview ohne Login-Test oder feste Preview-Domain) |
| Production | Push auf `main` | Neon main | `https://trainingscoach.<domain>/api/auth/callback/microsoft-entra-id` |

## Sicherheit

- Login nur für E-Mails in `ALLOWED_EMAILS` (zusätzlich zur Entra-App-Registrierung, die bereits auf den eigenen Tenant beschränkt ist)
- Strava-Tokens verschlüsselt in der DB (AES-GCM mit `TOKEN_ENCRYPTION_KEY`)
- API-Keys für KI-Anbieter ausschliesslich als Vercel-Env-Variablen, nie in der DB
- Alle `/api/*`-Routen prüfen die Session, Webhook-Route prüft Strava-Verify-Token
- Keine personenbezogenen Daten Dritter (nur eigene Aktivitäten)
