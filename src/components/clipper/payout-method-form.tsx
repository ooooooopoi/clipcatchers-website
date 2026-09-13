"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Where a clipper gets paid.
 *
 * Starts collapsed to what is already set, because most visits are to check it
 * rather than change it — and an address field sitting open and editable next
 * to a withdraw button invites an accidental edit of the one value that decides
 * where money lands.
 *
 * Needs a Discord session to save. Changing a payout address is the single
 * action that could redirect somebody else's money: every other route is safe
 * against a forwarded link precisely because funds can only go to the address
 * registered here.
 */
export function PayoutMethodForm({
  userId,
  sig,
  method,
  masked,
  signedInAs,
}: {
  userId: string;
  sig: string;
  method: string;
  masked: string;
  signedInAs: string | null;
}) {
  const isOwner = signedInAs === userId;
  const [editing, setEditing] = useState(!method);
  const [choice, setChoice] = useState(method || "USDT");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/payout-method`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: choice, address }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Couldn't save that.");
        return;
      }
      toast.success(`Payout method saved — ${body.method} · ${body.address}`);
      setAddress("");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid to</p>
          <p className="mt-1 font-mono text-sm">
            {method} · {masked}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Change
        </Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">
          {method
            ? "Signing in confirms it's you before the address money goes to can change."
            : "You'll need a payout method before you can withdraw."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() =>
            signIn("discord", { callbackUrl: `/clipper/${userId}/${sig}/payouts` })
          }
        >
          Sign in with Discord to set it
        </Button>
      </div>
    );
  }

  const isUsdt = choice === "USDT";

  return (
    <div className="space-y-4">
      <div>
        <Label>How do you want to be paid?</Label>
        {/* Two buttons rather than a select: there are exactly two, and the
            choice changes what the field below means. */}
        <div className="mt-2 flex gap-2">
          {["USDT", "PayPal"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setChoice(m)}
              className={`rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                choice === m
                  ? "border-primary bg-primary/10 font-medium text-primary-ink"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {choice === m && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
              {m === "USDT" ? "USDT (crypto)" : "PayPal"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payout-address">
          {isUsdt ? "Your USDT address" : "Your PayPal email"}
        </Label>
        <Input
          id="payout-address"
          value={address}
          spellCheck={false}
          autoComplete="off"
          placeholder={isUsdt ? "0x…" : "you@example.com"}
          onChange={(e) => setAddress(e.target.value)}
          className={isUsdt ? "font-mono" : ""}
        />
        {/* Stated before they paste, not after it fails. A wrong-network
            address is accepted by the chain and the money is simply gone. */}
        <p className="text-xs text-muted-foreground">
          {isUsdt
            ? "Must be an Ethereum (ERC-20) address — starts with 0x. Funds sent to a wrong-network address can't be recovered."
            : "The email on your PayPal account. Payments to an address you don't control can't be recovered."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void save()} loading={busy} disabled={!address.trim()}>
          Save
        </Button>
        {method && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(false);
              setAddress("");
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
