---
name: adr
description: Legt einen Architecture Decision Record in docs/adr an. Verwenden bei "/adr <Titel>" oder wenn während der Arbeit eine architekturrelevante Entscheidung fällt (Bibliothek, Datenfluss, Sicherheit, externe API).
---

# ADR anlegen

1. Nächste Nummer bestimmen: höchste Nummer in `docs/adr/` plus eins, vierstellig.
2. Datei `docs/adr/NNNN-<kebab-titel>.md` mit dieser Struktur anlegen:

```markdown
# ADR NNNN – <Titel>

Status: vorgeschlagen | akzeptiert | abgelöst durch ADR MMMM · Datum: <YYYY-MM-DD>

## Kontext
## Entscheidung
## Alternativen
## Konsequenzen
```

3. Kurz und konkret: Kontext in 3–5 Sätzen, mindestens zwei Alternativen mit je einem Satz Begründung, Konsequenzen inklusive Nachteilen.
4. Falls die Entscheidung `docs/02-architektur.md` oder `docs/04-integrationen.md` betrifft, dort den Verweis «siehe ADR NNNN» ergänzen.
5. Titel: $ARGUMENTS
