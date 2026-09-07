"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * The withdraw control on one of a clipper's own clips.
 *
 * Withdrawing is a status change, never a delete — the row and its reading
 * history are what prove what a clip did and when. That is enforced in the
 * bot; this only offers the action where it can succeed.
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
        ? "Withdrawn"
        : null;

  if (blocked) {
    return <span className="shrink-0 text-xs text-muted-foreground">{blocked}</span>;
  }

  async function withdraw() {
    const res = await fetch(`/api/clipper/${userId}/${sig}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(body.error ?? "Couldn't withdraw that clip.");
      return;
    }

    // Marked locally as well as refreshed: the refresh re-reads from the bot,
    // and the mirror it pushes is not always back before this returns.
    setGone(true);
    toast.success("Clip withdrawn. It stops earning from now.");
    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => void withdraw()}
      className="shrink-0"
    >
      {pending ? "Withdrawing…" : "Withdraw"}
    </Button>
  );
}
