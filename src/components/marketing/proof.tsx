import { formatCompact } from "@/lib/format";
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
  // one an hour out of date. Campaigns run has no hand-recorded fallback, so
  // it drops rather than being invented — three true tiles beat four with a
  // guess in them.
  const metrics = [
    {
      value: live ? formatCompact(stats.totalViews) : SITE_STATS.viewsDelivered,
      label: "views delivered for clients",
    },
    {
      value: live ? stats.totalClips.toLocaleString() : SITE_STATS.clipsPublished,
      label: "clips published",
    },
    {
      value: live ? stats.creators.toLocaleString() : SITE_STATS.creatorsPaid,
      label: "creators paid",
    },
    ...(live
      ? [{ value: stats.campaigns.toLocaleString(), label: "campaigns run" }]
      : []),
  ];

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-14">
      <div
        className={`surface reveal grid grid-cols-2 divide-x divide-y divide-border rounded-2xl border border-border bg-card sm:divide-y-0 ${
          metrics.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            // Two columns on a phone, so an odd number of tiles leaves the
            // last one stranded in the left half with a hole beside it. It
            // spans the full width instead. Only bites on the fallback path
            // (three tiles), which is exactly the path nobody looks at until
            // the database is down and it's on the homepage.
            className={`px-4 py-7 text-center sm:px-5 ${
              metrics.length % 2 === 1 && i === metrics.length - 1
                ? "col-span-2 sm:col-span-1"
                : ""
            }`}
          >
            <p className="font-mono text-2xl font-semibold tracking-tight text-primary-ink sm:text-3xl">
              {m.value}
            </p>
            <p className="mt-1.5 text-xs leading-tight text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        {live
          ? "Read from our live reporting, not written by hand — the same rows each client sees on their own report."
          : `Across every campaign to date, as of ${AS_OF}.`}
      </p>
    </section>
  );
}
