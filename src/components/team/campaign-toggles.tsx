"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  CircleOff,
  Loader2,
  Megaphone,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Flip one boolean on one campaign, from the row where it's read.
 *
 * ── Why these are controls and not links to a form ───────────────────────
 * The board and the status are the two fields most likely to be wrong right
 * after a campaign is created or has served its budget, and fixing either used
 * to mean the detail page's editor or /campaign-edit in Discord. Something you
 * change by noticing it is wrong should be changeable where you noticed.
 *
 * They state what the campaign *is* rather than the verb. A button reading
 * "Move to Ads" would sit in a table where the column beside it says something
 * else, and the two would be read together as a contradiction.
 *
 * Optimistic, because the row is server-rendered and a refresh round-trip
 * would leave the control showing the old value for a second — long enough to
 * be clicked twice. A failed write puts the control back and says why: a
 * control that stays switched after the write failed is the reason someone
 * believes a campaign is on a board it isn't.
 */
function FlagToggle({
  sig,
  id,
  field,
  value: initialValue,
  options,
  ariaLabel,
}: {
  sig: string;
  id: number;
  /** The patch key the bot understands. */
  field: "paid_ads" | "active";
  value: boolean;
  options: [
    { on: false; label: string; Icon: LucideIcon },
    { on: true; label: string; Icon: LucideIcon },
  ];
  ariaLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(initialValue);

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
        body: JSON.stringify({ [field]: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setValue(previous);
        setError(body.error ?? "Couldn't change it.");
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
        aria-label={ariaLabel}
        className={cn(
          "inline-flex overflow-hidden rounded-lg border border-border",
          busy && "opacity-60",
        )}
      >
        {options.map(({ on, label, Icon }) => (
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

/** Move one campaign between the Ads and Campaigns boards. */
export function BoardToggle({
  sig,
  id,
  paidAds,
}: {
  sig: string;
  id: number;
  paidAds: boolean;
}) {
  return (
    <FlagToggle
      sig={sig}
      id={id}
      field="paid_ads"
      value={paidAds}
      ariaLabel="Which board this campaign is on"
      options={[
        { on: false, label: "Organic", Icon: Megaphone },
        { on: true, label: "Ads", Icon: BadgeDollarSign },
      ]}
    />
  );
}

/**
 * Open or close one campaign.
 *
 * Closing is the most time-sensitive edit there is — a campaign that has done
 * its job keeps taking submissions until someone turns it off — and it used to
 * live at the bottom of the detail page's editor. Safe to offer in one click
 * because the same control reverses it, and clips already submitted keep
 * earning until the close audit runs either way.
 */
export function StatusToggle({
  sig,
  id,
  active,
}: {
  sig: string;
  id: number;
  active: boolean;
}) {
  return (
    <FlagToggle
      sig={sig}
      id={id}
      field="active"
      value={active}
      ariaLabel="Whether this campaign takes submissions"
      options={[
        { on: false, label: "Closed", Icon: CircleOff },
        { on: true, label: "Live", Icon: Radio },
      ]}
    />
  );
}
