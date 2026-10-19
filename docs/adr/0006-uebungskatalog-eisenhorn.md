# ADR 0006 – Übungskatalog mit Eisenhorn-Integration

Status: vorgeschlagen · Datum: 2026-10-19

## Kontext
Der Athlet trainiert Kraft im Studio und zuhause am Eisenhorn (wandmontierte
Kraftstation, Widerstand aus einem Gasdruck-Kolben, ältere Generation mit
Kolben «16» und 10 Stufen, ohne Seilzug). Das Eisenhorn ist Ergänzung zum
Kraftraum: kurze, klare Einheiten zwischendurch. Fast jede Übung bedingt einen
Umbau (Schlittenhöhe, Griffstange oder Griffband, Blocker), deshalb sollen
Vorschläge wenige Übungen mit gleichem Aufbau kombinieren. Der Hersteller
bietet eine Übungsdatenbank mit 161 Übungen (Name, Muskelgruppen, Zubehör,
Video, Anleitung), aber keine API; Texte und Videos sind geschützt.

## Entscheidung
- Geräte bekommen ein JSON-Feld `settings` für gerätespezifische Parameter
  (Modell, Kolben, Stufen, Halbstufen, Seilzug, Zubehör, Tabelle Stufe → kg).
  Die Widerstandsstufe gehört zum einzelnen Satz, nicht zum Gerät.
- Der Eisenhorn-Katalog liegt als Fakten im Repo
  (`src/lib/domain/eisenhorn-catalog.json`: Nummer, Name, Muskelgruppen,
  Zubehör). Anleitung und Video werden auf die Herstellerseite verlinkt, nie
  kopiert. Kein Laufzeit-Zugriff auf eisenhorn.com.
- Für Studio-Übungen dient free-exercise-db (Public Domain) als Basis; die
  Muskelgruppen beider Quellen werden auf dieselben elf Schlüssel abgebildet.
- Vorschläge für das Eisenhorn: Muskelgruppen, die zuletzt nicht trainiert
  wurden, nur mit vorhandenem Zubehör ausführbar, geringer Umbauaufwand,
  5 bis 10 Minuten. Der KI-Kontext erhält Katalog und Belastung je
  Muskelgruppe, keine Rohdaten (ADR 0004 bleibt unberührt).

## Alternativen
- wger-API zur Laufzeit: deutsche Texte und freie Lizenz, aber externe
  Abhängigkeit im Betrieb und kein Eisenhorn-Bezug.
- Hersteller-Texte und Videos importieren: urheberrechtlich nicht zulässig.
- Nur Freitext-Notizen statt Katalog: keine Auswertung nach Muskelgruppen
  möglich.

## Konsequenzen
- Katalog ist eine Momentaufnahme (Oktober 2026); Aktualisierung manuell per
  Skript, wenn der Hersteller Übungen ergänzt.
- Kilogramm je Stufe sind für die ältere Generation nicht öffentlich; der
  Athlet trägt sie bei Bedarf selbst in den Geräteparametern ein.
- Phase P2 erfasst Kraftsätze je Übung (Tabelle `exercise_sets`), Phase P6
  nutzt den Katalog für Vorschläge nach Muskelgruppe.
