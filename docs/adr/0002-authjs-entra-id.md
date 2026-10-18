# ADR 0002 – Login mit Microsoft Entra ID über Auth.js

Status: akzeptiert · Datum: 2026-10-18

## Kontext
Benutzer sollen sich mit bestehenden M365/Azure-Konten anmelden. Die App hat
einen bis wenige Benutzer.

## Entscheidung
Auth.js v5 (`next-auth@beta`) mit Provider `microsoft-entra-id`, JWT-Sessions
(kein DB-Adapter), zusätzlich E-Mail-Allowlist `ALLOWED_EMAILS`. Benutzer
werden beim ersten Login in `users` angelegt (Schlüssel: Entra Object-ID).

## Alternativen
- MSAL direkt: mehr Code, kein Mehrwert
- Clerk/Auth0: zusätzlicher Dienst und Kosten
- Entra External ID (B2C): nur nötig, wenn Fremde ohne Tenant-Konto einloggen sollen

## Konsequenzen
- App-Registrierung im Tenant nötig (siehe `docs/setup/entra-id.md`)
- Preview-Deployments mit wechselnder URL können nicht als Redirect-URI registriert werden; Login-Tests auf Preview nur mit fester Preview-Domain
