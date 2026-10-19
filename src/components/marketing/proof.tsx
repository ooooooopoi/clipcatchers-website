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
    <section className="seam-light relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-2 sm:pb-24">
      {/* The result, as big as the page allows, and nothing under it but
          what it counts. A 26-word note in 12px grey used to sit beneath the
          figure explaining how it was measured; at that size it read as
          small print, and small print under a big number is what makes a
          claim look like it has a catch. The method is on /verification.

          The counter is the H1's own size times 0.6, at every width: the
          same two expressions as the H1 above it (page.tsx), with the
          divisors and caps scaled by 0.6. The H1 is
          clamp(1.5rem,(100vw−2.5rem)/10.8,3.75rem) below lg, then
          min(4.5rem,(100vw−2.5rem)/13.66); so the counter is
          clamp(1rem,(100vw−2.5rem)/18,2.25rem), then
          min(2.7rem,(100vw−2.5rem)/22.77). That gives 18.6px under a 31px
          H1 at 375, 36 under 60 from 688 to 1023, and 43 under 72 on
          desktop. Its floor is 1rem rather than 0.9: no smaller text.

          Why 0.6 and not the 0.75 it was: Archivo's digits stand as tall as
          its capitals, and the figure is one solid line of bright blue, so
          at 0.75 (and 0.9 between 900 and 1023, where the old 6vw kept
          growing after the H1 had stopped) the owner read the counter as
          bigger than the headline (2026-10-19). Twice now: it was called
          "fat" on 2026-10-11. The proof must never outweigh the claim.

          The live figure is eleven characters ("633,703,531"), ~150px at
          18.6px in tabular digits; recheck when it crosses 1B and gains
          two characters. */}
      <div className="border-y border-border py-12 text-center sm:py-16">
        <Rise className="display-num text-[clamp(1rem,calc((100vw_-_2.5rem)/18),2.25rem)] leading-none text-primary lg:text-[min(2.7rem,calc((100vw_-_2.5rem)/22.77))]">
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
