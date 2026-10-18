// Legt die Stammdaten (Sportarten mit saisonaler Gewichtung, zwei Bikes) für einen
// Benutzer an. Idempotent. Nutzung: npm run db:seed -- athlet@example.com
// Ohne Argument wird die erste Adresse aus ALLOWED_EMAILS verwendet.
import { ensureUserByEmail, seedMasterData } from "../src/lib/master-data/seed";

const email = process.argv[2] ?? process.env.ALLOWED_EMAILS?.split(",")[0]?.trim();
if (!email) {
  console.error("E-Mail fehlt: npm run db:seed -- athlet@example.com (oder ALLOWED_EMAILS setzen)");
  process.exit(1);
}

const userId = await ensureUserByEmail(email);
const result = await seedMasterData(userId);
console.log(`Seed für ${email}: ${result.sportsCreated} Sportarten, ${result.equipmentCreated} Geräte neu angelegt.`);
