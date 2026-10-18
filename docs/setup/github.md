# GitHub und Claude Code

## Repo anlegen (einmalig)

Auf dem eigenen Rechner (oder in einer Claude-Code-Session mit gültiger GitHub-Anbindung):

```bash
cd trainingscoach
gh repo create trainingscoach --private --source=. --remote=origin --push
```

Alternativ: Repo leer auf github.com anlegen, dann

```bash
git remote add origin git@github.com:<account>/trainingscoach.git
git push -u origin main
```

## Claude Code Cloud-Sessions

1. Unter https://claude.ai/connect-github den GitHub-Account verbinden und die Claude GitHub App für `trainingscoach` installieren.
2. Neue Session mit diesem Repo starten. `CLAUDE.md`, `docs/` und `.claude/skills` werden automatisch geladen.
3. Umgebung: Node 22, `npm ci` im Setup-Script (siehe `.claude/settings.json`, Hook `SessionStart`).

## Branch-Schutz (empfohlen)

- `main`: PR erforderlich, CI muss grün sein
