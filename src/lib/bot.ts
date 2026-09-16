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

export type PayoutRecord = {
  /** "withdrawal" when the clipper took it themselves, "admin" when we sent it. */
  kind: "withdrawal" | "admin";
  id: string;
  user_id: string;
  handle: string;
  /** Taken off their balance. */
  amount: number;
  /** What actually arrived, after fee and gas. Equals amount for admin runs. */
  sent: number;
  fee: number;
  tx_hash: string;
  /** Unix seconds. */
  at: number;
  clips: number;
};

export type PayoutHistory = {
  payouts: PayoutRecord[];
  total_paid: number;
  total_sent: number;
  total_fees: number;
};

/** Every payment out, both routes, newest first. */
export function fetchPayoutHistory(limit = 300) {
  return call<PayoutHistory>(`/api/payouts/history?limit=${limit}`);
}

export type PayoutWallet = {
  /** False when the key, RPC or token address can't produce a usable wallet. */
  ready: boolean;
  /** Why not, when ready is false. Never contains the key. */
  reason?: string;
  address?: string;
  chain_id?: number;
  /** Native coin, for gas. */
  native?: number;
  /** USDT held. */
  token?: number;
  minimum_usd: number;
  fee_percent: number;
  gas_charged_to_clipper: boolean;
  max_gas_share: number;
  max_per_recipient: number;
  max_per_run: number;
  /** Non-empty when gas deduction is switched on but can't be priced. */
  gas_config_warning: string;
};

/** The float wallet's state and the rules money leaves under. */
export function fetchPayoutWallet() {
  return call<PayoutWallet>("/api/payouts/wallet");
}

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

export type BotCampaign = {
  id: number;
  name: string;
  budget: number;
  active: number;
  platform: string | null;
  artist: string | null;
  /** Pays rate_amount per rate_per_views views — e.g. $1 per 10,000. */
  rate_amount: number;
  rate_per_views: number;
  /** Below this a clip earns nothing, however many views it has. */
  min_views: number;
  /** 0 means uncapped. */
  max_views: number;
  /**
   * The campaign banner. A Discord attachment URL, so it carries an expiring
   * signature and must be passed around whole — stripping the query string
   * 404s it. Empty when no banner was set.
   */
  image_url: string;
  /** Requirements and assets doc. Empty when there isn't one. */
  brief_url: string;
  /** Unix seconds, 0 when the campaign never closed. */
  closed_at: number;
  /**
   * 1 when the campaign pays for boosted/paid placement instead of organic
   * posting. It decides which of the clipper's two boards the campaign shows
   * on, and the boards are separate because the work is: an organic rate
   * assumes a clip earned its own views, and paying that rate to someone who
   * bought them — or the reverse — is wrong in both directions.
   *
   * Optional because the bot only began sending it with the Ads section. A
   * moment where the site is ahead of the bot reads undefined and treats the
   * campaign as organic, which is what every campaign was before this.
   */
  paid_ads?: number;
  /** Free-text section shown on the card. */
  details?: string;
  /**
   * Rules and requirements. On a paid-ads campaign this is the half that says
   * what you are expected to spend, so it is load-bearing there rather than
   * decorative.
   */
  rules?: string;
};

export function fetchCampaigns() {
  return call<{ campaigns: BotCampaign[] }>("/api/campaigns");
}

/**
 * What the team dashboard can set when opening a campaign.
 *
 * A subset of the columns on purpose — board_message_id and the payout flags
 * are written by the bot as things happen, and a form that could set them
 * would be a form that can lie about what has already occurred.
 */
export type NewCampaign = {
  name: string;
  rate_amount: number;
  rate_per_views: number;
  min_views?: number;
  max_views?: number;
  budget?: number;
  category?: string;
  platform?: string;
  artist?: string;
  brief_url?: string;
  image_url?: string;
  details?: string;
  rules?: string;
  paid_ads?: boolean;
};

export function createCampaign(campaign: NewCampaign) {
  return call<{ created: number; campaign: BotCampaign }>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(campaign),
  });
}

/**
 * Change an existing campaign.
 *
 * Every key is optional and the bot only writes the ones present, so a patch
 * that moves a campaign between boards touches nothing else. Sending the whole
 * object back would mean every save re-asserting values nobody edited — and
 * the first time two people had the page open, one would silently undo the
 * other.
 */
export type CampaignPatch = Partial<{
  name: string;
  budget: number;
  min_views: number;
  max_views: number;
  rate_amount: number;
  platform: string;
  artist: string;
  details: string;
  rules: string;
  brief_url: string;
  image_url: string;
  active: boolean;
  paid_ads: boolean;
}>;

