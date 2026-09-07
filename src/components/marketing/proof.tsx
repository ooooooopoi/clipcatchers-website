import { LiveViews } from "@/components/marketing/live-views";
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
 * ── On what isn't here ──────────────────────────────────────────────────
 * There is no client count, and it's the obvious fifth tile. `brandName`
 * falls back to the campaign name when a campaign has no artist set, and
 * campaign names get typed fresh each time — so one client currently groups
 * as three rows ("Silent Collision", "Silent collision", "silent collision")
 * and counting those rows would overstate how many brands we've worked with.
 * Every figure below is a sum or a distinct count, so none of them are
 * affected by that; a client count would be. It goes in once the grouping is
 * fixed, not before.
 *
 * There is no CPM either, for a different reason — see the note on ClientRow
 * in lib/public-stats.ts.
 */
export function Proof({ stats }: { stats: PublicStats }) {
  const live = stats.live && stats.totalViews > 0;

  // Live where the database answered, the last recorded totals where it
  // didn't. A hero that says "0 views delivered" during a blip is worse than
  // one an hour out of date.
  //
  // One figure, down from four. "Creators paid", "campaigns run" and "clips
  // published" have all gone: they measure how big we are, and the question
  // this band exists to answer is whether the number is real. Scale is the
  // argument a young business loses, and three tiles of it were diluting the
  // one that is actually being billed.
  //
  // What is left is the figure the whole page rests on, alone and moving. The
  // caption underneath does the work the other tiles were doing badly.
  //
  // The rate is only trustworthy if there was delivery in the window to
  // measure. No delivery, no counter — the tile falls back to a still figure
  // rather than ticking at a rate nothing supports.
  const ticking = live && stats.viewsPerSecond > 0;

  // ── The counter has to keep time when nobody is watching ─────────────────
  // `totalViews` is whatever the cache last read, and that cache lives for an
  // hour. Anchoring the counter straight onto it meant the number restarted
  // from a figure up to an hour stale every time someone opened the page — at
  // ~69 views a second, a quarter of a million short — and then climbed from
  // there. It tracked the visit rather than the clock.
  //
  // So the gap is paid off here, before the number is ever rendered: whatever
  // has accrued between the read and this request is added on. Someone
  // arriving after a quiet night sees the night's delivery already counted.
  //
  // Deliberately computed on the server. `/` is dynamic, so this runs per
  // request against a clock we control; the client then only ever measures
  // its own elapsed time from hydration and never compares its clock to
  // ours, which is what keeps a visitor whose system clock is days out from
  // seeing a wild number.
  //
  // The cap exists to bound a corrupt `asOf` — a clock jump, a cache entry
  // from another era — not to bound honest staleness.
  //
  // It was two hours, which was wrong, and wrong in a way the client already
  // proved: a tab left open ticks forward indefinitely, so the projection is
  // already trusted over long spans. Capping the server at two hours while
  // the browser runs unbounded is the same arithmetic under two rules.
  //
  // Twelve hours covers the case this is actually for. unstable_cache only
  // revalidates when someone asks, so an overnight lull leaves the figure
  // untouched until the first visitor in the morning — measured here, it sat
  // on one value for hours. At two hours that visitor saw a number ten hours
  // behind. Their request refreshes the cache, so the projection is a bridge
  // to the next real read rather than a substitute for one.
  const CATCH_UP_CAP_SECONDS = 12 * 60 * 60;
  const staleSeconds = Math.min(
    Math.max(0, (Date.now() - stats.asOf) / 1000),
    CATCH_UP_CAP_SECONDS,
  );
  const anchor = stats.totalViews + Math.floor(staleSeconds * stats.viewsPerSecond);

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-14">
      {/* No grid and no dividers any more — there is nothing to divide them
          from. The figure gets the size the other tiles were taking off it.

          Measured rather than guessed, because the live figure is eleven
          characters and the fallback is four, so the tight case never shows
          up locally: "198,505,055" is 190px at the 30px mobile size against
          240px of usable width at 320, and 304px at the 48px size from sm up.
          Both clear, with the mobile case the closer of the two. */}
      <div className="surface reveal rounded-2xl border border-border bg-card px-5 py-10 text-center">
        <p className="font-mono text-3xl font-semibold tracking-tight text-primary-ink sm:text-5xl">
          {live ? (
            <LiveViews initial={anchor} perSecond={stats.viewsPerSecond} />
          ) : (
            SITE_STATS.viewsDelivered
          )}
        </p>
        <p className="mt-2.5 text-xs leading-tight text-muted-foreground">
          views delivered for clients
        </p>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        {!live
          ? `Across every campaign to date, as of ${AS_OF}.`
          : ticking
            ? "Read from our live reporting, not written by hand. Views climb at our measured 30-day delivery rate between reads, then correct to the logged figure."
            : "Read from our live reporting, not written by hand — the same rows each client sees on their own report."}
      </p>
    </section>
  );
}
