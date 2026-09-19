"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Check, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STANDARD_CLIPPER_RATE, STANDARD_CLIPPER_RATE_LABEL } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Opening a campaign from the browser instead of a slash command.
 *
 * ── Why the kind is a choice and not a checkbox ─────────────────────────
 * Paid-ads and organic are not the same campaign with a flag; they are two
 * offers that happen to share a table. The rate means a different thing in
 * each, and the difference is invisible once the campaign is live — a clipper
 * reading "$25 / 100K" cannot tell whether that assumed ad spend. Making it a
 * two-card choice at the top forces the decision to be made deliberately,
 * before the rate is typed, rather than left at whatever the default was.
 *
 * The form posts to /api/team/<sig>/campaigns, which holds INGEST_SECRET
 * server-side. Nothing here can reach the bot on its own, by design.
 */

const PER_VIEWS = [
  { value: 1000, label: "per 1,000 views" },
  { value: 100000, label: "per 100,000 views" },
];

const PLATFORMS = [
  { value: "", label: "Both" },
  { value: "TikTok", label: "TikTok" },
  { value: "Instagram", label: "Instagram" },
];

export function NewCampaignForm({ sig }: { sig: string }) {
  const router = useRouter();
  const [paidAds, setPaidAds] = useState(true);
  const [perViews, setPerViews] = useState(100000);
  const [platform, setPlatform] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: number; name: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("saving");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      // Organic has no rate input, so the standard is sent explicitly rather
      // than left to the form. Reading the missing field would give 0, which
      // the API correctly refuses — the campaign would simply fail to open,
      // with an error about a field the person never saw.
      rate_amount: paidAds ? Number(form.get("rate_amount") ?? 0) : STANDARD_CLIPPER_RATE.amount,
      rate_per_views: paidAds ? perViews : STANDARD_CLIPPER_RATE.perViews,
      min_views: Number(form.get("min_views") ?? 0),
      max_views: Number(form.get("max_views") ?? 0),
      budget: Number(form.get("budget") ?? 0),
      category: String(form.get("category") ?? ""),
      platform,
      artist: String(form.get("artist") ?? ""),
      brief_url: String(form.get("brief_url") ?? ""),
      image_url: String(form.get("image_url") ?? ""),
      details: String(form.get("details") ?? ""),
      rules: String(form.get("rules") ?? ""),
      paid_ads: paidAds,
    };

    try {
      const res = await fetch(`/api/team/${sig}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't create it. Check the fields and try again.");
        setState("idle");
        return;
      }
      setCreated({ id: body.created, name: payload.name });
      setState("done");
      // The campaigns list is server-rendered, so it won't show the new row
      // until its data is refetched.
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setState("idle");
    }
  }

  if (state === "done" && created) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <Check className="mx-auto h-6 w-6 text-success" aria-hidden="true" />
        <p className="mt-3 font-medium">
          {created.name} is open
          <span className="text-muted-foreground"> · #{created.id}</span>
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          {paidAds
            ? "It's on the clippers' Ads board now."
            : "It's on the clippers' Campaigns board now."}{" "}
          It has no banner or board post yet — run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            /announce-campaign
          </code>{" "}
          in Discord when you want it posted.
        </p>
        {/* The moment a campaign is most likely to need changing is right
            here, before it is announced — a rate typed wrong, missing rules,
            no banner. This screen used to offer only "create another" and
            "back", so the fix meant finding the campaign again in a list of
            twenty-eight. */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push(`/team/${sig}/campaigns/${created.id}`)}>
            Edit campaign
          </Button>
          <Button variant="outline" onClick={() => { setState("idle"); setCreated(null); }}>
            Create another
          </Button>
          <Button variant="outline" onClick={() => router.push(`/team/${sig}/campaigns`)}>
            Back to campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset>
        <legend className="text-sm font-medium">What kind of campaign?</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          This decides which board clippers see it on, and what the rate is understood to
          mean. It can be changed later with <code className="font-mono text-xs">/campaign-edit</code>.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            {
              value: true,
              icon: BadgeDollarSign,
              title: "Paid ads",
              blurb: "Clipper puts spend behind the clip. Rate assumes it.",
            },
            {
              value: false,
              icon: Megaphone,
              title: "Organic",
              blurb: "Clip earns its own views. No ad spend expected.",
            },
          ].map(({ value, icon: Icon, title, blurb }) => (
            <button
              key={title}
              type="button"
              onClick={() => setPaidAds(value)}
              aria-pressed={paidAds === value}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors",
                paidAds === value
                  ? "border-foreground bg-accent"
                  : "border-border hover:border-[hsl(var(--border-strong))]",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="mt-1 text-sm font-medium">{title}</span>
              <span className="text-xs text-muted-foreground">{blurb}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Campaign name" name="name" required placeholder="My First Breath" />
        <Field label="Artist or brand" name="artist" placeholder="Shown on the card" />
      </div>

      {/*
        The rate is only asked for on paid ads.

        Organic campaigns nearly all run at the same number, and re-typing it
        every time is how a campaign ends up at $1 or $100 per 100K from a
        slipped keystroke — a rate is the one field where a typo is money
        rather than cosmetics. Paid ads have no such default: the rate there
        is negotiated against what the clipper is expected to spend, so it has
        to be entered deliberately every time.

        The standard is still shown rather than hidden. A form that silently
        decides what a campaign pays is worse than one that asks, so it says
        the figure and where to change it.
      */}
      {paidAds ? (
        <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
          <Field
            label="Rate ($)"
            name="rate_amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="25"
          />
          <div>
            <span className="text-sm font-medium">Per</span>
            <div className="mt-2 flex gap-2">
              {PER_VIEWS.map((o) => (
                <Chip
                  key={o.value}
                  active={perViews === o.value}
                  onClick={() => setPerViews(o.value)}
                  label={o.label}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">Rate</span>
            <span className="font-mono text-sm">{STANDARD_CLIPPER_RATE_LABEL}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            The standard organic rate. To run this one at something else, open it and
            change the rate with{" "}
            <code className="font-mono">/campaign-edit</code>.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Minimum views"
          name="min_views"
          type="number"
          min="0"
          placeholder="10000"
          hint="Below this a clip earns nothing"
        />
        <Field
          label="Max views per clip"
          name="max_views"
          type="number"
          min="0"
          placeholder="0"
          hint="0 = uncapped"
        />
        <Field
          label="Budget ($)"
          name="budget"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          hint="0 = unlimited; auto-closes when spent"
        />
      </div>

      <div>
        <span className="text-sm font-medium">Platform</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((o) => (
            <Chip
              key={o.label}
              active={platform === o.value}
              onClick={() => setPlatform(o.value)}
              label={o.label}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" name="category" placeholder="Music" />
        <Field label="Brief URL" name="brief_url" placeholder="https://… assets & requirements" />
      </div>

      <Field label="Banner image URL" name="image_url" placeholder="https://… shown on the card" />

      <TextArea
        label="Details"
        name="details"
        rows={3}
        placeholder="What the campaign is, what you want cut."
      />

      <TextArea
        label={paidAds ? "Rules — required" : "Rules"}
        name="rules"
        rows={4}
        required={paidAds}
        placeholder={
          paidAds
            ? "What they must spend, on which platform, and who covers it. This is the half of the offer the rate doesn't say."
            : "Requirements, dos and don'ts."
        }
        // Not a nicety on a paid-ads campaign: the rate assumes money is going
        // behind the clip and this is the only place that says how much.
        // Publishing without it asks people to spend against a number nobody
        // defined. The API refuses it too — this is just the earlier, kinder no.
        hint={
          paidAds
            ? "Required for paid ads — it's where the expected spend is stated."
            : undefined
        }
      />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={state === "saving"}>
          {state === "saving" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            `Open ${paidAds ? "paid-ad" : "organic"} campaign`
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Goes live on the clipper board immediately. Announcing it is a separate step.
        </p>
      </div>
    </form>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-[hsl(var(--border-strong))] hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  hint,
  className,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {rest.required && <span className="ml-1 text-muted-foreground">*</span>}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-[hsl(var(--border-strong))] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  name,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        {...rest}
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-[hsl(var(--border-strong))] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
