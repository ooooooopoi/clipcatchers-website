import type { ClipperData } from "@/lib/clipper-data";
import { dollars } from "@/lib/clipper-data";

/**
 * One line in the clipper's notifications panel.
 *
 * `at` is unix seconds for something that happened, and null for something
 * that is simply true right now — money sitting unwithdrawn, no payout address
 * on file. Both belong here, but they are not the same kind of thing and the
 * panel shows them apart: a standing condition sorted into a feed by a made-up
 * timestamp is how "you have money waiting" ends up buried under last month's
 * campaign closing.
 */
export type ClipperNotice = {
  /**
   * Stable across renders, because it's what "seen" is remembered by.
   *
   * Standing conditions key on their kind alone, so the amount ticking up as
   * views come in doesn't re-flag something already read. Events key on the
   * campaign and the moment, so each release announces itself exactly once.
   */
  id: string;
  title: string;
  body: string;
  /** Unix seconds, or null for a standing condition. */
  at: number | null;
  /** Appended to the clipper's base path. */
  href?: string;
  tone: "good" | "warn" | "plain";
};

/**
 * Everything worth telling a clipper, derived from what the page already has.
 *
 * ── Why this reads existing data instead of a notifications table ─────────
 * Every event here is already recorded somewhere the dashboard loads anyway: a
 * release is a flag and a timestamp on the campaign, an audit result is a
 * clip's status and reason, money waiting is the gap between owed and
 * withdrawable. A separate table would be a second copy of all of that, which
 * could disagree with the first — and a notification that contradicts the
 * balance beside it is worse than no notification.
 *
 * It also means nothing new has to be written when money moves. The write path
 * for a payout is the one place a bug costs real money, and this stays off it.
 */
