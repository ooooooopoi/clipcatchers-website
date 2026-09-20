import type { Metadata } from "next";
import { auth } from "@/auth";
import { BotOffline, PageHeading, Stat } from "@/components/clipper/chrome";
import { PayoutMethodForm } from "@/components/clipper/payout-method-form";
import { WithdrawButton } from "@/components/clipper/withdraw-button";
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
  // Read here rather than in the button so the server decides whose money this
  // is. The client is told only whether it matches, never trusted to say so.
  const [{ earnings, offline }, session] = await Promise.all([
    loadClipper(userId, sig),
    auth(),
  ]);

  const withdrawable = earnings?.withdrawable ?? 0;
  const awaiting = earnings?.awaiting_release ?? 0;
  /** Money already sent that no settled clip covers yet. 0 for most people. */
  const advance = earnings?.advance ?? 0;
  const hasPayout = Boolean(earnings?.payout_method);

  // What a single withdrawal can actually take. The transfer refuses an
  // over-ceiling amount outright rather than trimming it, so offering the
  // whole balance to anyone above the cap produced a button that could only
  // fail — which read as a frozen balance rather than a capped one.
  //
  // Falls back to the full figure when the bot hasn't got the fix yet, which
  // is the behaviour that was there before.
  const takeNow = earnings?.withdrawable_now ?? withdrawable;
  const capped = takeNow < withdrawable;

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

              {/* The headline is the whole balance because that is what is
                  theirs. This line is what today's transfer will carry, and
                  it only appears when the two differ — otherwise it would be
                  a caveat on a number nothing is capping. */}
              {capped ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Up to <span className="font-medium text-foreground">{dollars(takeNow)}</span>{" "}
                  per withdrawal — the rest stays in your balance for the next one.
                </p>
              ) : null}

              {withdrawable > 0 ? (
                <WithdrawButton
                  userId={userId}
                  sig={sig}
                  withdrawable={takeNow}
                  minimum={earnings?.payout_minimum ?? 12}
                  method={earnings?.payout_method ?? ""}
                  signedInAs={session?.user?.discordId ?? null}
                  feePercent={earnings?.payout_fee_percent ?? 0}
                  gasFromClipper={earnings?.payout_gas_from_clipper ?? false}
                />
              ) : awaiting > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing to withdraw yet — see below for what&apos;s on the way.
                </p>
              ) : (earnings?.running ?? 0) > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing to withdraw yet. Earnings become withdrawable once their campaign
                  finishes — see below.
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing to withdraw yet. Approved clips above the view floor build this up.
                </p>
              )}
            </div>

            {/* Editable here rather than "run /set-payout in Discord": a
                clipper who cannot set this cannot be paid at all, and sending
                them to another app to fix the one thing blocking their money
                is where most of them would stop. */}
            <div className="border-t border-border px-5 py-4 sm:px-7">
              <PayoutMethodForm
                userId={userId}
                sig={sig}
                method={earnings?.payout_method ?? ""}
                masked={earnings?.payout_address ?? ""}
                signedInAs={session?.user?.discordId ?? null}
              />
            </div>
          </div>

          {/* ── Deliberately outside the card above ──────────────────────
              These two used to sit in the same card as "Ready to withdraw",
              under one border, which made the card read as a single balance —
              so $330.61 on a live campaign and $177.01 waiting on release
              looked like money in hand when neither can be withdrawn. They are
              three separate states and the page now keeps them apart: what you
              can take today, and what isn't yours to take yet. */}
          <section className="mt-10 max-w-2xl">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Not available yet
            </h2>
            <ul className="mt-3 space-y-2">
              <li className="surface flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-card px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">On campaigns still running</p>
                  <p className="text-xs text-muted-foreground">
                    Moves with views, and isn&apos;t final until the campaign ends.
                  </p>
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  {dollars(earnings?.running ?? 0)}
                </span>
              </li>
              <li className="surface flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-card px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Finished, awaiting release</p>
                  <p className="text-xs text-muted-foreground">
                    Owed to you. Opens up once we&apos;ve checked the figures.
                  </p>
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  {dollars(awaiting)}
                </span>
              </li>
            </ul>
          </section>

          <section className="mt-10 max-w-2xl">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              History
            </h2>
            {/* "paid to you so far" was the wrong name for this number. It is
                the worth of clips that have settled and been paid — it does not
                include money sent ahead of settlement, so someone who had
                withdrawn early saw a figure several hundred dollars below what
                had actually reached their wallet, with nothing on the page
                accounting for the gap. The label now says what it measures, and
                the advance is shown beside it rather than silently missing. */}
            <div className="surface mt-3 grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card">
              <Stat value={dollars(earnings?.already_paid ?? 0)} label="settled and paid out" />
              <Stat value={formatNumber(earnings?.clips ?? 0)} label="clips submitted" />
            </div>
            {advance > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                A further <span className="font-mono text-foreground">{dollars(advance)}</span>{" "}
                has already reached you, withdrawn ahead of the clips that cover it. It comes
                off your balance as those clips settle, so it is never sent twice.
              </p>
            ) : null}
          </section>

          <div className="mt-8 max-w-2xl space-y-2 text-xs text-muted-foreground/80">
            <p>
              Money only leaves when you ask for it, and only to the address above — which can
              be changed with <code className="font-mono">/set-payout</code> in Discord and
              nowhere else. Check it before you withdraw: a USDT transfer can&apos;t be
              reversed.
            </p>
            <p>
              Minimum withdrawal is {dollars(earnings?.payout_minimum ?? 12)}.{" "}
              {earnings?.payout_fee_percent
                ? `A ${earnings.payout_fee_percent}% fee`
                : "Nothing"}
              {earnings?.payout_gas_from_clipper
                ? " and the network fee for the transfer come"
                : " comes"}{" "}
              out of the amount. If the network is expensive enough that it would take a large
              share of your payout, the transfer is refused rather than sent short — your
              balance stays put and you can withdraw when it&apos;s cheaper.
            </p>
            <p>
              You can also run <code className="font-mono">/withdraw</code> in Discord — it
              does exactly the same thing.
            </p>
          </div>
        </>
      )}
    </>
  );
}
