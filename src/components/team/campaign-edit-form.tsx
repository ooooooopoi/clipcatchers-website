"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BotCampaign } from "@/lib/bot";

/**
 * The campaign edit form itself: one set of fields, one save path.
 *
 * Its own file because it has two entrances that must not drift: the detail
 * page's inline editor (CampaignEditor) and the campaigns list's edit sheet
 * (CampaignsTable). Same fields, same diff-and-patch save, whichever door a
 * change comes through.
 *
 * ── Why it sends only what changed ───────────────────────────────────────
 * The route takes a partial patch and the bot writes only the keys present.
 * Posting the whole object back would mean every save re-asserting values
 * nobody touched — and the first time two people had this open, one would
 * silently undo the other. So the form diffs against what it was given and
 * sends the difference, or nothing at all.
 *
 * ── Rules are load-bearing here ──────────────────────────────────────────
 * On a paid-ads campaign the rules are where the required spend is stated, and
 * the route refuses to set paid_ads without them. That refusal is surfaced as
 * a normal validation message rather than an error, because it is a reasonable
 * thing to have forgotten and the fix is one field away.
 */

/**
 * The bot accepts exactly these, or empty for both — anything else is refused
 * at save time. This was a free-text input for a while, and "tiktok" typed in
 * lowercase produced a refusal only after the whole form was filled in.
 */
const PLATFORMS = [
  { value: "", label: "Both" },
  { value: "TikTok", label: "TikTok" },
  { value: "Instagram", label: "Instagram" },
];

export function CampaignEditForm({
  sig,
  campaign,
  onDone,
}: {
  sig: string;
  campaign: BotCampaign;
  /** Called after a successful save (true) or cancel (false). */
  onDone: (saved: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const initial = {
    name: campaign.name ?? "",
    artist: campaign.artist ?? "",
    platform: campaign.platform ?? "",
    rate_amount: String(campaign.rate_amount ?? ""),
    min_views: String(campaign.min_views ?? 0),
    max_views: String(campaign.max_views ?? 0),
    max_clips_per_account: String(campaign.max_clips_per_account ?? 0),
    budget: String(campaign.budget ?? 0),
    brief_url: campaign.brief_url ?? "",
    image_url: campaign.image_url ?? "",
    details: campaign.details ?? "",
    rules: campaign.rules ?? "",
    paid_ads: Number(campaign.paid_ads ?? 0) === 1,
    active: Number(campaign.active ?? 0) === 1,
  };
  const [form, setForm] = useState(initial);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    // Only the difference. Numbers are compared as numbers so "2000" and 2000
    // don't read as a change and rewrite a field nobody touched.
    const patch: Record<string, unknown> = {};
    const numeric = new Set([
      "rate_amount",
      "min_views",
      "max_views",
      "max_clips_per_account",
      "budget",
    ]);
    for (const key of Object.keys(initial) as (keyof typeof form)[]) {
      const now = form[key];
      const was = initial[key];
      if (numeric.has(key as string)) {
        if (Number(now) !== Number(was)) patch[key] = Number(now);
      } else if (now !== was) {
        patch[key] = now;
      }
    }

    if (Object.keys(patch).length === 0) {
      toast.info("Nothing changed.");
      onDone(false);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/team/${sig}/campaigns/${campaign.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "The bot refused the change.");
        return;
      }
      toast.success(
        `Saved — ${Object.keys(patch).length} field${
          Object.keys(patch).length === 1 ? "" : "s"
        } updated.`,
      );
      router.refresh();
      onDone(true);
    } catch {
      toast.error("Couldn't reach the server. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Artist">
          <Input value={form.artist} onChange={(e) => set("artist", e.target.value)} />
        </Field>
        <Field label="Budget ($)">
          <Input
            inputMode="decimal"
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
          />
        </Field>
        <Field label={`Rate ($ per ${campaign.rate_per_views.toLocaleString()} views)`}>
          <Input
            inputMode="decimal"
            value={form.rate_amount}
            onChange={(e) => set("rate_amount", e.target.value)}
          />
        </Field>
        <Field label="Minimum views to earn">
          <Input
            inputMode="numeric"
            value={form.min_views}
            onChange={(e) => set("min_views", e.target.value)}
          />
        </Field>
        <Field label="Cap views per post" hint="0 means uncapped.">
          <Input
            inputMode="numeric"
            value={form.max_views}
            onChange={(e) => set("max_views", e.target.value)}
          />
        </Field>
        <Field
          label="Clips per account"
          hint="0 uses the global limit. Set it low on a campaign where one good clip is the point, high where volume is."
        >
          <Input
            inputMode="numeric"
            value={form.max_clips_per_account}
            onChange={(e) => set("max_clips_per_account", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Platform">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => set("platform", o.value)}
              aria-pressed={form.platform === o.value}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                form.platform === o.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-[hsl(var(--border-strong))] hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Brief link">
        <Input value={form.brief_url} onChange={(e) => set("brief_url", e.target.value)} />
      </Field>

      <Field
        label="Banner image URL"
        hint="Discord attachment links expire — anything pasted from a message stops loading within a day or so."
      >
        <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} />
      </Field>

      <Field label="Details" hint="Shown on the campaign card. One line each.">
        <textarea
          rows={3}
          value={form.details}
          onChange={(e) => set("details", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
      </Field>

      <Field
        label="Rules"
        hint="On a paid-ads campaign this is where the required spend is stated, and it's shown on the clipper's card. One line each."
      >
        <textarea
          rows={3}
          value={form.rules}
          onChange={(e) => set("rules", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
      </Field>

      <div className="space-y-3 border-t border-border pt-4">
        <Toggle
          checked={form.paid_ads}
          onChange={(v) => set("paid_ads", v)}
          label="Paid-ads campaign"
          hint="Moves it to the clipper's Ads board, away from organic campaigns. Needs rules — that's where the spend requirement lives."
        />
        <Toggle
          checked={form.active}
          onChange={(v) => set("active", v)}
          label="Open for submissions"
          hint="Turning this off closes the campaign. Clips already submitted keep earning until it's audited."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void save()} loading={busy}>
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={() => onDone(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
