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
  // Updated 2026-09-07, counted across all 17 campaigns that hold clips.
  //
  // On the basis: this is reach — every view the approved clips delivered,
  // including growth after a campaign closed — because that is what the live
  // query publishes (`MAX(views, reach_views)`) and what each client sees on
  // their own report. Payable views, the figure clippers were actually paid
  // on, stood at 140.9M on the same day. The two diverge the moment a
  // campaign closes and its clips keep running. A fallback quoting the
  // payable number would quietly contradict the live page by 40%.
  //
  // Previous values (130M, 3,734) were a week stale; the ones before those
  // were a third of reality, and staleness only shows when the database is
  // unreachable — so the one moment this exists for is the one moment it
  // misrepresents the business. Recheck whenever the database is known good.
  viewsDelivered: "198M",
  clipsPublished: "4,857",
  // Measured at last: 129 distinct creators hold at least one paid clip. The
  // previous 85 was never verified and was known to be low — more people were
  // owed money than this claimed had ever been paid.
  creatorsPaid: "129",
  /** Numeric form, for the comparison maths on the homepage. */
  viewsDeliveredRaw: 198_000_000,
} as const;
