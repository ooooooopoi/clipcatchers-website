import type { Metadata } from "next";
import Link from "next/link";
import { BotOffline, PageHeading, Stat } from "@/components/clipper/chrome";
import { formatNumber } from "@/lib/format";
import { dollars, groupByCampaign, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { earnings, offline } = await loadClipper(userId, sig);
  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  const clips = earnings?.breakdown ?? [];
  const groups = groupByCampaign(clips);
  // Already sent ahead of clips settling. The bot nets it out of `owed`, so
  // the per-campaign rows (gross clip value) sum to more than the tile — this
  // is the line that accounts for the difference on screen.
  const advance = earnings?.advance ?? 0;

  // Earning clips only — the campaign totals below should add up to the money,
  // so a rejected or below-floor clip belongs in the count, not the sum.
  const earningClips = clips.filter((c) => c.worth > 0);
  const views = earningClips.reduce((sum, c) => sum + c.views, 0);

  return (
    <>
      <PageHeading
        title="Earnings"
        subtitle="What you've made, and which campaigns it came from."
      />

      {offline ? (
        <BotOffline />
      ) : (
        <>
          {/* "Owed" means a campaign that has ended and hasn't been paid.
              Earnings on a live campaign sit in their own tile: the figure
              still moves with views, and the audit at close can reject clips —
              so calling it owed would state a debt nobody has incurred, and
              the correction afterwards reads as money being taken away. */}
          <div className="surface mt-8 grid grid-cols-2 divide-border rounded-2xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
            <Stat
              value={dollars(earnings?.running ?? 0)}
              label="still running"
              hint="Moves with views. Not owed until the campaign ends."
            />
            <Stat
              value={dollars(earnings?.owed ?? 0)}
              label="owed to you"
              hint="From campaigns that have finished."
            />
            {/* What has reached them, not what their settled clips are worth.
                The two differ by any advance, and this printed the second
                under a label promising the first. */}
            <Stat
              value={dollars(
                earnings?.total_sent ?? (earnings?.already_paid ?? 0) + advance,
              )}
              label="paid so far"
              hint={
                advance > 0
                  ? `Includes ${dollars(advance)} sent ahead of the clips covering it.`
                  : undefined
              }
            />
            <Stat value={formatNumber(earnings?.clips ?? 0)} label="clips submitted" />
          </div>

          <p className="mt-3 text-xs text-muted-foreground/70">
            Views are read off each live post, so what a clip is worth moves as it does. Only
            approved clips above the campaign&apos;s view floor earn. Nothing counts as owed
            until its campaign finishes and the figures have been checked — until then it can
            still go up as well as down.
          </p>

          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              By campaign
            </h2>

            {groups.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Nothing yet. Submit a clip to a live campaign and it shows up here.
              </p>
            ) : (
              // The right-hand figure is what is STILL OWED, never lifetime
              // worth. Showing the total made a settled campaign look exactly
              // like one that still owes money — same number, same weight — so
              // money already sent read as money waiting.
              <>
                <ul className="mt-4 space-y-2">
                {groups.map((group) => (
                  <li
                    key={group.id}
                    className="surface flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-border bg-card px-4 py-3.5"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.clips.length} {group.clips.length === 1 ? "clip" : "clips"}
                    </span>

                    {group.paid > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {dollars(group.paid)} paid out
                      </span>
                    ) : null}

                    {group.active ? (
                      // Still running: real money so far, but not a debt yet.
                      // Shown in the muted weight the other provisional figures
                      // use, so it doesn't read as "waiting to be sent".
                      <span className="font-mono text-sm text-muted-foreground">
                        {dollars(group.running)}{" "}
                        <span className="font-sans text-xs">running</span>
                      </span>
                    ) : group.owed > 0 ? (
                      <span className="font-mono text-sm font-semibold text-primary-ink">
                        {dollars(group.owed)}
                      </span>
                    ) : (
                      // Nothing outstanding. A muted word rather than $0.00,
                      // which in a column of money reads as "you earned nothing
                      // here" instead of "this one is finished".
                      <span className="text-xs font-medium text-success">settled</span>
                    )}
                  </li>
                  ))}

                  {advance > 0 ? (
                    // Money that already left, listed with the campaigns so the
                    // column still adds up. Withdrawals take dollars, not whole
                    // clips — so a clip can stand "unpaid" above while most of
                    // its value is in the wallet already. Without this row the
                    // page quietly claims that money is still coming.
                    <li className="surface flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-border bg-card px-4 py-3.5">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        Already withdrawn, ahead of clips settling
                      </span>
                      <span className="text-xs text-muted-foreground">
                        counted off the total above
                      </span>
                      <span className="font-mono text-sm font-semibold text-muted-foreground">
                        −{dollars(advance)}
                      </span>
                    </li>
                  ) : null}
                </ul>

                <p className="mt-3 text-xs text-muted-foreground/70">
                  On a finished campaign the figure on the right is what you&apos;re owed. On
                  one still running it&apos;s what you&apos;ve earned so far, which can still
                  change. Anything already sent — whether a payout or a withdrawal you made
                  yourself — isn&apos;t counted again.
                </p>
              </>
            )}
          </section>

          <p className="mt-8 text-sm text-muted-foreground">
            To take money out, see{" "}
            <Link
              href={`${base}/payouts`}
              className="text-primary-ink underline-offset-4 hover:underline"
            >
              Payouts
            </Link>
            .
          </p>
        </>
      )}
    </>
  );
}
