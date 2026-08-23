import { PAID_SOCIAL_CPM } from "@/lib/pricing";
import { getPublicStats } from "@/lib/public-stats";
import { AS_OF, SITE_STATS } from "@/lib/site-stats";
import { formatCompact } from "@/lib/format";

/**
 * Results, per client, from the database.
 *
 * This was a single 40.7M in a box, typed in by hand. A total with no shape to
 * it answers "are you real" and nothing else — the question a brand actually
 * has is "has this worked for someone like me", which needs the work broken
 * out per client.
 *
 * Every figure here is read from the same rows a client sees in their own
 * dashboard, so the marketing claim and the client's report can't disagree and
 * neither can go stale. Names appear only for clients on the PUBLIC_CLIENTS
 * allowlist; see lib/public-stats.ts. Everyone else still shows their real
 * numbers, just without a name attached.
 *
 * If the database can't be reached the section falls back to the last recorded
 * totals rather than rendering an empty page or a zero.
 */
export async function Results() {
  const stats = await getPublicStats();

  const hasLiveRows = stats.live && stats.clients.length > 0 && stats.totalViews > 0;

  // Views only. Clips published and creators paid are how we do it, not what a
  // brand is buying — and three numbers side by side make the one that matters
  // take longer to find. The per-client rows below carry the same discipline.
  const totalViews = hasLiveRows
    ? formatCompact(stats.totalViews)
    : SITE_STATS.viewsDelivered;

  // Top clients by delivery. Anything past eight is a long tail of small
  // campaigns that adds rows without adding evidence.
  const rows = stats.clients.filter((c) => c.views > 0).slice(0, 8);
  const paidSocialTotal = (stats.totalViews / 1000) * PAID_SOCIAL_CPM.meta;

  return (
    <section
      id="results"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">Results</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Views we&apos;ve actually delivered
        </h2>
        <p className="mt-4 text-muted-foreground">
          Counted from the individual posts that earned them, not estimated. Every figure
          below can be traced back to the video it came from.
        </p>
      </div>

      {/* The total. Deliberately not rounded up — a number ending in .7 is one
          somebody counted. */}
      <div className="surface reveal mx-auto mt-12 max-w-2xl rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <p className="font-mono text-6xl font-semibold tracking-tight text-primary-ink sm:text-7xl">
          {totalViews}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">views delivered for brands</p>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        {hasLiveRows
          ? `Across ${stats.campaigns} campaign${stats.campaigns === 1 ? "" : "s"}, read live from our reporting.`
          : `Across every campaign to date, as of ${AS_OF}.`}
      </p>

      {/* Per client. This is the part that answers "has this worked for
          someone like me" — a total can't. */}
      {rows.length > 0 && (
        <div className="surface reveal mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Delivery by client</p>
            {/* Views and what they paid per thousand to get them. The CPM is
                each client's own — worked out from their spend against their
                delivery — not the list rate and not an average. A campaign
                that closed early or overdelivered lands somewhere different,
                and that spread is the honest thing to show. */}
            <p className="text-xs text-muted-foreground">views · their CPM</p>
          </div>

          <ul className="divide-y divide-border">
            {rows.map((client, i) => {
              const share = stats.totalViews ? (client.views / rows[0].views) * 100 : 0;
              return (
                <li
                  key={`${client.label}-${i}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        client.named ? "" : "text-muted-foreground"
                      }`}
                    >
                      {client.label}
                    </p>
                    {/* The bar is the comparison; the number beside it is the
                        detail. Scaled against the top client, not the total,
                        so the smallest row is still visible. */}
                    <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max(share, 3)}%` }}
                      />
                    </span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-4 text-right font-mono tabular-nums">
                    <span className="w-20 text-base font-semibold">
                      {formatCompact(client.views)}
                    </span>
                    {/* Only rendered where there's real spend behind it — a
                        "$0.00 CPM" beside a client's name says we worked for
                        free rather than that the figure is missing. */}
                    <span className="w-16 text-sm text-muted-foreground">
                      {client.cpm > 0 ? `$${client.cpm.toFixed(2)}` : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {stats.clients.some((c) => !c.named) && (
            <p className="border-t border-border bg-muted/40 px-6 py-3.5 text-xs leading-relaxed text-muted-foreground">
              Clients are named only where they&apos;ve agreed to it. The rest show their
              real figures without the name — we&apos;ll walk you through any of them, with
              the per-clip report, on a call.
            </p>
          )}
        </div>
      )}

      {hasLiveRows && paidSocialTotal > 0 && (
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">For scale:</span> buying that reach
          as Meta ads at a conservative ${PAID_SOCIAL_CPM.meta.toFixed(2)} CPM would have
          cost around{" "}
          <span className="font-mono text-foreground">
            ${Math.round(paidSocialTotal).toLocaleString()}
          </span>
          , and would have left nothing on the platform once the spend stopped.
        </p>
      )}
    </section>
  );
}
