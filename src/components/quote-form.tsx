"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, Phone } from "lucide-react";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The front door, for a product whose median campaign is $900.
 *
 * Only a name and an email are required. Everything else is context that
 * makes the first reply useful, and asking for it as a requirement costs more
 * enquiries than the detail is worth.
 *
 * It used to ask for an artist, a release date and a link to the track, which
 * quietly told seven of the eight categories we sell to that this wasn't for
 * them — a gaming studio or a SaaS founder reads "label" in the placeholder
 * and closes the tab. The fields are the same questions asked in a way any
 * category can answer, plus an explicit category so the first reply can be
 * about their vertical rather than generic.
 *
 * ── Two modes, one form ─────────────────────────────────────────────────
 * "brief" is the original: tell us about it in writing, we reply with numbers.
 * "call" is for the people who were never going to fill that in — they want
 * fifteen minutes with a human, and until now the page had no way to say yes.
 *
 * It is deliberately the same component rather than a second form. A call
 * request is a lead with a preferred hour attached, it goes to the same place
 * through the same endpoint, and splitting it in two would mean two things to
 * keep in step every time a field changes. What differs is four fields and
 * the verbs, and that is all the branching below does.
 *
 * `mode` is also sent to the bot, because "book a call" and "send me a quote"
 * need different first replies and the embed has to say which one this was.
 */
export type QuoteMode = "brief" | "call";

const BUDGETS = ["Under $500", "$500 – $1,000", "$1,000 – $5,000", "$5,000+", "Not sure yet"];

const CATEGORIES = [
  "Music / label",
  "Gaming",
  "App",
  "Crypto / web3",
  "iGaming / casino",
  "Podcast",
  "Consumer brand",
  "Startup / SaaS",
  "Something else",
];

/**
 * When they'd like the call.
 *
 * Not a date picker and not a calendar embed. We don't publish a live
 * availability feed, so a picker would be offering slots we can't promise —
 * and the honest version of "when suits you" at this scale is a rough window
 * that a human confirms by reply. Four coarse answers is all the precision
 * that is actually being acted on.
 */
const WINDOWS = ["As soon as possible", "This week", "Next week", "No rush"];

