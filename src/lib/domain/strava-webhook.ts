/** Strava-Webhook: Validierung der Subscription und Auswertung von Ereignissen. Reine Logik. */
export type StravaWebhookEvent = {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id?: number;
  event_time?: number;
  updates?: Record<string, string>;
};

/** GET-Validierung: hub.mode=subscribe und passender Verify-Token → Challenge zurückgeben. */
export function verifySubscription(params: URLSearchParams, verifyToken: string | undefined): { ok: true; challenge: string } | { ok: false } {
  if (!verifyToken) return { ok: false };
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  if (mode === "subscribe" && token === verifyToken && challenge) return { ok: true, challenge };
  return { ok: false };
}

export type WebhookAction =
  | { kind: "upsert_activity"; activityId: number; ownerId: number }
  | { kind: "delete_activity"; activityId: number; ownerId: number }
  | { kind: "deauthorize"; ownerId: number }
  | { kind: "ignore"; reason: string };

export function parseWebhookEvent(body: unknown): StravaWebhookEvent | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if ((b.object_type !== "activity" && b.object_type !== "athlete") || typeof b.object_id !== "number" || typeof b.owner_id !== "number") return null;
  if (b.aspect_type !== "create" && b.aspect_type !== "update" && b.aspect_type !== "delete") return null;
  return {
    object_type: b.object_type,
    object_id: b.object_id,
    aspect_type: b.aspect_type,
    owner_id: b.owner_id,
    updates: typeof b.updates === "object" && b.updates ? (b.updates as Record<string, string>) : undefined,
  };
}

export function decideWebhookAction(event: StravaWebhookEvent): WebhookAction {
  if (event.object_type === "athlete") {
    return event.updates?.authorized === "false" ? { kind: "deauthorize", ownerId: event.owner_id } : { kind: "ignore", reason: "athlete update" };
  }
  if (event.aspect_type === "delete") return { kind: "delete_activity", activityId: event.object_id, ownerId: event.owner_id };
  return { kind: "upsert_activity", activityId: event.object_id, ownerId: event.owner_id };
}

/** Token gilt als abgelaufen, wenn weniger als 5 Minuten verbleiben. */
export function tokenNeedsRefresh(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}
