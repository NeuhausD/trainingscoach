# Microsoft Entra ID (M365-Login)

1. Entra Admin Center → App registrations → «New registration»
   - Name: `Trainingscoach`
   - Supported account types: «Accounts in this organizational directory only»
   - Redirect URI (Web): `http://localhost:3000/api/auth/callback/microsoft-entra-id`
2. Nach dem Anlegen unter «Authentication» die produktive URI ergänzen:
   `https://<vercel-domain>/api/auth/callback/microsoft-entra-id`
3. «Certificates & secrets» → neues Client Secret (Ablauf notieren, z. B. 24 Monate)
4. Werte übernehmen:
   - `AUTH_MICROSOFT_ENTRA_ID_ID` = Application (client) ID
   - `AUTH_MICROSOFT_ENTRA_ID_SECRET` = Secret-Wert
   - `AUTH_MICROSOFT_ENTRA_ID_ISSUER` = `https://login.microsoftonline.com/<Directory (tenant) ID>/v2.0`
5. «API permissions»: `openid`, `profile`, `email`, `User.Read` (Standard), Admin-Consent erteilen
6. `ALLOWED_EMAILS` in der App auf die eigene Adresse setzen

Wichtig: Der Issuer muss exakt dem Tenant-v2.0-Endpunkt entsprechen, sonst schlägt der Callback mit «invalid issuer» fehl.
