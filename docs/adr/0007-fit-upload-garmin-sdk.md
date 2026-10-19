# ADR 0007 – FIT-Upload mit dem offiziellen Garmin FIT SDK

Status: akzeptiert · Datum: 2026-10-19

## Kontext
Strava liefert Dauer, Distanz, Puls und Leistung, aber nicht die Garmin-eigenen
Werte der Epix 2: Training Effect (aerob, anaerob), Garmin-Belastung
(`training_load_peak`), Kalorien und VO2max. Ein offizieller Garmin-Connector
ist nicht verfügbar (ADR 0003). Garmin Connect erlaubt den Export der
Original-FIT-Datei je Aktivität.

## Entscheidung
1. FIT-Dateien werden mit dem offiziellen Paket `@garmin/fitsdk` dekodiert
   (FIT Protocol License, Nutzung für eigene Software erlaubt). Keine
   inoffiziellen Parser.
2. Übernommen werden nur die Summen der `session`-Nachricht und die Datei-ID.
   Records, GPS-Punkte und Streams werden verworfen, nicht gespeichert und
   nie an ein LLM gesendet (ADR 0004).
3. VO2max stammt aus der undokumentierten Nachricht 140, Feld 7
   (`MaxMET`, VO2max = Wert × 3.5 / 65536). Nur plausible Werte (20–95)
   werden als Leistungswert `vo2max` am Tag der Aktivität gespeichert,
   höchstens einer pro Tag.
4. Dedup: Kennung `fit:<Seriennummer>:<Erstellzeit>`. Eine bestehende
   Aktivität (Strava oder manuell) mit Start innerhalb von drei Minuten und
   ähnlicher Dauer wird um die Garmin-Werte ergänzt statt doppelt angelegt;
   Strava-Messwerte bleiben, nur Lücken werden gefüllt.
5. Die Datei selbst wird nur abgelegt, wenn `BLOB_READ_WRITE_TOKEN` gesetzt
   ist (Vercel Blob, privat). Ohne Token wird sie ausgewertet und verworfen.
6. Upload per Server Action, Grenze 4 MB je Datei und 10 Dateien je Aufruf
   (Vercel-Functions erlauben 4.5 MB je Anfrage).

## Konsequenzen
- Garmin-Werte sind ein manueller Zusatz; der Abgleich bleibt Strava.
- Die eigene Belastung (`training_load`) bleibt die Vergleichsgrösse im
  Fortschritt; die Garmin-Belastung steht daneben.
- Sollte Garmin die Nachricht 140 ändern, fällt nur VO2max still weg.
- Grössere Dateien (lange Touren mit 1-s-Aufzeichnung) brauchen später einen
  Client-Upload direkt nach Blob.
