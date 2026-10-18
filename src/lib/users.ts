import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, schema } from "@/db";

export type CurrentUser = typeof schema.users.$inferSelect;

/**
 * Liefert den DB-Benutzer zur aktuellen Session und legt ihn beim ersten
 * Besuch an. Schlüssel ist die Entra Object-ID; ein per Seed nur mit E-Mail
 * angelegter Benutzer bekommt die OID nachgetragen. Ohne Session → /login.
 * Server Actions rufen das ebenfalls auf, weil sie per POST direkt erreichbar sind.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const oid = session?.user?.id;
  if (!session?.user || !email || !oid) redirect("/login");
  const name = session.user.name ?? null;

  const [byOid] = await db().select().from(schema.users).where(eq(schema.users.entraOid, oid)).limit(1);
  if (byOid) {
    if (byOid.email === email && byOid.name === name) return byOid;
    const [updated] = await db().update(schema.users).set({ email, name }).where(eq(schema.users.id, byOid.id)).returning();
    return updated;
  }

  const [byEmail] = await db().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (byEmail) {
    const [updated] = await db()
      .update(schema.users)
      .set({ entraOid: oid, name })
      .where(eq(schema.users.id, byEmail.id))
      .returning();
    return updated;
  }

  const [created] = await db().insert(schema.users).values({ email, name, entraOid: oid }).returning();
  return created;
}
