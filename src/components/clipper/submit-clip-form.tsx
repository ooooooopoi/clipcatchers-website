"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardPaste, Link2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import type { ClipperAccount } from "@/lib/bot";
import { cn } from "@/lib/utils";

type Campaign = { id: number; name: string };
type Platform = "TikTok" | "Instagram";

/**
 * Submitting a clip from the web.
 *
 * ── What is deliberately not checked here ───────────────────────────────
 * Ownership. The bot checks the URL shape, that the clipper has a verified
 * account on that platform, and — after the fact — that one of those accounts
 * actually posted the video. Repeating any of that would mean two
 * implementations of the ownership rule, and the weaker one would be the one
 * that mattered the moment they disagreed.
 *
 * The URL pattern below is the one apparent exception and it isn't one: it
 * never blocks a submission. It colours a hint and picks the platform. If it
 * and the bot ever disagree, the bot wins, because the button stays live
 * either way. Do not be tempted to disable submit on it — that is the change
 * that turns a hint into a second, worse gate.
 *
 * So this collects, submits, and reports back honestly, including the wait:
 * a clip arrives `pending` and earns nothing until the check clears.
 */
const URL_SHAPE: Record<Platform, RegExp> = {
  TikTok: /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/\S+$/i,
  Instagram: /^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p)\/\S+$/i,
};

/**
 * Which platform a pasted link belongs to, or null if it isn't one of ours.
 *
 * Used to move the platform chip to match what they actually pasted. A clipper
 * pastes the link first — it's the thing in their clipboard, and it's the only
 * field they can't answer from memory — so making the paste set the platform
 * removes the single most common way this form was filled in wrong.
 */
function platformOf(url: string): Platform | null {
  for (const p of Object.keys(URL_SHAPE) as Platform[]) {
    if (URL_SHAPE[p].test(url.trim())) return p;
  }
  return null;
}

