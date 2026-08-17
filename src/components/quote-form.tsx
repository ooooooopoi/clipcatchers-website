"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The front door, for a product whose median campaign is $900.
 *
 * Only a name and an email are required. Everything else is context that
 * makes the first reply useful, and asking for it as a requirement costs more
 * enquiries than the detail is worth.
 */
const BUDGETS = ["Under $500", "$500 – $1,000", "$1,000 – $5,000", "$5,000+", "Not sure yet"];

export function QuoteForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("Couldn't reach us just now. Please try again in a moment.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="surface rounded-2xl border border-primary/25 bg-card p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-5 w-5 text-primary-ink" />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">Got it — thank you</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We&apos;ll come back to you within one working day, usually much sooner. If your
          release is close, say so in your reply and we&apos;ll prioritise it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required placeholder="Alex Rivera" />
        <Field label="Email" name="email" type="email" required placeholder="you@label.com" />
        <Field label="Artist or label" name="artist" placeholder="Optional" />
        <Field label="Release date" name="releaseDate" placeholder="Optional — or 'already out'" />
      </div>

      <div className="mt-4">
        <label htmlFor="budget" className="text-sm font-medium">
          Rough budget
        </label>
        <select
          id="budget"
          name="budget"
          defaultValue=""
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Prefer not to say</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Field label="Link to the track or video" name="link" placeholder="Optional" />
      </div>

      <div className="mt-4">
        <label htmlFor="notes" className="text-sm font-medium">
          Anything else
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="What you're releasing, what you want it to do, anything we should know."
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Off-screen rather than display:none — some bots skip hidden fields. */}
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Loader2 className="animate-spin" />
            Sending
          </>
        ) : (
          <>
            Send it
            <ArrowRight />
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        No obligation · We reply within one working day
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-muted-foreground">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
