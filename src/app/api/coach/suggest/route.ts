import { auth } from "@/auth";
import { generateWeekPlan } from "@/lib/ai/coach";
import { coachContextSchema, emptyContext } from "@/lib/ai/context";
import { seasonForDate } from "@/lib/domain/season";
import { fetchForecast } from "@/lib/weather/open-meteo";

/**
 * POST /api/coach/suggest
 * Phase P6 baut hier den echten Kontext aus der DB. Bis dahin akzeptiert die
 * Route einen Kontext im Body (für Tests mit Fixtures) und ergänzt das Wetter.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const today = new Date();
  const body = await req.json().catch(() => ({}));
  const base = emptyContext(today.toISOString().slice(0, 10), seasonForDate(today));
  const parsed = coachContextSchema.safeParse({ ...base, ...body });
  if (!parsed.success) {
    return Response.json({ error: "invalid context", issues: parsed.error.issues }, { status: 400 });
  }

  const context = parsed.data;
  if (context.forecast.length === 0) {
    const lat = Number(process.env.HOME_LAT ?? 46.743);
    const lon = Number(process.env.HOME_LON ?? 7.288);
    context.forecast = await fetchForecast(lat, lon).catch(() => []);
  }

  const { plan, modelId } = await generateWeekPlan(context);
  return Response.json({ modelId, plan });
}
