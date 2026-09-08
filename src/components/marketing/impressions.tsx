import { LiveViews } from "@/components/marketing/live-views";
import type { PublicStats } from "@/lib/public-stats";
import { AS_OF, SITE_STATS } from "@/lib/site-stats";
import { cn } from "@/lib/utils";

/**
 * The delivery figure, live, wherever it's needed.
 *
 * ── Why "impressions" ───────────────────────────────────────────────────
 * The number underneath is unchanged: views read off each live post, which is
 * the only delivery figure we own. On TikTok and Reels a view is a play, and a
 * play is what the rest of the industry prices as an impression — so this is a
 * fair name for the thing being counted, not a bigger number wearing a better
 * word. Nothing is multiplied, estimated up, or blended with a reach model.
 *
 * If that ever stops being true — if someone applies a factor to make this
 * look better — the caption below becomes a lie and the whole site's argument
 * goes with it. The rate must stay measured.
 *
 * ── The catch-up, which used to live in Proof ───────────────────────────
 * `totalViews` is whatever the cache last read, and that cache lives for an
 * hour. Anchoring straight onto it restarted the number from an hour-stale
 * figure on every visit and climbed from there — it tracked the visit rather
 * than the clock. So the gap is paid off here, before anything renders.
 *
 * Deliberately computed on the server, per request, against a clock we
 * control. The client then only measures its own elapsed time from hydration
 * and never compares its clock to ours, which is what stops a visitor whose
 * machine is set to next week seeing a wild number.
 *
 * The cap bounds a corrupt `asOf` — a clock jump, a cache entry from another
 * era — not honest staleness. Twelve hours because unstable_cache only
 * revalidates when someone asks: an overnight lull leaves the figure untouched
 * until the first visitor in the morning, and that visitor's request is what
 * refreshes it. The projection is a bridge to the next real read.
 */
const CATCH_UP_CAP_SECONDS = 12 * 60 * 60;

export type Anchored = {
  /** Whether the database answered at all. */
  live: boolean;
  /** Whether there is a credible measured rate to tick at. */
  ticking: boolean;
  /** The figure as of this request, staleness already paid off. */
  anchor: number;
  perSecond: number;
};

export function anchorImpressions(stats: PublicStats): Anchored {
  const live = stats.live && stats.totalViews > 0;
  const staleSeconds = Math.min(
    Math.max(0, (Date.now() - stats.asOf) / 1000),
    CATCH_UP_CAP_SECONDS,
  );
  return {
    live,
    // No delivery in the window means no rate worth ticking at. The figure
    // falls back to a still number rather than moving at a rate nothing
    // supports.
    ticking: live && stats.viewsPerSecond > 0,
    anchor: stats.totalViews + Math.floor(staleSeconds * stats.viewsPerSecond),
    perSecond: stats.viewsPerSecond,
  };
}

/**
 * The counter as a standalone block, for the subject pages.
 *
 * `size` is the only knob. The homepage's band is bigger than the one that
 * closes /pricing, and that difference should be a named size rather than
 * eight class names retyped per page and drifting.
 */
export function ImpressionCounter({
  stats,
  size = "md",
  label = "impressions delivered",
  className,
}: {
  stats: PublicStats;
  size?: "md" | "lg";
  label?: string;
  className?: string;
}) {
  const { live, ticking, anchor, perSecond } = anchorImpressions(stats);

  return (
    <div className={cn("text-center", className)}>
      <div className="surface reveal rounded-2xl border border-border bg-card px-5 py-10">
        <p
          className={cn(
            "font-mono font-semibold tracking-tight text-primary-ink",
            size === "lg" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-4xl",
          )}
        >
          {live ? (
            <LiveViews initial={anchor} perSecond={perSecond} />
          ) : (
            SITE_STATS.viewsDelivered
          )}
        </p>
        <p className="mt-2.5 text-xs leading-tight text-muted-foreground">{label}</p>
      </div>

      <p className="mt-3 text-xs text-muted-foreground/70">
        {!live
          ? `Across every campaign to date, as of ${AS_OF}.`
          : ticking
            ? "Read from our live reporting, not written by hand. The figure climbs at our measured 30-day delivery rate between reads, then corrects to the logged number."
            : "Read from our live reporting, not written by hand — the same rows each client sees on their own report."}
      </p>
    </div>
  );
}
