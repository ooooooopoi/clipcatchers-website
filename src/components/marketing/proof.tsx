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
  // Two tiles, not four. "Creators paid" and "campaigns run" were both
  // removed: they measure how big we are, and the question this band exists
  // to answer is whether the numbers are real. Views and clips carry that on
  // their own — one is the figure being billed, the other is the count of
  // things it can be traced back to. The other two were scale, and scale is
  // the argument a young business loses.
  //
  // The rate is only trustworthy if there was delivery in the window to
  // measure. No delivery, no counter — the tile falls back to a still figure
  // rather than ticking at a rate nothing supports.
  const ticking = live && stats.viewsPerSecond > 0;

  const metrics = [
    {
      value: live ? (
        <LiveViews initial={stats.totalViews} perSecond={stats.viewsPerSecond} />
      ) : (
        SITE_STATS.viewsDelivered
      ),
      label: "views delivered for clients",
      // Every digit, where the other is rounded — see live-views.tsx for why
      // a compact figure can't visibly tick.
      wide: true,
    },
    {
      value: live ? stats.totalClips.toLocaleString() : SITE_STATS.clipsPublished,
      label: "clips published",
    },
  ];

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-14">
      {/* Always two, on every path — the count no longer varies, so the
          column maths and the odd-tile span that used to sit here are gone
          with it. Stacked on a phone rather than squeezed side by side: an
          eleven-digit figure and a label do not both fit in half of 320px. */}
      <div className="surface reveal grid grid-cols-1 divide-y divide-border rounded-2xl border border-border bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {metrics.map((m) => (
          <div key={m.label} className="px-4 py-7 text-center sm:px-5">
            {/* The ticking tile carries every digit where the other is
                rounded, so it takes a step down — eleven characters of mono
                overflow a half-width tile otherwise. */}
            <p
              className={`font-mono font-semibold tracking-tight text-primary-ink ${
                m.wide ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
              }`}
            >
              {m.value}
            </p>
            <p className="mt-1.5 text-xs leading-tight text-muted-foreground">{m.label}</p>
          </div>
        ))}
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
