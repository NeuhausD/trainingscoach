# ADR 0005 – Vercel AI SDK mit umschaltbarem Anbieter

Status: akzeptiert · Datum: 2026-10-18

## Kontext
Anthropic und OpenAI sollen beide nutzbar sein; Vorschläge müssen strukturiert
in die DB übernommen werden.

## Entscheidung
Vercel AI SDK (`ai`) mit `@ai-sdk/anthropic` und `@ai-sdk/openai`. Auswahl über
`AI_PROVIDER` und `AI_MODEL`. Vorschläge werden mit Zod-Schema als Objekt
erzeugt (`generateObject`/`Output.object`), nie als Freitext geparst. Standard
ist Anthropic `claude-sonnet-5-5`.

## Konsequenzen
- Ein Prompt-Satz für beide Anbieter; Abweichungen werden in Tests mit Beispielkontext geprüft
- Kosten pro Wochenvorschlag im Rappen-Bereich; Saisonplanung mit `claude-opus-5-5` optional
