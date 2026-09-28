import { LiveViews } from "@/components/marketing/live-views";
import { anchorImpressions } from "@/components/marketing/impressions";
import type { PublicStats } from "@/lib/public-stats";
import { Rise } from "@/components/marketing/reveal";
import { SITE_STATS } from "@/lib/site-stats";

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
  const { live, anchor, perSecond } = anchorImpressions(stats);

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-2 sm:pb-24">
      {/* The result, as big as the page allows, and nothing under it but
          what it counts. A 26-word note in 12px grey used to sit beneath the
          figure explaining how it was measured; at that size it read as
          small print, and small print under a big number is what makes a
          claim look like it has a catch. The method is on /verification.

          clamp() is sized from the live figure, which is eleven characters
          ("310,849,102") — at 9vw it clears a 360px phone with room, and it
          stops at 7rem so it never outgrows the column on a wide screen. */}
      <div className="border-y border-border py-12 text-center sm:py-16">
        <Rise className="display-num text-[clamp(2.25rem,9vw,7rem)] leading-none text-primary">
          {live ? (
            <LiveViews initial={anchor} perSecond={perSecond} />
          ) : (
            SITE_STATS.viewsDelivered
          )}
        </Rise>
        <p className="mt-4 text-base font-medium text-muted-foreground sm:mt-5 sm:text-lg">
          views delivered for brands
        </p>
      </div>
    </section>
  );
}