export function buildNotices(data: ClipperData): ClipperNotice[] {
  const { earnings, campaigns } = data;
  if (!earnings) return [];

  const notices: ClipperNotice[] = [];
  const clips = earnings.breakdown ?? [];
  const minimum = earnings.payout_minimum || 0;

  // ── Standing conditions ────────────────────────────────────────────────
  if (earnings.withdrawable > 0) {
    const short = minimum > 0 && earnings.withdrawable < minimum;
    notices.push({
      id: "money-ready",
      title: short
        ? `${dollars(earnings.withdrawable)} released`
        : `${dollars(earnings.withdrawable)} ready to withdraw`,
      body: short
        ? `The minimum withdrawal is ${dollars(minimum)} — below that the transfer fee costs more than the payment. It keeps growing.`
        : "Yours to take whenever you want it.",
      at: null,
      href: "/earnings",
      tone: short ? "plain" : "good",
    });
  }

  // Only worth saying when they have money that a missing address would
  // actually strand. Someone who has never earned doesn't need chasing.
  const anyMoney = earnings.withdrawable > 0 || earnings.owed > 0 || earnings.running > 0;
  if (!earnings.payout_method && anyMoney) {
    notices.push({
      id: "no-payout-method",
      title: "No payout method set",
      body: "Your earnings have nowhere to go yet. Add a USDT address so a withdrawal can reach you.",
      at: null,
      href: "/earnings",
      tone: "warn",
    });
  }

  if (earnings.awaiting_release > 0) {
    notices.push({
      id: "awaiting-release",
      title: `${dollars(earnings.awaiting_release)} earned, not released yet`,
      body: "It opens once the campaign's figures have been checked. Nothing for you to do.",
      at: null,
      href: "/earnings",
      tone: "plain",
    });
  }

  // Rejections carry their reason, which is the whole value of surfacing them
  // — "rejected" alone tells a clipper nothing they can act on. Capped so a
  // bulk audit doesn't turn the panel into a wall.
  const rejected = clips.filter(
    (c) => c.status === "rejected" && (c.flag_reason || "").trim(),
  );
  for (const clip of rejected.slice(0, 6)) {
    notices.push({
      id: `rejected-${clip.id}`,
      title: `Clip rejected — ${clip.campaign}`,
      body: clip.flag_reason,
      at: null,
      // No link since the Clips page went away. The reason — the one thing
      // that page added for a rejection — is already this notice's body.
      tone: "warn",
    });
  }
  if (rejected.length > 6) {
    notices.push({
      id: `rejected-more-${rejected.length}`,
      title: `${rejected.length - 6} more rejected clips`,
      // Used to say "Open Clips", which now points at nothing. Discord still
      // lists every clip with its reason.
      body: "Run /my-clips in Discord to see each one's reason.",
      at: null,
      tone: "warn",
    });
  }

  const belowMin = clips.filter((c) => c.below_min).length;
  if (belowMin > 0) {
    notices.push({
      id: "below-min",
      title: `${belowMin} clip${belowMin === 1 ? "" : "s"} under the view floor`,
      body: `${belowMin === 1 ? "It earns" : "They earn"} nothing until past the campaign's minimum views. Still climbing counts.`,
      at: null,
      href: "/earnings",
      tone: "plain",
    });
  }

  // ── Things that happened ───────────────────────────────────────────────
  // Only campaigns this clipper actually has clips in. A release they have no
  // stake in isn't news to them.
  const unpaidByCampaign = new Map<number, { worth: number; clips: number }>();
  for (const clip of clips) {
    if (clip.paid || clip.status === "rejected") continue;
    const row = unpaidByCampaign.get(clip.campaign_id) ?? { worth: 0, clips: 0 };
    row.worth += clip.worth;
    row.clips += 1;
    unpaidByCampaign.set(clip.campaign_id, row);
  }

  for (const campaign of campaigns) {
    const mine = unpaidByCampaign.get(campaign.id);
    if (!mine || mine.clips === 0) continue;

    const released = Number(campaign.payouts_released ?? 0) === 1;
    if (released) {
      // A release worth nothing is not news. Clips that came in under the view
      // floor, or never got views at all, still sit here unpaid forever — and
      // announcing "$0.00 is now withdrawable" for each of them buries the one
      // release that actually paid.
      if (mine.worth < 0.01) continue;

      const when = Number(campaign.payouts_released_at ?? 0);
      notices.push({
        // Keyed by the moment as well as the campaign: if a campaign were ever
        // released twice, that is genuinely two pieces of news.
        id: `released-${campaign.id}-${Math.round(when)}`,
        title: `Payouts released — ${campaign.name}`,
        body: `${dollars(mine.worth)} from your ${mine.clips} clip${
          mine.clips === 1 ? "" : "s"
        } is now withdrawable.`,
        at: when > 0 ? when : null,
        href: "/earnings",
        tone: "good",
      });
      continue;
    }

    // Closed but not released: the audit is what stands between them and the
    // money, so say that rather than leaving the campaign looking stalled.
    const closed = Number(campaign.closed_at ?? 0);
    if (closed > 0) {
      const many = mine.clips !== 1;
      notices.push({
        id: `ended-${campaign.id}-${Math.round(closed)}`,
        title: `${campaign.name} finished`,
        body:
          `Your ${mine.clips} clip${many ? "s" : ""} ${many ? "are" : "is"} being checked.` +
          // Only when there is something to open up. On a clip that earned
          // nothing, "$0.00 opens up once that's done" reads as a mistake.
          (mine.worth >= 0.01 ? ` ${dollars(mine.worth)} opens up once that's done.` : ""),
        at: closed,
        href: "/earnings",
        tone: "plain",
      });
    }
  }

  // Newest first within the timestamped ones; standing conditions keep the
  // order they were pushed in, which is roughly most-actionable first.
  return notices.sort((a, b) => {
    if (a.at === null && b.at === null) return 0;
    if (a.at === null) return -1;
    if (b.at === null) return 1;
    return b.at - a.at;
  });
}
