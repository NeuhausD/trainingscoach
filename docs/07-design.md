# 07 – Design

Die App wird meist am Handy genutzt, auf Deutsch, von einem Athleten in den
Freiburger Voralpen. Das Design soll ruhig und sportlich wirken und die
Saison als Kernkonzept sichtbar machen. Grundlage sind die Skills
`frontend-design` (Anthropic) und `web-design-guidelines` (Vercel) in
`.claude/skills/`. Quelle der Tokens ist `src/app/globals.css`.

## Tokens

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `paper` | `#F2F4F1` | `#0F1512` | Seitenhintergrund (kühles Steingrau, bewusst keine Creme) |
| `paper-raised` | `#FFFFFF` | `#17201B` | Formulargruppen, Eingabefelder |
| `ink` | `#16211C` | `#ECEFEA` | Text |
| `moss` | `#2F5D46` | `#7DBF9A` | Einzige Aktionsfarbe: Buttons, Links, Fokus, aktive Navigation |
| `mist` | `#D5DBD6` | `#27332C` | Trennlinien, Rahmen |
| `stone` | `#5E6B64` | `#98A59E` | Sekundärtext |
| `danger` | `#A33A2A` | `#E08A7A` | Fehler, Löschen |
| `season-spring` | `#5FA052` | `#7FC471` | Frühling |
| `season-summer` | `#D99A1C` | `#E9B347` | Sommer |
| `season-autumn` | `#C4622D` | `#E07D4B` | Herbst |
| `season-winter` | `#4F8FC2` | `#74ADDA` | Winter |

Saisonfarben markieren ausschliesslich die aktuelle Saison (Saisonwort in
der Statuszeile der Übersicht, Balken im Saisonprofil). Alles andere bleibt
in Moos und Grau.

## Typografie

Eine Familie, zwei Weiten, geladen über `next/font/google`:

- **Barlow** 400/500/600 für Text, Formulare, Navigation
- **Barlow Condensed** 500/600/700 für Titel, Saisonname und grosse Zahlen

Zahlen sind tabellarisch (`font-feature-settings: "tnum"`), Titel werden mit
`text-wrap: balance` umbrochen. Keine Versalien-Labels, keine Eyebrows, keine
Pfeile in Buttons.

## Leitelement: Saisonprofil

`src/components/season-profile.tsx`. Vier Balken je Sportart, Höhe =
Gewichtung 0..10 in der Reihenfolge Frühling, Sommer, Herbst, Winter. Die
aktuelle Saison trägt ihre Saisonfarbe, die anderen Stein, Gewichtung 0
Nebel. Erscheint in der Sportarten-Liste und gross im Bearbeiten-Formular. Barrierefrei über `role="img"` mit textueller
Beschreibung.

## Erfassungsformulare

- Sportart als Reihe von Tipp-Flächen (Radio-Buttons mit `peer`-Styling), nicht als Dropdown.
- RPE als Raster von zehn Flächen mit Zahl in Barlow Condensed und Wortlabel darunter; das mutige Element des Formulars.
- Dauer mit Schnellauswahl (30, 45, 60, 90, 120 min), Datum und Startzeit sind vorbelegt (heute, jetzt auf 5 min gerundet), Dauer und Gerät aus der letzten Einheit derselben Sportart.
- Selten gebrauchte Felder (Titel, Distanz, Puls, Notiz) in einem zugeklappten `<details>`.

## Diagramme

- Balken je Sportart (`src/components/sport-bars.tsx`): Zeit als Länge, Einheiten als Beschriftung am Balkenende, 20 px dick, 4 px Rundung nur am Datenende, eine Farbe (Moos), Text in Tinte und Stein. Keine zweite Achse, keine Legende bei einer Grösse; die Aktivitätenliste ist die Tabellensicht. Die Übersicht zeigt darüber die Bewertung nach Leistungsnutzen als Zeilen: Urteil-Chip (Moos gut, Stein mittel, Warnrot zu wenig oder zu viel), Dimension, Kurzwert und ein Satz zur Wirkung.
- Säulen (`columns.tsx`): eine Farbe, höchstens 24 px breit, 4 px Rundung an der Kappe, Basislinie als Hairline; nur die hervorgehobene Säule trägt einen Wert, jede Säule einen Hover-Titel.
- Linie (`line-chart.tsx`): SVG, 2 px, Endpunkt 10 px mit Ring in Papierfarbe, Wert am Ende, Spanne unten.
- Jahresübersicht als kleine Vielfache je Sportart (eine Reihe Mini-Säulen pro Sportart) statt gestapelter Mehrfarben-Balken; so braucht es keine Farblegende.
- Plan gegen Ist (Coach): je Sportart ein Balken, gefüllt für trainierte Minuten, ein Rahmen in Stein für geplante Minuten, gleiche Skala; Beschriftung als «trainiert / geplant min», Erklärung in der Bildunterschrift statt Legende.
- Vergleichskacheln: Wert in Barlow Condensed, Veränderung in Prozent mit Vorperiode in Klammern; Text in Tinte und Stein.
- Mehrere Serien erst, wenn nötig; dann feste Farbreihenfolge und Legende (Dataviz-Skill).

## Layout

- App-Shell (`src/components/app-shell.tsx`): Kopfzeile mit Wortmarke und
  darunter die Tab-Reihe, beides oben fixiert (`sticky`, Safe-Area oben).
  Keine Leiste am unteren Rand: dort liegen auf dem iPhone die Wischgeste
  zum Home-Bildschirm und die Safari-Adressleiste, Tipps gingen verloren.
  Fünf Tabs: Übersicht, Training, Coach, Fortschritt, Sportarten; am Handy
  gleich breit mit Unterstrich in Moos, ab `sm` als Pillen in der Kopfzeile.
  Geräte und Werte hängen unter Sportarten bzw. Fortschritt (Tab bleibt
  aktiv). Inhalte linksbündig, maximal `max-w-2xl`.
- Übersicht: zuerst die Aussicht (nächste Einheit als Titel in Barlow
  Condensed, folgende Tage als Zeilen), dann der Rückblick (vier Wochen mit
  Balken, letzte Einheit). Saison und Schwerpunkte sind eine Statuszeile
  unter der Begrüssung, kein Hero.
- Listen als Zeilen mit `divide-y divide-mist`, keine Karten-Raster.
- Formulare in Gruppen (`panel`), die aktuelle Saison mit Moos-Ring.
- Gemeinsame Klassen in `src/components/ui.ts`.

## Verhalten und Qualität

- Fokus sichtbar über `:focus-visible` (Moos, 2 px).
- `prefers-reduced-motion` schaltet Übergänge ab; es gibt keine
  Einblend-Animationen, nur Farbübergänge bei Hover und Navigation.
- Dark Mode über `prefers-color-scheme`, `color-scheme` und
  `theme-color` passen sich an.
- Sprache: Sätze statt Labels, aktive Verben auf Buttons («Änderungen
  speichern», «Gerät anlegen»), Fehlermeldungen nennen den nächsten Schritt.
- Vor dem Ship: `/web-design-guidelines` auf die geänderten UI-Dateien.