export function updateCampaign(id: number, patch: CampaignPatch) {
  return call<{
    before: Record<string, unknown>;
    after: Record<string, unknown> & { paid_ads?: number; active?: number };
  }>(`/api/campaigns/${id}`, {
    method: "POST",
    body: JSON.stringify(patch),
  });
}

export function markPaid(userId: string, campaignId?: number, paid = true) {
  return call<{ clips_marked: number; amount: number }>("/api/payouts/mark-paid", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, campaign_id: campaignId ?? null, paid }),
  });
}

export type CampaignClipRow = {
  id: number;
  url: string;
  platform: string | null;
  /**
   * Payable views — what the clipper was actually paid on.
   *
   * Frozen once the campaign closes or is trimmed to budget, because money is
   * calculated from it. Not the same as what the clip went on to deliver.
   */
  views: number;
  /**
   * Delivered views: MAX(views, reach_views) in the bot.
   *
   * A clip keeps being watched long after its campaign closes, and those later
   * views are recorded but never re-priced. Identical to `views` on a live
   * campaign; on a closed one the gap is reach nobody was paid for.
   */
  delivered: number;
  status: string;
  paid: number;
  /** Dollars this clip is worth, capped and min-view gated the same way /payouts does it. */
  earned: number | null;
  handle: string | null;
  user_id: string;
  engagement_pct: number | null;
  reject_reason: string | null;
};

export type CampaignClipsResponse = {
  campaign: { id: number; name: string; active: number; budget: number | null };
  count: number;
  total_views: number;
  total_earned: number;
  clips: CampaignClipRow[];
};

/**
 * Every clip on one campaign, unpaginated and keyed by campaign id.
 *
 * Preferred over filtering the mirrored snapshot, whose clips sheet carries a
 * campaign *name* and no id — two campaigns sharing a name would silently
 * merge into one set of figures.
 */
export function fetchCampaignClips(campaignId: number) {
  return call<CampaignClipsResponse>(`/api/campaigns/${campaignId}/clips`);
}

export type ClipperClip = {
  id: number;
  url: string;
  status: string;
  paid: boolean;
  locked: boolean;
  views: number;
  worth: number;
  campaign: string;
  campaign_id: number;
  /** Campaign still running, so this clip's worth is provisional. */
  campaign_active: boolean;
  /** Above zero views but under the campaign floor, so earning nothing yet. */
  below_min: boolean;
  flag_reason: string;
};

export type ClipperEarnings = {
  clips: number;
  /**
   * Earned on a campaign that has ENDED and isn't paid yet — an actual debt.
   * Excludes live campaigns, whose balance is provisional until the close
   * audit runs. See `running`.
   */
  owed: number;
  /**
   * Earned so far on campaigns still running. Not owed: the figure moves with
   * views, and the audit at close can reject clips that were sitting as
   * approved the whole time.
   */
  running: number;
  already_paid: number;
  /**
   * Of `owed`, the part whose campaigns an admin has released. Only this is
   * reachable by /withdraw — the rest is earned but still locked.
   */
  withdrawable: number;
  awaiting_release: number;
  /** "USDT" | "PayPal" | "" when they've never run /set-payout. */
  payout_method: string;
  /** Masked by the bot — enough to recognise, not enough to reuse. */
  payout_address: string;
  /**
   * The withdrawal floor, in dollars, from the bot's MIN_PAYOUT_USD. Read
   * rather than hardcoded so the page and the rule can't disagree.
   */
  payout_minimum: number;
  /** Percentage taken from a withdrawal, e.g. 6. */
  payout_fee_percent: number;
  /** Whether network gas is deducted from the clipper's amount too. */
  payout_gas_from_clipper: boolean;
  flagged: number;
  /**
   * The per-clip rows. Named for the key the bot actually sends: this was
   * typed as `rows` for months, so `earnings.rows` was silently undefined and
   * every clipper's clip list rendered empty. `call<T>()` is an unchecked
   * cast, so nothing caught it.
   */
  breakdown: ClipperClip[];
};

export type ClipperAccount = { id: number; platform: string; handle: string };

/** One clipper's clips and what each is worth. Read-only on the bot's side. */
export function fetchClipperEarnings(userId: string) {
  return call<ClipperEarnings>(`/api/users/${encodeURIComponent(userId)}/earnings`);
}

/** Their registered accounts, so the submit form can offer the right ones. */
export function fetchClipperAccounts(userId: string) {
  return call<{ accounts: ClipperAccount[] }>(
    `/api/users/${encodeURIComponent(userId)}/accounts`,
  );
}
