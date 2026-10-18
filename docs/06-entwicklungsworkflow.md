# 06 – Entwicklungsworkflow mit Claude Code

## Grundsatz

Claude Code ist das einzige Entwicklungs-Frontend. Alles, was Claude für gute
Arbeit braucht, liegt im Repo: `CLAUDE.md` (Regeln), `docs/` (Kontext),
`.claude/skills/` (wiederkehrende Abläufe), `.claude/settings.json`
(Berechtigungen, Hooks).

```mermaid
flowchart LR
    IDEA[Idee / Phase aus Roadmap] --> SESSION[Claude Code Session<br/>Branch feat/...]
    SESSION --> PLAN[Plan Mode oder /feature-Skill:<br/>Plan, betroffene Dateien, Tests]
    PLAN --> BUILD[Implementieren, Tests, Lint, Build]
    BUILD --> PR[git push, PR mit Zusammenfassung]
    PR --> CI[GitHub Actions]
    PR --> PREVIEW[Vercel Preview]
    CI --> REVIEW[/code-review in Claude Code]
    REVIEW --> MERGE[Merge in main]
    MERGE --> PROD[Vercel Production]
    MERGE --> DOCS[docs/ und ADRs nachführen]
```

## GSD (Get Shit Done) einbetten oder ersetzen?

### Lage

- Das ursprüngliche Repo `gsd-build/get-shit-done` ist archiviert. Das Projekt
  lebt als **GSD Core** weiter (`open-gsd/gsd-core`), Installation per
  `npx @opengsd/gsd-core@latest` mit Wahl des Runtimes (Claude Code) und des
  Scopes (global oder lokal im Projekt).
- GSD bringt eigene Commands (`/gsd-new-project`, `/gsd-onboard`, Phasen
  Discuss → Plan → Execute → Verify → Ship), Agents und Hooks mit und legt
  Planungsartefakte im Repo ab.
- Claude Code selbst deckt inzwischen vieles ab, was GSD ergänzt hat:
  Plan Mode, Skills (`.claude/skills/*/SKILL.md`), Subagents, Hooks,
  `/code-review`, `/simplify`, Tasks.

### Empfehlung für dieses Projekt

**Ersetzen durch leichte Projekt-Skills, GSD optional lokal dazu.**

Begründung: Das Projekt hat eine klare, kleine Roadmap mit einem Entwickler.
Der Overhead eines vollen Phasen-Frameworks lohnt sich nicht; was gebraucht
wird, sind drei Dinge, die Skills besser und wartbarer abdecken:

| Bedarf | GSD-Entsprechung | Lösung hier |
|---|---|---|
| Struktur pro Feature (Plan, Dateien, Tests, Doku) | `/gsd-plan-phase`, `/gsd-execute-phase` | Skill `feature` (`.claude/skills/feature/SKILL.md`) + Plan Mode |
| Projektkontext laden | `/gsd-onboard`, `PROJECT.md` | `CLAUDE.md` + `docs/` (werden automatisch gelesen) |
| Entscheidungen festhalten | Phasen-Archiv | Skill `adr` schreibt `docs/adr/NNNN-*.md` |
| Abschluss und Review | `/gsd-verify`, `/gsd-ship` | Skill `ship` (Checkliste: Tests, Lint, Build, Doku, PR) + `/code-review` |

Wer GSD trotzdem nutzen will: `npx @opengsd/gsd-core@latest` im Projekt
ausführen und **lokalen** Scope wählen, dann `/gsd-onboard`. Die Skills hier
stören sich nicht daran; `CLAUDE.md` bleibt die Regelquelle.

## Skills in diesem Repo

| Skill | Aufruf | Zweck |
|---|---|---|
| `feature` | `/feature <Beschreibung>` | Feature vom Plan bis zum PR, mit Tests und Doku-Pflicht |
| `adr` | `/adr <Titel>` | Architecture Decision Record anlegen |
| `ship` | `/ship` | Abschluss-Checkliste, Commit, Push, PR-Text |
| `coach-prompt` | `/coach-prompt` | Prompt und Schema des KI-Coaches anpassen und mit Beispieldaten testen |

Skills liegen in `.claude/skills/<name>/SKILL.md` und werden mit dem Repo
versioniert, sind also in jeder Session (Cloud oder lokal) verfügbar.

## Session-Ablauf (Cloud)

1. Session mit dem Repo starten (Branch wird automatisch angelegt oder `feat/<thema>` selbst wählen)
2. Aufgabe in einem Satz plus Verweis auf Roadmap-Phase, z. B. «P3: Strava OAuth-Flow umsetzen, siehe docs/05-roadmap.md»
3. Claude plant (Plan Mode oder `/feature`), setzt um, führt `npm run check` aus
4. `/code-review`, dann `/ship`
5. PR auf GitHub mergen, Vercel deployt

## Git-Konventionen

- `main` ist deploybar, Features über Branches `feat/...`, Fixes `fix/...`
- Commit-Messages: Conventional Commits auf Englisch (`feat(strava): webhook subscription`)
- Jede Änderung am Verhalten aktualisiert die betroffene Doku im gleichen PR

## Qualität

- `npm run check` = Lint + Typecheck + Tests; CI führt zusätzlich `npm run build` aus
- Fachlogik liegt in `src/lib/domain` ohne Framework-Abhängigkeit und wird mit Vitest getestet
- Secrets nie im Repo, `.env.example` dokumentiert alle Variablen
