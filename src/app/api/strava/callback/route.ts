import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { saveStravaTokens } from "@/lib/master-data/connectors";
import { exchangeCode } from "@/lib/strava/client";
import { requireUser } from "@/lib/users";

/** Rückkehr von Strava: Code gegen Tokens tauschen und verschlüsselt speichern. */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  const params = req.nextUrl.searchParams;
  const back = (q: string) => NextResponse.redirect(new URL(`/settings/connectors?${q}`, req.nextUrl.origin));

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("strava_oauth_state")?.value;
  cookieStore.delete("strava_oauth_state");
  if (params.get("error")) return back(`error=${encodeURIComponent(params.get("error") ?? "")}`);
  if (!expectedState || params.get("state") !== expectedState) return back("error=state");
  const scope = params.get("scope") ?? "";
  if (!scope.includes("activity:read")) return back("error=scope");
  const code = params.get("code");
  if (!code) return back("error=code");

  try {
    const tokens = await exchangeCode(code);
    await saveStravaTokens(user.id, tokens);
  } catch (e) {
    return back(`error=${encodeURIComponent(e instanceof Error ? e.message : "token")}`);
  }
  return back("connected=1");
}
