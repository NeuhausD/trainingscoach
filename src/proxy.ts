import { auth } from "@/auth";

// Next.js 16: "Proxy" (vormals Middleware). Optimistischer Schutz aller App-Seiten;
// Route Handler prüfen die Session zusätzlich selbst.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/strava/webhook") ||
    pathname.startsWith("/api/cron");
  if (!req.auth && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
