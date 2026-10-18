# ADR 0003 – Strava als primärer Connector, FIT-Upload als Fallback

Status: akzeptiert · Datum: 2026-10-18

## Kontext
Die Rohdaten entstehen auf einer Garmin Epix 2. Der Garmin Connect Developer
Program ist nur für Geschäftskunden und nimmt seit 2026 keine neuen Anträge an.
Garmin Connect synchronisiert bereits automatisch nach Strava, wo auch die
Ausrüstung gepflegt wird.

## Entscheidung
1. Strava-API (OAuth2, Webhook) ist der primäre Import-Weg für Aktivitäten und Gear.
2. FIT-Upload (manueller Export aus Garmin Connect) ist Fallback und Quelle für Garmin-spezifische Werte.
3. Keine inoffiziellen Garmin-Bibliotheken.
4. Connector-Modell bleibt erweiterbar für einen späteren offiziellen Garmin-Connector.

## Konsequenzen
- Abhängigkeit von Strava-API-Bedingungen (siehe ADR 0004)
- Körperdaten (Gewicht, Ruhepuls) vorerst manuell
