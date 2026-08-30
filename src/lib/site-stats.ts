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
  // Updated 2026-08-30 against live production figures. The previous values
  // (40.7M views, 1,486 clips) were roughly a third of reality, and that only
  // shows when the database is unreachable — so the one moment this fallback
  // exists for was the one moment it would have understated the business by
  // 3x on its own homepage. Recheck these whenever the database is known good.
  viewsDelivered: "130M",
  clipsPublished: "3,734",
  // Not verified in that pass, and probably still low: 117 clippers are owed
  // money right now, which is already more than this claims have ever been
  // paid. Left rather than guessed — the bot's endpoints report clips and
  // amounts, not distinct creators across all time. Fix it from the database
  // (`SELECT COUNT(DISTINCT handle)`) next time it's reachable.
  creatorsPaid: "85",
  /** Numeric form, for the comparison maths on the homepage. */
  viewsDeliveredRaw: 130_000_000,
} as const;
