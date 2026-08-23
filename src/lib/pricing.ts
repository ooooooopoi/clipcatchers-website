/**
 * The published rate, in one place.
 *
 * It used to be typed separately into the homepage, the quote page and the
 * campaign wizard, and they drifted: the wizard estimated against a $2.50 CPM
 * while the site sold $0.50, so a client who typed $2,500 into the budget box
 * was quoted 1M views on a page that had just promised 5M. Every surface that
 * talks about money imports from here now, so that class of mistake can't
 * come back.
 *
 * To change what Clip Catchers charges, change RATE_PER_THOUSAND — the
 * homepage, the pricing calculator, the quote page and the wizard all follow.
 */

/** Dollars per 1,000 delivered views. */
export const RATE_PER_THOUSAND = 0.5;

/** Same number as a CPM string, for copy that reads better that way. */
export const RATE_LABEL = `$${RATE_PER_THOUSAND.toFixed(2)}`;

/**
 * What a budget should deliver at the published rate.
 *
 * Rounded down to the nearest 10,000 so the figure never reads as a promise
 * accurate to the view — it's an estimate, and a number ending in 000 says so.
 */
export function estimateViews(budgetDollars: number): number {
  if (!Number.isFinite(budgetDollars) || budgetDollars <= 0) return 0;
  const raw = (budgetDollars / RATE_PER_THOUSAND) * 1000;
  return Math.floor(raw / 10_000) * 10_000;
}

/** What a target view count would cost at the published rate. */
export function estimateBudget(views: number): number {
  if (!Number.isFinite(views) || views <= 0) return 0;
  return (views / 1000) * RATE_PER_THOUSAND;
}

/**
 * Effective cost per 1,000 views actually delivered.
 *
 * This is the number a client checks the campaign against afterwards, so it's
 * computed from real spend and real views rather than assumed to equal the
 * list rate — a campaign that closed early or was trimmed to budget won't.
 */
export function effectiveCpm(spentCents: number, views: number): number {
  if (!views) return 0;
  return (spentCents / 100 / views) * 1000;
}

/**
 * What the same reach costs as paid social.
 *
 * Deliberately conservative — the low end of each range, so the comparison on
 * the homepage understates our advantage rather than overstating it. A number
 * a prospect can beat in their own ad account is worse than no number.
 */
export const PAID_SOCIAL_CPM = {
  meta: 3.0,
  tiktok: 2.0,
} as const;

/** Cost of the same view count as Meta ads, at the conservative CPM above. */
export function paidSocialEquivalent(views: number, cpm = PAID_SOCIAL_CPM.meta): number {
  return (views / 1000) * cpm;
}
