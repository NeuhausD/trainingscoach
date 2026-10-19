// Ruft den KI-Coach mit einem Fixture auf. Nutzung: npm run coach:try -- summer-good-weather
import { readFileSync } from "node:fs";
import path from "node:path";
import { coachContextSchema } from "../src/lib/ai/context";
import { generateWeekPlan } from "../src/lib/ai/coach";

async function main() {
  const name = process.argv[2] ?? "summer-good-weather";
  const file = path.join(__dirname, "..", "src", "lib", "ai", "__fixtures__", `${name}.json`);
  const context = coachContextSchema.parse(JSON.parse(readFileSync(file, "utf8")));

  const { plan, modelId } = await generateWeekPlan(context);
  console.log(`Modell: ${modelId}\n`);
  console.log(plan.summary, `\nZiel-Belastung: ${plan.weeklyLoadTarget}\n`);
  for (const s of plan.sessions) {
    console.log(`${s.plannedOn}  ${s.sport} · ${s.title} (${s.durationMin} min, ${s.intensity}${s.equipment ? `, ${s.equipment}` : ""})`);
    console.log(`  ${s.description}`);
    console.log(`  Warum: ${s.rationale}`);
    for (const v of s.variants) console.log(`  Variante: ${v.label} (${v.durationMin} min) – ${v.description}`);
    console.log();
  }
  for (const q of plan.quickSessions ?? []) {
    console.log(`${q.plannedOn}  Zwischendurch · ${q.title} (${q.durationMin} min, ${q.muscles.join(", ")})`);
    for (const e of q.exercises) console.log(`  ${e.name}: ${e.sets} × ${e.reps}`);
    console.log(`  Warum: ${q.rationale}\n`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
