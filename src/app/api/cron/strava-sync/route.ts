/** Nächtlicher Abgleich (Phase P3). Vercel Cron sendet Authorization: Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  return Response.json({ ok: true, synced: 0, note: "Strava-Sync wird in Phase P3 umgesetzt" });
}
