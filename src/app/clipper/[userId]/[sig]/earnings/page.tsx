import type { Metadata } from "next";
import { auth } from "@/auth";
import { BotOffline, PageHeading, Stat } from "@/components/clipper/chrome";
import { PayoutMethodForm } from "@/components/clipper/payout-method-form";
import { WithdrawButton } from "@/components/clipper/withdraw-button";
import { dollars, groupByCampaign, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

/**
 * The one money page.
 *
 * Earnings and Payouts used to be separate pages, which meant the place you
 * watched money accrue and the place you took it out were two nav items — and
 * the second was where people had to be sent ("see Payouts") from the first.
 * The split existed for the code's convenience, not the clipper's: it is one
 * subject, and now it is one page. /payouts redirects here, because the old
 * link is in DMs and notification panels that can't be edited.
 */
export default async function EarningsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  // Session read here rather than in the button so the server decides whose
  // money this is. The client is told only whether it matches.
  const [{ earnings, offline }, session] = await Promise.all([
    loadClipper(userId, sig),
    auth(),
  ]);

  const clips = earnings?.breakdown ?? [];
  const groups = groupByCampaign(clips);

  const withdrawable = earnings?.withdrawable ?? 0;
  const hasPayout = Boolean(earnings?.payout_method);
  // What a single withdrawal can actually take — the transfer refuses an
  // over-ceiling amount outright rather than trimming it.
  const takeNow = earnings?.withdrawable_now ?? withdrawable;
  const capped = takeNow < withdrawable;

  return (
    <>
      <PageHeading
        title="Earnings"
        subtitle="What you've made, and where it goes."
      />

      {offline ? (
        <BotOffline />
      ) : (
        <>
          {/* ── The wallet ─────────────────────────────────────────────────
              Two cards: the balance is a fact, withdrawing is an action.
              Joining them under one border made the number stop being the
              headline; the gap does the dividing instead. */}
          <div className="mt-8 max-w-2xl space-y-4">
            <div className="surface rounded-3xl bg-card p-7 sm:p-9">
              <p className="text-base text-muted-foreground">Ready to withdraw</p>
              <p className="mt-3 font-mono text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                {dollars(withdrawable)}
              </p>
              {withdrawable === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {(earnings?.awaiting_release ?? 0) > 0
                    ? "Opens up once the finished campaign's figures are checked."
                    : (earnings?.running ?? 0) > 0
                      ? "Earnings open up once their campaign finishes."
                      : "Approved clips above the view floor build this up."}
                </p>
              ) : null}
            </div>

            <div className="surface rounded-3xl bg-card p-7 sm:p-9">
              <p className="text-base text-muted-foreground">Withdraw</p>

              {/* openPayoutForm() scrolls here. */}
              <div id="payout-method" className="mt-5 scroll-mt-24">
                <PayoutMethodForm
                  userId={userId}
                  sig={sig}
                  method={earnings?.payout_method ?? ""}
                  masked={earnings?.payout_address ?? ""}
                  signedInAs={session?.user?.discordId ?? null}
                />
              </div>

              {/* Said outright rather than inferred from a blank field — not
                  having one is the single thing that stops money reaching
                  someone. */}
              <p className="mt-5 text-sm text-muted-foreground">
                This payout method is currently:{" "}
                {hasPayout ? (
                  <span className="text-success">ready to receive</span>
                ) : (
                  <span className="text-warning">not set</span>
                )}
              </p>

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
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 h-14 w-full cursor-not-allowed rounded-2xl border border-border text-base font-semibold opacity-40"
                >
                  Withdraw
                </button>
              )}

              {capped ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Up to <span className="font-medium text-foreground">{dollars(takeNow)}</span>{" "}
                  per withdrawal — the rest stays for the next one.
                </p>
              ) : null}
            </div>
          </div>

          {/* The balance in four buckets, the same ones 💰 Balance shows in
              Discord. Total earned is the sum of the other three plus Ready to
              withdraw above, so the page reconciles on sight with no per-clip
              working. Clippers see money as a balance only (owner, 2026-10-13):
              clips settle one at a time behind the scenes, and a rounding gap
              once left a covered clip reading as unpaid. */}
          <div className="surface mt-10 grid max-w-2xl grid-cols-2 divide-border rounded-2xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
            <Stat
              value={dollars(
                (earnings?.total_sent ?? 0) +
                  withdrawable +
                  (earnings?.awaiting_release ?? 0) +
                  (earnings?.running ?? 0),
              )}
              label="total earned"
            />
            <Stat value={dollars(earnings?.total_sent ?? 0)} label="sent to you" />
            <Stat
              value={dollars(earnings?.awaiting_release ?? 0)}
              label="waiting for release"
              hint="Finished campaigns still being checked."
            />
            <Stat
              value={dollars(earnings?.running ?? 0)}
              label="still running"
              hint="Moves with views. Not owed until the campaign ends."
            />
          </div>

          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              By campaign
            </h2>

            {groups.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Nothing yet. Submit a clip to a live campaign and it shows up here.
              </p>
            ) : (
              // Each row shows what the campaign's clips earned, never what is
              // left to pay; money is reported as a balance at the top of the
              // page (owner, 2026-10-13).
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

                    <span
                      className={`font-mono text-sm ${
                        group.active ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {dollars(group.earned)}{" "}
                      <span className="font-sans text-xs">{group.active ? "running" : "earned"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
