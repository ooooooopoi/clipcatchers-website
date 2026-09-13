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
import { clipperSignatureValid } from "@/lib/share";

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

export async function loadClipper(userId: string, sig: string): Promise<ClipperData> {
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
}

/** Money from the bot arrives as dollars, not cents — formatCurrency takes cents. */
export function dollars(n: number) {
  return `$${n.toFixed(2)}`;
}

/** 10000 -> "10K". Rates read as "$1 / 10K views", which is how they're quoted. */
export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return String(n);
}

/** "$10 / 100K views" — the campaign's offer in the form it's quoted in. */
export function rateLabel(c: Pick<BotCampaign, "rate_amount" | "rate_per_views">) {
  return `$${c.rate_amount} / ${compact(c.rate_per_views)} views`;
}

export const STATUS_TONE: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  pending: "border-warning/30 bg-warning/10 text-warning",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  withdrawn: "border-border text-muted-foreground",
};

/** A run of clips from one campaign, so a long history reads as a few groups. */
export type ClipGroup = { id: number; name: string; clips: ClipperClip[]; earned: number };

export function groupByCampaign(clips: ClipperClip[]): ClipGroup[] {
  const groups = new Map<number, ClipGroup>();
  for (const clip of clips) {
    let group = groups.get(clip.campaign_id);
    if (!group) {
      group = { id: clip.campaign_id, name: clip.campaign, clips: [], earned: 0 };
      groups.set(clip.campaign_id, group);
    }
    group.clips.push(clip);
    group.earned += clip.worth;
  }
  // Biggest earner first: the campaign holding the most money is the one they
  // opened this page to look at.
  return [...groups.values()].sort((a, b) => b.earned - a.earned);
}
