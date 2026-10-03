/**
 * How one clip's state reads: its status dot, its engagement, and the line
 * under it. Shared by the dashboard's clip list and the phone's clip panel,
 * so the two can't describe the same clip differently.
 */
import type { ClipperClip } from "@/lib/bot";

/**
 * Whether a clip is heading for rejection on engagement, and can still be
 * helped.
 *
 * All four conditions matter. Unread clips have no percentage and must not be
 * accused on a number nobody measured; below the view floor the ratio is noise
 * on a handful of interactions; a clip already rejected has its real reason
 * printed above this; and once the campaign has closed the audit has run, so
 * the warning is advice about a decision already taken.
 */
export function atRisk(
  clip: { engagement_pct?: number | null; views: number; status: string; campaign_active: boolean },
  floor: number | null,
  minViews: number | null,
): boolean {
  if (floor === null || minViews === null) return false;
  if (clip.engagement_pct == null) return false;
  return (
    clip.views >= minViews &&
    clip.engagement_pct < floor &&
    clip.status === "approved" &&
    clip.campaign_active
  );
}

/**
 * The one line said under a clip, if any, and whether it's a warning.
 *
 * The reason is the actionable part of a rejection — "rejected" alone tells
 * them nothing they can fix. The engagement warning is said only while it can
 * still be acted on. Once the campaign closes the audit has already run, and
 * telling someone their engagement is low about a clip they can no longer
 * affect is just a poke.
 */
export function clipNote(
  clip: Pick<
    ClipperClip,
    "status" | "flag_reason" | "below_min" | "engagement_pct" | "views" | "campaign_active"
  >,
  floor: number | null,
  minViews: number | null,
): { text: string; warning: boolean } | null {
  if (clip.status === "rejected" && (clip.flag_reason || "").trim()) {
    return { text: clip.flag_reason, warning: true };
  }
  if (clip.below_min) {
    return {
      text: "Under the campaign's view floor — earns nothing until it passes it.",
      warning: false,
    };
  }
  if (atRisk(clip, floor, minViews)) {
    return {
      text: `Engagement is under ${floor}% — clips below that can be rejected when the campaign closes.`,
      warning: true,
    };
  }
  return null;
}

/**
 * A clip's engagement, or nothing.
 *
 * Renders only when there is a real reading. Most clips are never scraped, and
 * a dash in the column reads as "zero engagement" to the person whose clip it
 * is — worse than leaving the space empty, because it is an accusation made out
 * of missing data.
 */
export function Engagement({
  pct,
  views,
  floor,
  minViews,
}: {
  pct?: number | null;
  views: number;
  floor: number | null;
  minViews: number | null;
}) {
  if (pct == null) return null;

  // Only coloured once the ratio means something. Under the view floor a
  // couple of likes swing it by whole percent, and red on that is a scare
  // about arithmetic rather than about the clip.
  const judged = floor !== null && minViews !== null && views >= minViews;
  const low = judged && pct < floor;

  return (
    <span
      className={`font-mono text-xs ${low ? "text-warning" : "text-muted-foreground"}`}
      title={
        judged
          ? `Likes, comments, shares and saves as a share of views. The close audit expects above ${floor}%.`
          : `Likes, comments, shares and saves as a share of views. Only judged above ${minViews?.toLocaleString()} views.`
      }
    >
      {pct.toFixed(1)}% eng
    </span>
  );
}

/** The word for a clip's state. Paid beats approved: once money has gone out,
 *  "approved" is history rather than status. */
export function statusOf(status: string, paid: boolean): { colour: string; label: string } {
  const [colour, label] = paid
    ? ["bg-success", "Paid"]
    : status === "approved"
      ? ["bg-success/70", "Approved"]
      : status === "pending"
        ? ["bg-warning/80", "Pending"]
        : status === "rejected"
          ? ["bg-destructive/80", "Rejected"]
          : ["bg-muted-foreground/50", "Taken down"];
  return { colour, label };
}

/**
 * One dot and one word for a clip's state. A fixed width in the dashboard's
 * list, so the campaign names line up; `fixed={false}` where it sits in a
 * line of its own.
 */
export function StatusDot({
  status,
  paid,
  fixed = true,
}: {
  status: string;
  paid: boolean;
  fixed?: boolean;
}) {
  const { colour, label } = statusOf(status, paid);

  return (
    <span className={`flex ${fixed ? "w-24 " : ""}shrink-0 items-center gap-2`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${colour}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
