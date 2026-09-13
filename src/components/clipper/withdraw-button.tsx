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
}: {
  userId: string;
  sig: string;
  withdrawable: number;
  minimum: number;
  method: string;
  /** The signed-in Discord id, or null. Money needs more than the link. */
  signedInAs: string | null;
}) {
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    let body: Result = {};
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/payout`, { method: "POST" });
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

  return (
    <div className="mt-4">
      <Button type="button" onClick={() => void withdraw()} loading={busy} disabled={!enough}>
        {busy ? "Sending…" : `Withdraw $${withdrawable.toFixed(2)}`}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        {enough
          ? "Sent as USDT to the address on file. Network fees come out of the amount."
          : `Minimum withdrawal is $${minimum.toFixed(0)}. Below that the transfer fee costs more than the payment is worth.`}
      </p>
    </div>
  );
}
