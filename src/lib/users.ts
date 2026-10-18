import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, schema } from "@/db";

export type CurrentUser = typeof schema.users.$inferSelect;

/**
 * Liefert den DB-Benutzer zur aktuellen Session und legt ihn beim ersten
 * Besuch an (Upsert über die Entra Object-ID). Ohne Session → Redirect auf /login.
 * Server Actions rufen das ebenfalls auf, weil sie per POST direkt erreichbar sind.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const oid = session?.user?.id;
  if (!session?.user || !email || !oid) redirect("/login");

  const [user] = await db()
    .insert(schema.users)
    .values({ email, name: session.user.name ?? null, entraOid: oid })
    .onConflictDoUpdate({
      target: schema.users.entraOid,
      set: { email, name: session.user.name ?? null },
    })
    .returning();
  if (user) return user;

  // Fallback: Benutzer existiert bereits über die E-Mail (z. B. ohne OID angelegt)
  const [byEmail] = await db().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!byEmail) throw new Error("Benutzer konnte nicht angelegt werden");
  return byEmail;
}
