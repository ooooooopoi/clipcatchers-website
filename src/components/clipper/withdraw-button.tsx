"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Result = {
  ok?: boolean;
  code?: string;
  settled?: number;
  minimum?: number;
  amount?: number;
  fee?: number;
  gross?: number;
  tx_hash?: string;
  settled_clips?: number;
  awaiting?: number;
  reason?: string;
};

/**
 * Withdraw what's settled, to the address registered in Discord.
 *
 * ── Why it can't be pressed twice ────────────────────────────────────────
 * A double-press is a double payment, and a USDT transfer does not come back.
 * `busy` is set before the request leaves and is never cleared on the success
 * path — the component waits for the refresh to re-render it with a zero
 * balance instead. Clearing it would put a live button back under the cursor
 * during the moment the balance is still being re-read.
 *
 * ── Why the refusals are worded here ─────────────────────────────────────
 * The bot answers a refusal with 200 and a code, not an error: "below the
 * minimum" and "nothing released yet" are answers, not failures. Each one says
 * what would change it, because a balance that won't move and won't say why is
 * how a payout system loses people.
 */
export function WithdrawButton({
  userId,
  sig,
  withdrawable,
  minimum,
  method,
  signedInAs,
  feePercent,
  gasFromClipper,
}: {
  userId: string;
  sig: string;
  withdrawable: number;
  minimum: number;
  method: string;
  /** The signed-in Discord id, or null. Money needs more than the link. */
  signedInAs: string | null;
  feePercent: number;
  gasFromClipper: boolean;
}) {
  const [busy, setBusy] = useState(false);
  // Blank is "all of it". Defaulting the field to the full balance would make
  // the common case look like a decision, and a half-edited number is the kind
  // of mistake that cannot be undone once sent.
  const [amount, setAmount] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const isOwner = signedInAs === userId;
  const enough = withdrawable >= minimum;

  if (!method) {
    return (
      <p className="mt-4 text-sm text-warning">
        Set a payout method with <code className="font-mono">/set-payout</code> in Discord
        before withdrawing.
      </p>
    );
  }

  // PayPal isn't an API the bot holds keys to — it's a file an admin uploads.
  // Saying so beats a button that can only ever refuse.
  if (method.toLowerCase() === "paypal") {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        PayPal payouts go out in a batch an admin sends, so there&apos;s nothing to press —
        you&apos;re already in the next one. Switch to USDT with{" "}
        <code className="font-mono">/set-payout</code> to withdraw on demand.
      </p>
    );
  }

  if (!isOwner) {
    return (
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("discord", { callbackUrl: `/clipper/${userId}/${sig}/payouts` })}
        >
          Sign in with Discord to withdraw
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          {signedInAs
            ? "You're signed in as a different account."
            : "Viewing your balance only needs this link. Moving money needs your Discord account."}
        </p>
      </div>
    );
  }

  async function withdraw() {
    // Blank means everything, which is the common case and the default. A
    // typed figure is sent exactly — the bot refuses anything above the
    // balance or below the minimum rather than rounding either way.
    const wanted = amount.trim();
    if (wanted) {
      const asked = Number(wanted);
      if (!Number.isFinite(asked) || asked <= 0) {
        toast.error("Enter an amount, or leave it blank to withdraw everything.");
        return;
      }
      if (asked > withdrawable) {
        toast.error(
          `You have $${withdrawable.toFixed(2)} available — that's more than you can take.`,
        );
        return;
      }
      if (asked < minimum) {
        toast.error(`The minimum withdrawal is $${minimum.toFixed(0)}.`);
        return;
      }
    }

    setBusy(true);
    let body: Result = {};
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wanted ? { amount: Number(wanted) } : {}),
      });
      body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.reason ?? "Couldn't withdraw right now. Your balance is untouched.");
        setBusy(false);
        return;
      }
    } catch {
      toast.error("Couldn't reach the payout service. Your balance is untouched.");
      setBusy(false);
      return;
    }

    if (body.ok) {
      const fee = body.fee ? ` (fee $${body.fee.toFixed(2)})` : "";
      toast.success(
        `Sent $${(body.amount ?? 0).toFixed(2)} USDT${fee}. ${body.settled_clips ?? 0} clip(s) settled.`,
      );
      // Deliberately stays busy: the refresh re-renders this with a zero
      // balance, which is what should replace the button.
      startTransition(() => router.refresh());
      return;
    }

    setBusy(false);
    const messages: Record<string, string> = {
      below_minimum: `You have $${(body.settled ?? 0).toFixed(2)}. The minimum is $${(
        body.minimum ?? minimum
      ).toFixed(0)} — below that the transfer fee costs more than the payment. It keeps growing.`,
      awaiting_release: `Your $${(body.awaiting ?? 0).toFixed(
        2,
      )} isn't released yet. It opens once the campaign finishes and the figures are checked.`,
      nothing: "Nothing settled to withdraw yet.",
      no_method: "No payout method set. Run /set-payout in Discord.",
      paypal: "PayPal payouts go in an admin batch — you're already in the next one.",
      not_configured: `Instant withdrawal isn't switched on yet (${body.reason ?? "not configured"}). Your balance is safe.`,
      blocked: `Couldn't withdraw: ${body.reason ?? "it can't be sent right now"}. Your balance is untouched.`,
      send_failed: `The transfer didn't go through: ${body.reason ?? "unknown error"}. Nothing was deducted.`,
    };
    toast.error(messages[body.code ?? ""] ?? "Couldn't withdraw. Your balance is untouched.");
    startTransition(() => router.refresh());
  }

  // What comes off, spelled out before they press rather than discovered in
  // the confirmation. The balance is the gross — a button that says $12 and
  // delivers $8.51 is the "number the recipient will reasonably think is
  // wrong" that the sending code refuses to produce.
  const deductions = [
    feePercent > 0 ? `a ${feePercent}% fee` : null,
    gasFromClipper ? "the network fee for the transfer" : null,
  ].filter(Boolean);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder={withdrawable.toFixed(2)}
            aria-label="Amount to withdraw"
            disabled={!enough || busy}
            className="h-10 w-32 rounded-lg border border-border bg-background pl-6 pr-3 font-mono text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
          />
        </div>
        <Button type="button" onClick={() => void withdraw()} loading={busy} disabled={!enough}>
          {busy ? "Sending…" : amount.trim() ? `Withdraw $${amount.trim()}` : "Withdraw it all"}
        </Button>
      </div>
      <p className="mt-2 max-w-md text-xs text-muted-foreground">
        {!enough
          ? `Minimum withdrawal is $${minimum.toFixed(0)}. Below that the transfer fee costs more than the payment is worth, so it stays here and keeps growing.`
          : `Leave the amount blank to take all $${withdrawable.toFixed(
              2,
            )}, or type any figure from $${minimum.toFixed(0)} up. ${
              deductions.length
                ? `${deductions.join(" and ")} ${
                    deductions.length > 1 ? "come" : "comes"
                  } out of it, so you'll receive slightly less — the exact figure is in the confirmation.`
                : "Sent as USDT to the address on file."
            }`}
      </p>
    </div>
  );
}
