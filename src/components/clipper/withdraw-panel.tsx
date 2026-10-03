/**
 * Where the money goes and the button that sends it: the Earnings page's
 * Withdraw card, and the Withdraw panel a phone opens from the top of any page
 * (MobileActions). One component, so the two can't drift apart on the one
 * action that moves money.
 */
import { PayoutMethodForm } from "@/components/clipper/payout-method-form";
import { WithdrawButton } from "@/components/clipper/withdraw-button";
import { dollars } from "@/lib/clipper-format";

/** Why "Ready to withdraw" says $0.00, said under it. */
export function zeroBalanceNote(awaitingRelease: number, running: number) {
  return awaitingRelease > 0
    ? "Opens up once the finished campaign's figures are checked."
    : running > 0
      ? "Earnings open up once their campaign finishes."
      : "Approved clips above the view floor build this up.";
}

export function WithdrawPanel({
  userId,
  sig,
  signedInAs,
  withdrawable,
  takeNow,
  minimum,
  method,
  masked,
  feePercent,
  gasFromClipper,
  anchor = false,
}: {
  userId: string;
  sig: string;
  signedInAs: string | null;
  withdrawable: number;
  /** What a single withdrawal can take: the transfer refuses an over-ceiling amount rather than trimming it. */
  takeNow: number;
  minimum: number;
  method: string;
  masked: string;
  feePercent: number;
  gasFromClipper: boolean;
  /** Carry the #payout-method target openPayoutForm() scrolls to. The page's copy only. */
  anchor?: boolean;
}) {
  const hasPayout = Boolean(method);
  const capped = takeNow < withdrawable;

  return (
    <>
      {/* openPayoutForm() scrolls here. */}
      <div id={anchor ? "payout-method" : undefined} className="mt-5 scroll-mt-24">
        <PayoutMethodForm
          userId={userId}
          sig={sig}
          method={method}
          masked={masked}
          signedInAs={signedInAs}
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
          minimum={minimum}
          method={method}
          signedInAs={signedInAs}
          feePercent={feePercent}
          gasFromClipper={gasFromClipper}
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
    </>
  );
}
