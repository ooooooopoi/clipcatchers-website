import { LiveViews } from "@/components/marketing/live-views";
import { anchorImpressions } from "@/components/marketing/impressions";
import type { PublicStats } from "@/lib/public-stats";
import { AS_OF, SITE_STATS } from "@/lib/site-stats";

/**
 * The proof, directly under the hero.
 *
 * The hero used to end on a single line — "40.7M views delivered for brands
 * so far" — and the rest of the evidence sat in Results, most of a page
 * further down. A brand deciding whether to keep reading does it in the first
 * screen, so the numbers that answer "are these people real" belong in the
 * first screen.
 *
 * One figure, down from four. "Creators paid", "campaigns run" and "clips
 * published" have all gone: they measure how big we are, and the question this
 * band exists to answer is whether the number is real. Scale is the argument a
 * young business loses, and three tiles of it were diluting the one that is
 * actually being billed.
 *
 * ── On what isn't here ──────────────────────────────────────────────────
 * There is no client count, and it's the obvious second tile. `brandName`
 * falls back to the campaign name when a campaign has no artist set, and
 * campaign names get typed fresh each time — so one client currently groups
 * as three rows ("Silent Collision", "Silent collision", "silent collision")
 * and counting those rows would overstate how many brands we've worked with.
 * The figure below is a sum, so it isn't affected by that; a client count
 * would be. It goes in once the grouping is fixed, not before.
 *
 * There is no CPM either, for a different reason — see the note on ClientRow
 * in lib/public-stats.ts.
 *
 * The arithmetic behind the number now lives in impressions.tsx, because the
 * subject pages carry the same counter and two copies of a staleness
 * calculation is two things to get wrong.
 */
export function Proof({ stats }: { stats: PublicStats }) {
  const { live, ticking, anchor, perSecond } = anchorImpressions(stats);

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-14">
      {/* No grid and no dividers any more — there is nothing to divide it
          from. The figure gets the size the other tiles were taking off it.

          Measured rather than guessed, because the live figure is eleven
          characters and the fallback is four, so the tight case never shows
          up locally: "198,505,055" is 190px at the 30px mobile size against
          240px of usable width at 320, and 304px at the 48px size from sm up.
          Both clear, with the mobile case the closer of the two. */}
      <div className="surface reveal rounded-2xl border border-border bg-card px-5 py-10 text-center">
        <p className="font-mono text-3xl font-semibold tracking-tight text-primary-ink sm:text-5xl">
          {live ? (
            <LiveViews initial={anchor} perSecond={perSecond} />
          ) : (
            SITE_STATS.viewsDelivered
          )}
        </p>
        {/* "Impressions", not "views", and the number underneath is unchanged:
            plays read off each live post. A play is what the rest of the
            industry prices as an impression, so this names the same thing in
            the buyer's own vocabulary. Nothing is multiplied — see the note at
            the top of impressions.tsx, which is the one that must stay true. */}
        <p className="mt-2.5 text-xs leading-tight text-muted-foreground">
          impressions delivered for clients
        </p>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        {!live
          ? `Across every campaign to date, as of ${AS_OF}.`
          : ticking
            ? "Read from our live reporting, not written by hand. The figure climbs at our measured 30-day delivery rate between reads, then corrects to the logged number."
            : "Read from our live reporting, not written by hand — the same rows each client sees on their own report."}
      </p>
    </section>
  );
}
