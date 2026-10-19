import { after, NextResponse, type NextRequest } from "next/server";
import { decideWebhookAction, parseWebhookEvent, verifySubscription } from "@/lib/domain/strava-webhook";
import { deleteSyncedActivity, handleDeauthorize, syncSingleActivity } from "@/lib/strava/sync";

/** Validierung der Subscription durch Strava (einmalig beim Anlegen). */
export async function GET(req: NextRequest) {
  const result = verifySubscription(req.nextUrl.searchParams, process.env.STRAVA_WEBHOOK_VERIFY_TOKEN);
  if (!result.ok) return NextResponse.json({ error: "verification failed" }, { status: 403 });
  return NextResponse.json({ "hub.challenge": result.challenge });
}

/** Ereignis: sofort 200 antworten, Verarbeitung nach der Antwort (Strava erwartet Antwort in 2 s). */
export async function POST(req: NextRequest) {
  const event = parseWebhookEvent(await req.json().catch(() => null));
  if (!event) return NextResponse.json({ error: "bad event" }, { status: 400 });
  const action = decideWebhookAction(event);
  after(async () => {
    if (action.kind === "upsert_activity") await syncSingleActivity(action.ownerId, action.activityId);
    else if (action.kind === "delete_activity") await deleteSyncedActivity(action.ownerId, action.activityId);
    else if (action.kind === "deauthorize") await handleDeauthorize(action.ownerId);
  });
  return NextResponse.json({ ok: true });
}