export function QuoteForm({ mode = "brief" }: { mode?: QuoteMode }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const call = mode === "call";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), mode };
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
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-foreground">
          <Check className="h-5 w-5 text-background" />
        </span>
        <h2 className="display mt-5 text-2xl">
          {call ? "Call requested" : "Got it — thank you"}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {call
            ? "We'll come back with a couple of times that fit your window, usually within a few hours. If none of them work, say so and we'll find one that does."
            : "We'll come back to you within one working day, usually much sooner. If your release is close, say so in your reply and we'll prioritise it."}
        </p>
        {/* The moment the question actually gets asked. Someone who has just
            sent this is wondering what they've started, and until now the only
            answer was to wait for an email. */}
        <a
          href="/#after-launch"
          className="mt-5 inline-block text-sm font-medium text-primary-ink underline-offset-4 hover:underline"
        >
          What happens next →
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="surface relative rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Your name"
          name="name"
          required
          autoComplete="name"
          placeholder="Alex Rivera"
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          invalidMessage="That doesn't look like an email address yet."
        />
        <TextField label="Brand, artist or company" name="artist" placeholder="Optional" />
        {/* Explicit keys, and they matter. These two occupy the same slot, so
            without them React reconciles one into the other and keeps the DOM
            node — meaning a release date typed in brief mode would still be
            sitting in the box after switching to call, and would be submitted
            as `contact`. Different keys force a remount and an empty field. */}
        {call ? (
          // Where to actually reach them. An email address is how we reply;
          // it is not how a call happens, and asking for the handle here
          // saves a whole round trip that would otherwise say "what's your
          // Discord?" and wait a day for the answer.
          <TextField
            key="contact"
            label="Phone, Discord or Telegram"
            name="contact"
            placeholder="Optional — however you prefer to talk"
          />
        ) : (
          <TextField
            key="releaseDate"
            label="Launch or release date"
            name="releaseDate"
            placeholder="Optional — or 'already live'"
          />
        )}
      </div>

      {/* The two questions that were dropdowns. See ChoiceChips for why. */}
      <div className="mt-6 space-y-6">
        <ChoiceChips
          name="category"
          label="What are you promoting?"
          options={CATEGORIES}
          hint="Pick the closest"
        />

        <ChoiceChips
          name="budget"
          label="Rough budget"
          options={BUDGETS}
          hint="Only so the first reply is realistic"
        />

        {call && (
          <ChoiceChips
            name="callWindow"
            label="When suits you?"
            options={WINDOWS}
            defaultValue="This week"
          />
        )}
      </div>

      {!call && (
        <div className="mt-6">
          <TextField
            label="Link to what you're promoting"
            name="link"
            placeholder="Optional — a track, trailer, app store page, site"
          />
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="notes" className="text-sm font-medium">
          {call ? "What do you want to cover?" : "Anything else"}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={call ? 3 : 4}
          placeholder={
            call
              ? "Optional — anything you'd like us to have looked at before we speak."
              : "What you're promoting, what you want it to do, anything we should know."
          }
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-[hsl(var(--border-strong))] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Off-screen rather than display:none — some bots skip hidden fields.
          The form is `relative` so this positions against the form itself;
          previously it resolved against whatever was positioned further up and
          could land somewhere the page had to scroll to reach. */}
      <div className="absolute left-[-9999px] top-0" aria-hidden>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-7 h-12 w-full" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Loader2 className="animate-spin" />
            {call ? "Requesting" : "Sending"}
          </>
        ) : (
          <>
            {call ? "Request a call" : "Send it"}
            {call ? <Phone /> : <ArrowRight />}
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {call
          ? "No card, no obligation · 15 minutes · We'll send times to fit your window"
          : "No obligation · We reply within one working day"}
      </p>
    </form>
  );
}

/**
 * A text input that says whether it's happy.
 *
 * Validity comes from the browser via `checkValidity()`, not from a regex
 * written here. Email in particular is a shape nobody should be reimplementing
 * on a marketing form, and the input already knows: `type="email"` is the
 * rule, and this only reads the verdict.
 *
 * The complaint waits for blur. Marking a half-typed address invalid on the
 * second keystroke is how a form feels hostile — so it stays quiet until the
 * field is left, and from then on it re-checks as they type, which is what
 * makes the error disappear the moment it's actually fixed.
 */
function TextField({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
  invalidMessage,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  invalidMessage?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"empty" | "ok" | "bad">("empty");
  const [touched, setTouched] = useState(false);

  const check = (el: HTMLInputElement) => {
    if (!el.value.trim()) return setStatus("empty");
    setStatus(el.checkValidity() ? "ok" : "bad");
  };

  const showBad = touched && status === "bad";
  const showOk = status === "ok";

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-muted-foreground">*</span>}
      </label>
      <div className="relative mt-2">
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={showBad || undefined}
          aria-describedby={showBad && invalidMessage ? `${name}-error` : undefined}
          onBlur={(e) => {
            setTouched(true);
            check(e.currentTarget);
          }}
          onChange={(e) => check(e.currentTarget)}
          className={cn(
            "h-11 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
            showBad
              ? "border-destructive focus-visible:border-destructive"
              : "border-border hover:border-[hsl(var(--border-strong))] focus-visible:border-foreground",
          )}
        />
        {/* A tick, once there's something valid in there. Small, and only on
            the way up — there is no matching cross, because the border and
            the line underneath already carry the bad case and three signals
            for one error is nagging. */}
        {showOk && (
          <Check
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </div>
      {showBad && invalidMessage && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-destructive">
          {invalidMessage}
        </p>
      )}
    </div>
  );
}
