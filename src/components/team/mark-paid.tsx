"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkPaid({
  sig,
  userId,
  campaignId,
  amount,
  label,
}: {
  sig: string;
  userId: number;
  campaignId?: number | null;
  amount: number;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    // Paying is irreversible from here, so make the amount explicit rather
    // than letting a stray click settle someone's balance.
    const money = amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
    if (!window.confirm(`Mark ${money} as paid to ${label}? This can't be undone here.`)) return;

    setBusy(true);
    const res = await fetch(`/api/team/${sig}/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, campaignId: campaignId ?? null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't mark that paid.");
      return;
    }
    setDone(true);
    toast.success(`Marked ${data.clips_marked} clip(s) paid — $${Number(data.amount).toFixed(2)}`);
    setTimeout(() => router.refresh(), 1500);
  }

  if (done) {
    return <span className="text-xs text-muted-foreground">paid ✓</span>;
  }

  return (
    <Button size="sm" variant="outline" className="h-7 text-xs" loading={busy} onClick={run}>
      <Check />
      Mark paid
    </Button>
  );
}
