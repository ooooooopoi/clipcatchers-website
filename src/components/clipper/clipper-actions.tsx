"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * The take-down control on one of a clipper's own clips.
 *
 * Taking a clip down is a status change, never a delete — the row and its
 * reading history are what prove what a clip did and when. That is enforced in
 * the bot; this only offers the action where it can succeed.
 *
 * ── Why this says "Take down" and the bot says "withdrawn" ───────────────
 * The page above now has a Payout section reading "ready to withdraw", and
 * /withdraw in Discord is how a clipper is actually paid. A button labelled
 * "Withdraw" sitting next to a clip therefore reads as "pay me for this one",
 * and the clipper who clicks it expecting money instead stops that clip
 * earning for good. The money sense is the bot's command name and can't move,
 * so this one does. The status and the API route keep the old word — they're
 * the bot's vocabulary, not the clipper's.
 */
export function ClipperActions({
  userId,
  sig,
  clipId,
  status,
  paid,
  locked,
}: {
  userId: string;
  sig: string;
  clipId: number;
  status: string;
  paid: boolean;
  locked: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [gone, setGone] = useState(false);
  const router = useRouter();

  // The bot refuses all three of these, so the button would only ever produce
  // an error. Saying why in place beats a control that exists to fail.
  const blocked = paid
    ? "Paid out"
    : locked
      ? "Locked"
      : status === "withdrawn" || gone
        ? "Taken down"
        : null;

  if (blocked) {
    return <span className="shrink-0 text-xs text-muted-foreground">{blocked}</span>;
  }

  async function takeDown() {
    const res = await fetch(`/api/clipper/${userId}/${sig}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(body.error ?? "Couldn't take that clip down.");
      return;
    }

    // Marked locally as well as refreshed: the refresh re-reads from the bot,
    // and the mirror it pushes is not always back before this returns.
    setGone(true);
    toast.success("Clip taken down. It stops earning from now.");
    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => void takeDown()}
      className="shrink-0"
      title="Stops this clip earning. This does not pay you out."
    >
      {pending ? "Taking down…" : "Take down"}
    </Button>
  );
}
