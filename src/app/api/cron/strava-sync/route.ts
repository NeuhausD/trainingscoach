import { listConnectedStrava } from "@/lib/master-data/connectors";
import { syncStrava } from "@/lib/strava/sync";

export const maxDuration = 60;

/** Nächtlicher Abgleich der letzten 30 Tage als Sicherheitsnetz zum Webhook. Vercel Cron sendet Authorization: Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const connectors = await listConnectedStrava();
  const results: Record<string, unknown> = {};
  for (const c of connectors) {
    try {
      results[c.id] = await syncStrava(c, 30);
    } catch (e) {
      results[c.id] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return Response.json({ ok: true, connectors: connectors.length, results });
}
