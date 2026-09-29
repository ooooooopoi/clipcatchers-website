"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/quote-form";
import { bookingUrl } from "@/lib/booking";
import type { QuotePrefill } from "@/lib/quote-options";
import { cn } from "@/lib/utils";

/**
 * Get started: a name and a brand, then the calendar (2026-09-30, the owner's
 * flow). "Get started" leads here, and here leads to a 15-minute call.
 *
 * The two answers ride into Calendly on its prefill parameters, so nobody types
 * them twice: `name` fills its name field, and `a1` answers the event's first
 * question, "What are you promoting?". A budget carried by a prefill link
 * (`?budget=1500`) answers the second, "Rough budget?", as `a2`. Checked
 * against the event's public definition: New Meeting, 15 minutes, three
 * required questions in that order. If the questions are reordered in
 * Calendly, reorder a1/a2 here.
 *
 * Nothing is sent to us from this step. The lead pipeline (/api/quote and the
 * bot's /api/lead) requires an email, which Calendly asks for itself, and the
 * booking arrives there with everything on it.
 *
 * Without a scheduler configured (NEXT_PUBLIC_BOOKING_URL unset, as in local
 * development), this falls back to the request-a-time form, which does send a
 * lead, so the button never leads nowhere.
 */
export function GetStartedForm({ prefill }: { prefill?: QuotePrefill }) {
  const booking = bookingUrl();
  const [leaving, setLeaving] = useState(false);

  if (!booking) return <QuoteForm mode="call" prefill={prefill} />;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const brand = String(data.get("brand") ?? "").trim();
    if (!name || !brand) return;

    const url = new URL(booking);
    url.searchParams.set("name", name);
    url.searchParams.set("a1", brand);
    if (prefill?.budget) url.searchParams.set("a2", prefill.budget);
    setLeaving(true);
    window.location.assign(url.toString());
  };

  return (
    <form
      onSubmit={onSubmit}
      className="surface relative rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Your name"
          name="name"
          autoComplete="name"
          placeholder="Alex Rivera"
          maxLength={120}
        />
        <Field
          label="Brand"
          name="brand"
          autoComplete="organization"
          placeholder="What you're promoting"
          defaultValue={prefill?.artist}
          maxLength={160}
        />
      </div>

      <Button type="submit" size="lg" className="mt-6 h-12 w-full" disabled={leaving}>
        {leaving ? <Loader2 className="animate-spin" /> : null}
        {leaving ? "Opening the calendar" : "Pick a time"}
        {leaving ? null : <ArrowRight />}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  autoComplete,
  placeholder,
  defaultValue,
  maxLength,
}: {
  label: string;
  name: string;
  autoComplete: string;
  placeholder: string;
  defaultValue?: string;
  maxLength: number;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        <span className="ml-1 text-muted-foreground">*</span>
      </label>
      <input
        id={name}
        name={name}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength}
        className={cn(
          "mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors",
          "placeholder:text-muted-foreground hover:border-[hsl(var(--border-strong))] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
    </div>
  );
}
