import type { Metadata } from "next";
import { BotOffline, PageHeading, Stat } from "@/components/clipper/chrome";
import { formatNumber } from "@/lib/format";
import { dollars, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

export default async function PayoutsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { earnings, offline } = await loadClipper(userId, sig);

  const withdrawable = earnings?.withdrawable ?? 0;
  const awaiting = earnings?.awaiting_release ?? 0;
  const hasPayout = Boolean(earnings?.payout_method);

  return (
    <>
      <PageHeading
        title="Payouts"
        subtitle="What you can take out, and where it goes."
      />

      {offline ? (
        <BotOffline />
      ) : (
        <>
          {/* The split matters: money from a campaign that hasn't been released
              is earned but not reachable, and one combined total would read as
              "you have this" when /withdraw would refuse most of it. */}
          <div className="surface mt-8 max-w-2xl rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Ready to withdraw
              </p>
              <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight text-primary-ink sm:text-4xl">
                {dollars(withdrawable)}
              </p>

              {withdrawable > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Run{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                    /withdraw
                  </code>{" "}
                  in Discord to be paid out
                  {hasPayout ? "" : " — you'll need a payout method set first"}.
                </p>
              ) : awaiting > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing to withdraw yet. Your earnings are still with campaigns that
                  haven&apos;t been released for payout.
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing to withdraw yet. Approved clips above the view floor build this up.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-3">
              <Stat
                value={dollars(awaiting)}
                label="earned, awaiting release"
                hint="Released once a campaign is settled."
              />
              <Stat value={dollars(earnings?.already_paid ?? 0)} label="paid to you so far" />
              <Stat value={formatNumber(earnings?.clips ?? 0)} label="clips submitted" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3.5 text-xs sm:px-7">
              <span className="text-muted-foreground">Paid to</span>
              {hasPayout ? (
                <span className="font-mono">
                  {earnings?.payout_method} · {earnings?.payout_address}
                </span>
              ) : (
                <span className="text-warning">
                  Not set — run <code className="font-mono">/set-payout</code> in Discord
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 max-w-2xl space-y-2 text-xs text-muted-foreground/80">
            <p>
              Withdrawals run through the bot rather than this page. Money only leaves after
              you ask for it, and the address it goes to is the one shown above — check it
              before you withdraw.
            </p>
            <p>Network fees on a withdrawal come out of the amount sent.</p>
          </div>
        </>
      )}
    </>
  );
}
