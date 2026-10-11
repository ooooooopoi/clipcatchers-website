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

          clamp() is sized against the H1 above it, not against the column:
          the counter must sit a clear step BELOW the headline at every
          width, or the proof outweighs the claim it proves. The H1 is
          clamp(1.5rem,(100vw−2.5rem)/10.8,3.75rem) below lg — 25.9px at
          320, 31px at 375, reaching its 60px cap at 688 and holding it to
          1023 — then 72px from lg. The counter's 6vw gives 22.5/46 at
          375/768 and its 3.375rem cap holds 54px from 900 up. Narrowest
          gaps: 6px across 900–1023 (54 vs 60) and ~6px at 320 (20 vs
          25.9). The 1.25rem floor sits under the H1's own 1.5rem floor,
          so the step survives even below 300px where both clamps bottom
          out (20 vs 24). The live figure is eleven characters
          ("625,257,279") — ~140px at the 20px floor in tabular digits, so
          it clears a 320px phone with room; recheck the cap when it
          crosses 1B and gains two characters. */}
      <div className="border-y border-border py-12 text-center sm:py-16">
        <Rise className="display-num text-[clamp(1.25rem,6vw,3.375rem)] leading-none text-primary">
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
