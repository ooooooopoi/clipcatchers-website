/**
 * Server-side calls to the Discord bot's admin API.
 *
 * The shared secret never reaches the browser: pages and route handlers call
 * these, the browser only ever proves itself with the team signature already
 * in its URL.
 */
const DEFAULT_BOT_URL = "https://worker-production-b401.up.railway.app";

export function botUrl() {
  return (process.env.BOT_URL || DEFAULT_BOT_URL).replace(/\/+$/, "");
}

export class BotUnavailable extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) throw new BotUnavailable("INGEST_SECRET isn't configured.");

  const res = await fetch(`${botUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "x-ingest-secret": secret, ...init?.headers },
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BotUnavailable(
      (body as { error?: string }).error ?? `The bot returned ${res.status}.`,
    );
  }
  return body as T;
}

export type OwedClipper = {
  /**
   * A Discord snowflake, kept as a string. As a JSON number it becomes a
   * double in the browser and loses its last digits, so the id sent back
   * matches nothing.
   */
  user_id: string;
  handle: string | null;
  owed: number;
  clips: number;
  views: number;
  method: string | null;
  address?: string | null;
  payout_set: boolean;
};

export type PayoutsResponse = {
  campaign: number | null;
  clippers_owed: number;
  total_owed: number;
  without_payout_method: number;
  clippers: OwedClipper[];
};

export type CampaignRow = {
  id: number;
  name: string;
  active: number;
  clips: number;
  paid: number | null;
};

export type StatsResponse = {
  clips_by_status: Record<string, number>;
  total_clips: number;
  paid: number;
  on_closed_campaign: number;
  readable: number;
  never_read_again: number;
  campaigns: CampaignRow[];
};

export function fetchPayouts(campaignId?: number, withAddress = false) {
  const params = new URLSearchParams();
  if (campaignId) params.set("campaign", String(campaignId));
  if (withAddress) params.set("address", "true");
  const query = params.toString();
  return call<PayoutsResponse>(`/api/payouts${query ? `?${query}` : ""}`);
}

export function fetchStats() {
  return call<StatsResponse>("/api/stats");
}

export function fetchCampaigns() {
  return call<{ campaigns: { id: number; name: string; budget: number; active: number }[] }>(
    "/api/campaigns",
  );
}

export function markPaid(userId: string, campaignId?: number, paid = true) {
  return call<{ clips_marked: number; amount: number }>("/api/payouts/mark-paid", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, campaign_id: campaignId ?? null, paid }),
  });
}
