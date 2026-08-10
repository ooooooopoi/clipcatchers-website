"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ClipActions({
  sig,
  clipId,
  status,
}: {
  sig: string;
  clipId: number | string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [current, setCurrent] = useState(status);

  async function set(next: "approved" | "rejected") {
    setBusy(next);
    const res = await fetch(`/api/team/${sig}/clips/${clipId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't update that clip.");
      return;
    }
    setCurrent(next);
    toast.success(`Clip #${clipId} ${next}`);
    // The bot re-syncs on change; refresh once it has had a moment.
    setTimeout(() => router.refresh(), 2500);
  }

  if (current === "approved") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground"
        loading={busy === "rejected"}
        onClick={() => set("rejected")}
      >
        <X />
        Reject
      </Button>
    );
  }

  if (current === "rejected") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground"
        loading={busy === "approved"}
        onClick={() => set("approved")}
      >
        <Check />
        Approve
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        className="h-7 text-xs"
        loading={busy === "approved"}
        onClick={() => set("approved")}
      >
        <Check />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        loading={busy === "rejected"}
        onClick={() => set("rejected")}
      >
        <X />
        Reject
      </Button>
    </div>
  );
}
