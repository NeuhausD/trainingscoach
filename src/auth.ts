import NextAuth, { type NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // Zusätzliche Allowlist, unabhängig von der Entra-App-Registrierung (ADR 0002).
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      const list = allowedEmails();
      if (list.length === 0) return false;
      return !!email && list.includes(email);
    },
    jwt({ token, profile }) {
      // Entra Object-ID als stabiler Benutzer-Schlüssel
      if (profile && typeof profile.oid === "string") token.oid = profile.oid;
      return token;
    },
    session({ session, token }) {
      if (typeof token.oid === "string") session.user.id = token.oid;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
