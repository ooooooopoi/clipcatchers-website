import { cache } from "react";
import { notFound } from "next/navigation";
import {
  BotUnavailable,
  fetchCampaigns,
  fetchClipperAccounts,
  fetchClipperEarnings,
  type BotCampaign,
  type ClipperAccount,
  type ClipperClip,
  type ClipperEarnings,
} from "@/lib/bot";
import { compact } from "@/lib/clipper-format";
import { clipperSignatureValid } from "@/lib/share";

// Defined in clipper-format.ts, which the browser can load; here as well so
// server pages keep one import for everything clipper.
export { compact, dollars } from "@/lib/clipper-format";

/**
 * Everything a clipper page needs, fetched once per request.
 *
 * The dashboard is six routes over the same three endpoints, and each of them
 * wants the signature checked, the bot's absence handled, and usually more
 * than one of the three. Repeating that per page is how the guards drift —
 * one route forgets the check, or reports "your link is wrong" when the bot is
 * simply down, which sends a clipper to support over nothing.
 */
export type ClipperData = {
  userId: string;
  sig: string;
  earnings: ClipperEarnings | null;
  accounts: ClipperAccount[];
  campaigns: BotCampaign[];
  /** The bot is unreachable. Not the same as a bad link, and shown differently. */
  offline: boolean;
};

/**
 * Memoised for the duration of one request, by userId and sig.
 *
 * The shell and the page inside it both need this — the notifications bell in
 * the sidebar is built from the same earnings and campaigns the page renders —
 * and a layout is rendered alongside its page, not before it. Without `cache`
 * that is three extra bot round-trips on every single page view, for data the
 * request already has in hand.
 */
export const loadClipper = cache(async function loadClipper(
  userId: string,
  sig: string,
): Promise<ClipperData> {
  // 404 rather than 401, on every route rather than only the layout. A layout
  // guard is not a boundary — pages are individually requestable — and a 401
  // would confirm which clippers exist to anyone guessing ids.
  if (!clipperSignatureValid(userId, sig)) notFound();

  try {
    const [earnings, accounts, campaigns] = await Promise.all([
      fetchClipperEarnings(userId),
      fetchClipperAccounts(userId),
      fetchCampaigns(),
    ]);
    return {
      userId,
      sig,
      earnings,
      accounts: accounts.accounts ?? [],
      campaigns: campaigns.campaigns ?? [],
      offline: false,
    };
  } catch (error) {
    if (!(error instanceof BotUnavailable)) throw error;
    return { userId, sig, earnings: null, accounts: [], campaigns: [], offline: true };
  }
});

/** "$10 / 100K views" — the campaign's offer in the form it's quoted in. */
export function rateLabel(c: Pick<BotCampaign, "rate_amount" | "rate_per_views">) {
  return `$${c.rate_amount} / ${compact(c.rate_per_views)} views`;
}

/**
 * Whether a campaign belongs on the Ads board rather than Campaigns.
 *
 * One predicate, used by both pages, because the two boards must partition
 * the list rather than each filter it. Two separate conditions would
 * eventually disagree, and the way that shows up is a campaign appearing on
 * both boards — or, worse, on neither, which nobody reports because there is
 * nothing on screen to report.
 *
 * Undefined counts as organic: the flag is newer than the campaigns, and a
 * bot that hasn't been redeployed yet sends nothing here.
 */
export function isPaidAds(c: Pick<BotCampaign, "paid_ads">): boolean {
  return Number(c.paid_ads ?? 0) === 1;
}

export const STATUS_TONE: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  pending: "border-warning/30 bg-warning/10 text-warning",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  withdrawn: "border-border text-muted-foreground",
};

/**
 * A run of clips from one campaign, so a long history reads as a few groups.
 *
 * Rows say what the clips EARNED, never what is left to pay. Payment is shown
 * only as a balance at the top of Earnings (owner, 2026-10-13): clips are
 * settled one at a time behind the scenes, so a per-campaign "owed" or
 * "settled" built from clip flags disagreed with the balance whenever a
 * withdrawal ran ahead of the clips or a rounding gap left one behind.
 */
export type ClipGroup = {
  id: number;
  name: string;
  clips: ClipperClip[];
  /** What the campaign's clips have earned. Provisional while it's live. */
  earned: number;
  /** Whether the campaign is still live. */
  active: boolean;
};

export function groupByCampaign(clips: ClipperClip[]): ClipGroup[] {
  const groups = new Map<number, ClipGroup>();
  for (const clip of clips) {
    let group = groups.get(clip.campaign_id);
    if (!group) {
      group = {
        id: clip.campaign_id,
        name: clip.campaign,
        clips: [],
        earned: 0,
        active: clip.campaign_active,
      };
      groups.set(clip.campaign_id, group);
    }
    group.clips.push(clip);
    group.earned += clip.worth;
  }
  // Live campaigns first — that is where today's work goes — then by what each
  // earned. Never by anything unpaid: the order would signal payment state.
  return [...groups.values()].sort(
    (a, b) => Number(b.active) - Number(a.active) || b.earned - a.earned,
  );
}
