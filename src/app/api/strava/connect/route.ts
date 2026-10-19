import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { authorizeUrl } from "@/lib/strava/client";

/** Startet den OAuth-Flow: State-Cookie setzen, zu Strava weiterleiten. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${req.nextUrl.origin}/api/strava/callback`;
  const cookieStore = await cookies();
  cookieStore.set("strava_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", maxAge: 600, path: "/" });
  return NextResponse.redirect(authorizeUrl(redirectUri, state));
}