export function SubmitClipForm({
  userId,
  sig,
  accounts,
  campaigns,
}: {
  userId: string;
  sig: string;
  accounts: ClipperAccount[];
  campaigns: Campaign[];
}) {
  const [platform, setPlatform] = useState<Platform>("TikTok");
  const [campaignId, setCampaignId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Whether a Paste button is worth offering, decided after mount rather than
  // during render. Two reasons it can't be an inline `typeof navigator` check:
  // the server has no navigator, so the markup would disagree with the first
  // client render and React would report a hydration mismatch; and Firefox
  // has no readText on an ordinary page, where a button that silently does
  // nothing is worse than no button at all.
  const [canPaste, setCanPaste] = useState(false);
  useEffect(() => {
    setCanPaste(typeof navigator.clipboard?.readText === "function");
  }, []);

  const onPlatform = accounts.filter((a) => a.platform === platform);

  // The one thing the website cannot resolve. Registering an account needs the
  // verification-code exchange, and that only exists in Discord — so say so
  // rather than letting them fill the form in and be refused at the end.
  //
  // Says "added", not "verified". Neither this form nor the bot filters on
  // accounts.verified — an account that has been registered but not yet
  // confirmed can submit through here and through Discord alike. Claiming a
  // verification gate that isn't applied would send someone hunting for a
  // problem they don't have. What actually decides whether a clip earns is
  // approval, which is stated in the steps under the button.
  if (accounts.length === 0) {
    return (
      <Notice tone="warning">
        You haven&apos;t added a posting account yet. Run <Cmd>/add-account</Cmd> in
        Discord first — a clip has to be filed under one of your accounts to count.
      </Notice>
    );
  }

  if (campaigns.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No campaigns are open right now. Your existing clips keep earning.
      </p>
    );
  }

  const trimmed = url.trim();
  const detected = platformOf(trimmed);
  // Only complain once there is enough typed to be a link at all. Marking a
  // half-pasted URL wrong on the third character is how a field feels hostile.
  const looksWrong = trimmed.length > 12 && detected === null;

  /** Shared by the input's onChange and the paste button. */
  function takeUrl(next: string) {
    setUrl(next);
    const found = platformOf(next);
    if (found && found !== platform) {
      setPlatform(found);
      // The account list is per platform, so a pick made under the old one
      // would be rejected as "not one of your accounts".
      setAccountId("");
    }
  }

  async function paste() {
    try {
      takeUrl(await navigator.clipboard.readText());
    } catch {
      // Denied, empty, or unsupported. The field is right there and still
      // takes a normal paste, so there is nothing useful to say.
    }
  }

  async function submit() {
    if (!campaignId) {
      toast.error("Pick which campaign this clip is for.");
      return;
    }
    if (!trimmed) {
      toast.error("Paste the link to your clip.");
      return;
    }
    // Only sent when there is a genuine choice. The bot picks the account
    // itself when there is exactly one, and refuses to guess when there are
    // several — filing a clip under the wrong account of their own would read
    // as a rejection once the check corrected it.
    if (onPlatform.length > 1 && !accountId) {
      toast.error("Pick which account posted this.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          platform,
          campaignId: Number(campaignId),
          accountId: accountId ? Number(accountId) : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(body.error ?? "Couldn't submit that clip.");
        return;
      }

      setUrl("");
      toast.success("Submitted. It'll show as pending until we've checked the post is yours.");
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      {/* The link comes first now.
          It used to be third, after two dropdowns, which had the form asking
          for the answers a clipper has to think about before the one already
          sitting in their clipboard. Leading with the paste also means the
          platform is usually decided before they reach it. */}
      <div>
        <label htmlFor="clip-url" className="text-sm font-medium">
          Paste your clip link
        </label>
        <div className="relative mt-2.5">
          <Link2
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="clip-url"
            value={url}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => takeUrl(e.target.value)}
            aria-describedby="clip-url-hint"
            placeholder={
              platform === "TikTok"
                ? "https://www.tiktok.com/@you/video/…"
                : "https://www.instagram.com/reel/…"
            }
            className={cn(
              "h-12 w-full rounded-xl border bg-background pl-9 pr-24 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
              looksWrong
                ? "border-warning/60 focus-visible:border-warning"
                : "border-border hover:border-[hsl(var(--border-strong))] focus-visible:border-foreground",
            )}
          />

          {/* Hidden once there's a link in the box — at that point it would
              be offering to overwrite what they just pasted. */}
          {canPaste && !trimmed && (
            <button
              type="button"
              onClick={() => void paste()}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </button>
          )}

          {detected && (
            <Check
              aria-hidden
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success"
            />
          )}
        </div>

        {/* One line, three states. It never blocks — see the note at the top
            of this file. */}
        <p
          id="clip-url-hint"
          className={cn(
            "mt-2 text-xs",
            looksWrong ? "text-warning" : "text-muted-foreground",
          )}
        >
          {looksWrong
            ? "That doesn't look like a TikTok or Instagram link — check it, or send it anyway and we'll take a look."
            : detected
              ? `${detected} link — platform set for you.`
              : "Copy it straight from the app's share sheet."}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <ChoiceChips
          name="platform"
          label="Platform"
          options={["TikTok", "Instagram"]}
          value={platform}
          onValueChange={(v) => {
            setPlatform(v as Platform);
            setAccountId("");
          }}
        />

        <ChoiceChips
          name="campaign"
          label="Which campaign"
          options={campaigns.map((c) => ({ value: String(c.id), label: c.name }))}
          value={campaignId}
          onValueChange={setCampaignId}
        />

        {/* Only when there is something to choose. One account needs no
            question, and none at all is handled above. */}
        {onPlatform.length > 1 && (
          <ChoiceChips
            name="account"
            label="Which account posted it"
            options={onPlatform.map((a) => ({ value: String(a.id), label: `@${a.handle}` }))}
            value={accountId}
            onValueChange={setAccountId}
          />
        )}
      </div>

      {onPlatform.length === 0 && (
        <div className="mt-6">
          <Notice tone="warning">
            No {platform} account added yet. Run <Cmd>/add-account</Cmd> in Discord, or
            switch platform above.
          </Notice>
        </div>
      )}

      <Button
        onClick={() => void submit()}
        disabled={busy || onPlatform.length === 0}
        size="lg"
        className="mt-7 h-12 w-full"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" />
            Submitting
          </>
        ) : (
          <>
            Submit clip
            <Send />
          </>
        )}
      </Button>

      {/* Says what happens after the button, because what happens after the
          button is a wait. "Checked against the live post before it earns" was
          true and far too quiet — a clip lands `pending`, sits there while
          someone confirms the account posted it, and only then starts
          counting. A clipper who doesn't know that reads `pending` as broken. */}
      <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
        {["Lands as pending", "We check the post is yours", "Views counted hourly"].map(
          (step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-muted-foreground/40">→</span>}
              <span>{step}</span>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warning"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "rounded-xl border p-4 text-sm leading-relaxed",
        tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
      )}
    >
      {children}
    </p>
  );
}

/** A Discord command, set apart so it reads as something to type. */
function Cmd({ children }: { children: React.ReactNode }) {
  return (
    // No border. `border-current/20` is a Tailwind v4 spelling — on v3 an
    // opacity modifier needs an <alpha-value> slot in the colour, and
    // currentColor has none, so it silently emits nothing. A background tint
    // says the same thing and actually renders.
    <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">{children}</code>
  );
}
