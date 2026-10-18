# ADR 0004 – KI erhält nur aggregierte, selbst berechnete Kennzahlen

Status: akzeptiert · Datum: 2026-10-18

## Kontext
Die Strava-API-Vereinbarung untersagt die Nutzung von API-Daten in
«KI-Modellen oder ähnlichen Anwendungen». Ob reine Inferenz mit eigenen Daten
darunter fällt, ist nicht öffentlich geklärt.

## Entscheidung
Der Kontext für das LLM wird ausschliesslich aus (a) von der App berechneten
Aggregaten (Volumen, Belastung, Anzahl Einheiten pro Sportart und Woche),
(b) manuell erfassten Daten (Präferenzen, Ziele, Körper- und Leistungswerte)
und (c) FIT-Uploads zusammengesetzt. Rohe Strava-Antworten (Aktivitätsdetails,
Streams, Titel, Beschreibungen) werden nicht an Modelle gesendet. Der
verwendete Kontext wird pro Vorschlag als `context_snapshot` gespeichert,
damit er nachvollziehbar ist.

## Konsequenzen
- Vorschläge sind etwas weniger detailreich, aber robust gegen Regeländerungen
- Die App bleibt ohne Strava voll funktionsfähig (manuell + FIT)
- Falls Strava die Frage klärt, kann der Kontext per Flag erweitert werden
