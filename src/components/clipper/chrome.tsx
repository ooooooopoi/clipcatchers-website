/**
 * The bits every clipper page repeats: its heading, its figures, and what it
 * says when the bot can't be reached.
 *
 * These are the highest-leverage things in the dashboard — six pages use them,
 * so the difference between a figure that reads as a headline and one that
 * reads as body text is made once, here.
 */

export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

/**
 * The bot being down is not the same as the link being wrong. Telling someone
 * their link is invalid when it isn't sends them to support over an outage
 * that will clear on its own, so this says which of the two it is.
 */
export function BotOffline() {
  return (
    <p className="mt-8 max-w-2xl rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning">
      Can&apos;t reach the bot right now, so this isn&apos;t loading. Your link is fine — try
      again in a minute.
    </p>
  );
}

/**
 * A labelled figure. Used for the metric rows on Earnings and Payouts.
 *
 * Label above the number, left aligned, the number set large. It used to be
 * the other way up and centred, at a size barely above the label under it —
 * which made a row of them read as a caption block rather than as the figures
 * the page is for. Reading order matters too: the label says what you are
 * about to see, so it comes first.
 */
export function Stat({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="px-5 py-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-tight text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
}
