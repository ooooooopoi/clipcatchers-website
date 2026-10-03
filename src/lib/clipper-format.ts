/**
 * Money and counts as the clipper pages print them.
 *
 * In a module of their own so the browser can load them: clipper-data.ts
 * re-exports both, but it also reads the bot and checks link signatures,
 * which have to stay on the server.
 */

/** Money from the bot arrives as dollars, not cents — formatCurrency takes cents. */
export function dollars(n: number) {
  return `$${n.toFixed(2)}`;
}

/** 10000 -> "10K". Rates read as "$1 / 10K views", which is how they're quoted. */
export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return String(n);
}
