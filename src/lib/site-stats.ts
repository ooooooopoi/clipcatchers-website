/**
 * The headline figures, in one place.
 *
 * These were hardcoded into the homepage and again — rounded differently — on
 * the quote page, which is how a site ends up claiming 40.7M in one place and
 * 40M+ in another. They're counted from approved clips in the ledger and are
 * deliberately not rounded up: anyone who asks to see the working can be shown
 * the per-clip report.
 *
 * Recompute and update AS_OF whenever these change. Until this reads from the
 * database directly, the date is the honest part — it says how fresh the claim
 * on the page actually is.
 */
export const AS_OF = "September 2026";

export const SITE_STATS = {
  // Updated 2026-09-11, counted across all 22 non-PENDING campaigns, by running
  // public-stats.ts's own grouping against production — so this cannot drift
  // from the live page's definition the way a hand-count would.
  //
  // On the basis: this is reach — every view the approved clips delivered,
  // including growth after a campaign closed — because that is what the live
  // query publishes (`MAX(views, reach_views)`) and what each client sees on
  // their own report. Payable views, the figure clippers were actually paid
  // on, stood at 140.9M on the same day. The two diverge the moment a
  // campaign closes and its clips keep running. A fallback quoting the
  // payable number would quietly contradict the live page by 40%.
  //
  // Previous values (198M, 4,857) went four days stale while the database was
  // unreachable — DATABASE_URL pointed at a retired Neon endpoint, so every
  // page served this fallback and nothing showed that it had. The ones before
  // those (130M, 3,734) were a week stale, and the ones before that a third of
  // reality. Staleness only shows when the database is down, so the one moment
  // this exists for is the one moment it misrepresents the business. Recheck
  // whenever the database is known good.
  viewsDelivered: "224.1M",
  clipsPublished: "5,484",
  // ── Left at 129 deliberately; do not "refresh" this to match the others ──
  // This is the only field the dashboard database cannot recompute.
  // CampaignClip has no paid/status column — it stores campaignId, externalId,
  // url, platform, handle, views and nothing else — so "has at least one paid
  // clip" is answerable only from the bot's SQLite ledger. 129 is the last
  // figure measured there.
  //
  // The live homepage doesn't use this number (it shows public-stats' distinct
  // handle count, 235 as of today, under the label "creators activated"), but
  // opengraph-image.tsx does, under the label "creators paid" — and that card
  // is static, so it never gets corrected by a live read. Setting this to 235
  // would put "235 creators paid" on every social share off a count that
  // includes creators who have never been paid. Update it from the bot, or not
  // at all.
  creatorsPaid: "129",
  /** Numeric form, for the comparison maths on the homepage. */
  viewsDeliveredRaw: 224_100_000,
} as const;
