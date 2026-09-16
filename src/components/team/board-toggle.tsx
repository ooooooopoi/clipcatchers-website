"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Loader2, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Move one campaign between the Ads and Campaigns boards.
 *
 * ── Why this is a control and not a link to a form ───────────────────────
 * Which board a campaign sits on is the single field most likely to be wrong
 * right after it is created, and the only way to fix it was /campaign-edit in
 * Discord. Something you change by noticing it is wrong should be changeable
 * where you noticed.
 *
 * It states the board rather than the verb. "Ads" / "Organic" is what the
 * campaign *is*; a button reading "Move to Ads" would sit in a table where
 * the column beside it says something else, and the two would be read
 * together as a contradiction.
 */
export function BoardToggle({
  sig,
  id,
  paidAds,
}: {
  sig: string;
  id: number;
  paidAds: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic, because the row is server-rendered and a refresh round-trip
  // would leave the control showing the old board for a second — long enough
  // to be clicked twice.
  const [value, setValue] = useState(paidAds);

  async function move(next: boolean) {
    if (next === value || saving) return;
    setError(null);
    setSaving(true);
    const previous = value;
    setValue(next);

    try {
      const res = await fetch(`/api/team/${sig}/campaigns/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_ads: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Put it back. A control that stays switched after the write failed
        // is the reason someone believes a campaign is on a board it isn't.
        setValue(previous);
        setError(body.error ?? "Couldn't move it.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setValue(previous);
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || pending;

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        role="group"
        aria-label="Which board this campaign is on"
        className={cn(
          "inline-flex overflow-hidden rounded-lg border border-border",
          busy && "opacity-60",
        )}
      >
        {[
          { on: false, label: "Organic", Icon: Megaphone },
          { on: true, label: "Ads", Icon: BadgeDollarSign },
        ].map(({ on, label, Icon }) => (
          <button
            key={label}
            type="button"
            disabled={busy}
            aria-pressed={value === on}
            onClick={() => move(on)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
              value === on
                ? "bg-foreground font-medium text-background"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {busy && value === on ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Icon className="h-3 w-3" aria-hidden="true" />
            )}
            {label}
          </button>
        ))}
      </div>
      {error ? (
        <span className="max-w-[220px] text-xs leading-snug text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
