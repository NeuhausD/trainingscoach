// Spielt die Migrationen aus drizzle/ über den Neon-HTTP-Treiber ein.
// Gegenüber `drizzle-kit migrate` (WebSocket) funktioniert das auch hinter dem
// HTTPS-Proxy der Claude-Code-Cloud-Sessions. Nutzung: npm run db:migrate
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL ist nicht gesetzt");
    process.exit(1);
  }
  const sql = neon(url);
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  const [{ n }] = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  console.log(`Migrationen eingespielt, Journal: ${n} Eintrag/Einträge.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
