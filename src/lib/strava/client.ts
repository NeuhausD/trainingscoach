import type { StravaGear, StravaSummaryActivity } from "@/lib/domain/strava-mapping";

/**
 * Strava-API-Client: OAuth-Tausch und -Erneuerung, Aktivitäten, Gear.
 * Nur Lesezugriffe plus Deauthorize. Rate-Limits (100 Lese-Anfragen pro
 * 15 Minuten) sind für einen Athleten unkritisch; der Import nutzt 200 je Seite.
 */
const API = "https://www.strava.com/api/v3";
const OAUTH = "https://www.strava.com/oauth";
export const STRAVA_SCOPE = "read,activity:read_all,profile:read_all";

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  athleteId: string | null;
  athleteName: string | null;
};

function credentials() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("STRAVA_CLIENT_ID oder STRAVA_CLIENT_SECRET ist nicht gesetzt");
  return { clientId, clientSecret };
}

export function authorizeUrl(redirectUri: string, state: string): string {
  const { clientId } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "auto",
    scope: STRAVA_SCOPE,
    state,
  });
  return `${OAUTH}/authorize?${params}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id?: number; firstname?: string; lastname?: string };
};

function toTokenSet(t: TokenResponse): TokenSet {
  const name = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(" ") || null;
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: new Date(t.expires_at * 1000),
    athleteId: t.athlete?.id ? String(t.athlete.id) : null,
    athleteName: name,
  };
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(`${OAUTH}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, ...body }),
  });
  if (!res.ok) throw new Error(`Strava-Token-Anfrage fehlgeschlagen (${res.status})`);
  return (await res.json()) as TokenResponse;
}

export async function exchangeCode(code: string): Promise<TokenSet> {
  return toTokenSet(await tokenRequest({ code, grant_type: "authorization_code" }));
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return toTokenSet(await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" }));
}

export async function deauthorize(accessToken: string): Promise<void> {
  await fetch(`${OAUTH}/deauthorize`, { method: "POST", headers: { authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
}

async function get<T>(accessToken: string, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (res.status === 429) throw new Error("Strava-Rate-Limit erreicht, später erneut versuchen");
  if (!res.ok) throw new Error(`Strava-Anfrage ${path} fehlgeschlagen (${res.status})`);
  return (await res.json()) as T;
}

/** Alle Aktivitäten seit `after` (Unix-Sekunden), seitenweise zu 200. */
export async function listActivities(accessToken: string, after: number, maxPages = 10): Promise<StravaSummaryActivity[]> {
  const all: StravaSummaryActivity[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await get<StravaSummaryActivity[]>(accessToken, "/athlete/activities", {
      after: String(after),
      per_page: "200",
      page: String(page),
    });
    all.push(...batch);
    if (batch.length < 200) break;
  }
  return all;
}

export async function getActivity(accessToken: string, id: number): Promise<StravaSummaryActivity> {
  return get<StravaSummaryActivity>(accessToken, `/activities/${id}`, { include_all_efforts: "false" });
}

export async function getGear(accessToken: string, gearId: string): Promise<StravaGear> {
  return get<StravaGear>(accessToken, `/gear/${gearId}`);
}
