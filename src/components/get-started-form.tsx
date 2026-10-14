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
 * The answers ride into Calendly on its prefill parameters, so nobody types
 * them twice: `name` fills its name field, and `a1` answers the event's first
 * question. The event (calendly.com/sitashahi268/30min, since 2026-10-14) has
 * ONE question, optional free text: "Please share anything that will help
 * prepare for our meeting." So the brand and any budget carried by a prefill
 * link (`?budget=1500`) go into that one answer together; a separate `a2`
 * would be silently dropped, because Calendly ignores answers to questions an
 * event doesn't have. Checked against the event's public definition. If the
 * event gains questions, map them here.
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
    const notes = [`Promoting: ${brand}`];
    if (prefill?.budget) notes.push(`Rough budget: ${prefill.budget}`);
    url.searchParams.set("a1", notes.join(" · "));
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
