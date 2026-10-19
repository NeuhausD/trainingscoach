"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStravaConnector, markDisconnected, readTokens } from "@/lib/master-data/connectors";
import { deauthorize } from "@/lib/strava/client";
import { syncStravaForUser } from "@/lib/strava/sync";
import { requireUser } from "@/lib/users";

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

export async function syncStravaAction(formData: FormData) {
  const user = await requireUser();
  const days = Math.min(400, Math.max(1, Number(text(formData, "days") ?? 30) || 30));
  let query: string;
  try {
    const r = await syncStravaForUser(user.id, days);
    query = `synced=${r.imported}&updated=${r.updated}&gear=${r.gearCreated}&days=${days}`;
  } catch (e) {
    query = `error=${encodeURIComponent(e instanceof Error ? e.message : "sync")}`;
  }
  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/settings/connectors");
  redirect(`/settings/connectors?${query}`);
}

export async function disconnectStravaAction() {
  const user = await requireUser();
  const connector = await getStravaConnector(user.id);
  if (connector) {
    const tokens = readTokens(connector);
    if (tokens) await deauthorize(tokens.accessToken);
    await markDisconnected(connector.id);
  }
  revalidatePath("/settings/connectors");
  redirect("/settings/connectors?disconnected=1");
}
