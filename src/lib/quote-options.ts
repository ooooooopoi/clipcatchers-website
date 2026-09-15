/**
 * The enquiry form's fixed answers, and the rules for prefilling them from a
 * URL.
 *
 * Kept out of quote-form.tsx so the server component behind /launch can read
 * the same lists when it validates a prefill — a link that preselects an
 * option the form doesn't offer would render a chip nobody else can pick, and
 * send a value no one downstream recognises.
 */

export const BUDGETS = [
  "Under $500",
  "$500 – $1,000",
  "$1,000 – $5,000",
  "$5,000+",
  "Not sure yet",
] as const;

export const CATEGORIES = [
  "Music / label",
  "Gaming",
  "App",
  "Crypto / web3",
  "iGaming / casino",
  "Podcast",
  "Consumer brand",
  "Startup / SaaS",
  "Something else",
] as const;

/** Letters and digits only, lowercased — "Music / label" -> "musiclabel". */
function squash(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Match a URL value against one of the fixed options.
 *
 * Deliberately forgiving about punctuation and case, because the whole point
 * of these links is that a human writes them by hand: `?category=music`,
 * `Music / label` and `music-label` are all the same answer. It is not
 * forgiving about *which* answers exist — anything unrecognised returns
 * undefined and the field renders unanswered, matching how `?mode=` already
 * treats a mangled value.
 */
function matchOption(
  value: string | undefined,
  options: readonly string[],
): string | undefined {
  if (!value) return undefined;
  const wanted = squash(value);
  if (!wanted) return undefined;
  const exact = options.find((o) => squash(o) === wanted);
  if (exact) return exact;
  // Prefix, so `?category=crypto` finds "Crypto / web3" without `a` matching
  // "App" and every other option containing that letter.
  return options.find((o) => squash(o).startsWith(wanted));
}

/**
 * Whether the value was *meant* as an amount, whether or not it is a valid one.
 *
 * Digits, currency punctuation and a leading sign — but no letters and no
 * dashes between numbers, so the bracket labels ("Under $500",
 * "$1,000 – $5,000") are not caught by it.
 *
 * This exists to stop a rejected amount falling through to the bracket
 * matcher. `?budget=-500` failed parseAmount, then squash() dropped the minus
 * and "500" prefix-matched "$500 – $1,000" — so a nonsense link quietly
 * preselected a real budget. A value aimed at the number field and refused
 * there must end as no answer, not as a different answer.
 */
const AMOUNT_ISH = /^[-+]?[$\s]*\d[\d,.\s]*$/;

/**
 * Read an exact figure out of a budget parameter.
 *
 * `$1,500`, `1500` and `1500.00` are the same number. Returns undefined for
 * anything that isn't a sensible amount of money.
 */
function parseAmount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  // Upper bound matches the campaign schema's; the lower one keeps $0 links
  // from preselecting a figure that would read as a free campaign.
  if (!Number.isFinite(n) || n < 1 || n > 10_000_000) return undefined;
  return n;
}

/** `1500` -> `$1,500`. Whole dollars — these are round offer figures. */
export function formatBudget(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

export type QuotePrefill = {
  /** The category chip to preselect, if the link named a real one. */
  category?: string;
  /** The budget chip to preselect — a bracket, or an exact figure. */
  budget?: string;
  /**
   * The full budget option list, with an exact figure prepended when the link
   * carried one.
   *
   * An exact amount becomes a real chip rather than being written into the
   * notes, because `budget` is free text all the way to the Discord embed:
   * the figure travels on the field that already means budget, and needs no
   * new key in the API schema or the bot. The brackets stay beside it so a
   * visitor who was quoted $1,500 but wants to say "$5,000+" still can.
   */
  budgetOptions: readonly string[];
  /** Prefill for the brand/artist field, so a link can name the label. */
  artist?: string;
};

/**
 * Turn `?category=music&budget=1500&artist=Some+Label` into form defaults.
 *
 * Every value is either matched against a fixed list or re-formatted from a
 * parsed number, so nothing from the URL reaches the form as-is except
 * `artist`, which is a plain text input and capped.
 */
export function parseQuotePrefill(params: {
  category?: string;
  budget?: string;
  artist?: string;
}): QuotePrefill {
  const category = matchOption(params.category, CATEGORIES);

  const amount = parseAmount(params.budget);
  const exact = amount === undefined ? undefined : formatBudget(amount);
  // A value that was aimed at the number field and refused there gets no
  // second chance at the brackets — see AMOUNT_ISH.
  const refusedAmount =
    exact === undefined && !!params.budget && AMOUNT_ISH.test(params.budget.trim());
  const bracket = exact || refusedAmount ? undefined : matchOption(params.budget, BUDGETS);

  return {
    category,
    budget: exact ?? bracket,
    budgetOptions: exact ? ([exact, ...BUDGETS] as const) : BUDGETS,
    artist: params.artist?.trim().slice(0, 120) || undefined,
  };
}
