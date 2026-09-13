/**
 * The bits every clipper page repeats: its heading, and what it says when the
 * bot can't be reached.
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
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
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
    <p className="mt-8 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
      Can&apos;t reach the bot right now, so this isn&apos;t loading. Your link is fine — try
      again in a minute.
    </p>
  );
}

/** A labelled figure. Used for the metric rows on Earnings and Payouts. */
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
    <div className="px-4 py-5 text-center">
      <p className="font-mono text-lg font-semibold tracking-tight text-primary-ink sm:text-xl">
        {value}
      </p>
      <p className="mt-1 text-xs leading-tight text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p> : null}
    </div>
  );
}
