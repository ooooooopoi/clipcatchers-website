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
export const AS_OF = "August 2026";

export const SITE_STATS = {
  viewsDelivered: "40.7M",
  clipsPublished: "1,486",
  creatorsPaid: "85",
  /** Numeric form, for the comparison maths on the homepage. */
  viewsDeliveredRaw: 40_700_000,
} as const;
