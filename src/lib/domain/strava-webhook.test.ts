import { describe, expect, it } from "vitest";
import { decideWebhookAction, parseWebhookEvent, tokenNeedsRefresh, verifySubscription } from "./strava-webhook";

describe("verifySubscription", () => {
  it("beantwortet die Challenge nur mit passendem Token", () => {
    const params = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "geheim", "hub.challenge": "abc" });
    expect(verifySubscription(params, "geheim")).toEqual({ ok: true, challenge: "abc" });
    expect(verifySubscription(params, "anders")).toEqual({ ok: false });
    expect(verifySubscription(params, undefined)).toEqual({ ok: false });
  });
});

describe("parseWebhookEvent / decideWebhookAction", () => {
  it("erkennt neue und gelöschte Aktivitäten", () => {
    const create = parseWebhookEvent({ object_type: "activity", object_id: 5, aspect_type: "create", owner_id: 9 })!;
    expect(decideWebhookAction(create)).toEqual({ kind: "upsert_activity", activityId: 5, ownerId: 9 });
    const del = parseWebhookEvent({ object_type: "activity", object_id: 5, aspect_type: "delete", owner_id: 9 })!;
    expect(decideWebhookAction(del)).toEqual({ kind: "delete_activity", activityId: 5, ownerId: 9 });
  });

  it("erkennt den Widerruf der Berechtigung", () => {
    const ev = parseWebhookEvent({ object_type: "athlete", object_id: 9, aspect_type: "update", owner_id: 9, updates: { authorized: "false" } })!;
    expect(decideWebhookAction(ev)).toEqual({ kind: "deauthorize", ownerId: 9 });
    const other = parseWebhookEvent({ object_type: "athlete", object_id: 9, aspect_type: "update", owner_id: 9 })!;
    expect(decideWebhookAction(other).kind).toBe("ignore");
  });

  it("verwirft unbrauchbare Nutzlasten", () => {
    expect(parseWebhookEvent(null)).toBeNull();
    expect(parseWebhookEvent({ object_type: "activity", object_id: "x", aspect_type: "create", owner_id: 1 })).toBeNull();
    expect(parseWebhookEvent({ object_type: "activity", object_id: 1, aspect_type: "poke", owner_id: 1 })).toBeNull();
  });
});

describe("tokenNeedsRefresh", () => {
  it("erneuert kurz vor Ablauf", () => {
    const now = new Date("2026-10-19T10:00:00Z");
    expect(tokenNeedsRefresh(new Date("2026-10-19T10:03:00Z"), now)).toBe(true);
    expect(tokenNeedsRefresh(new Date("2026-10-19T12:00:00Z"), now)).toBe(false);
    expect(tokenNeedsRefresh(null, now)).toBe(true);
  });
});
