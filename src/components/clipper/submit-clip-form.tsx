"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClipperAccount } from "@/lib/bot";

type Campaign = { id: number; name: string };

/**
 * Submitting a clip from the web.
 *
 * Nothing is validated for real here. The bot checks the URL shape, that the
 * clipper has a verified account on that platform, and — after the fact —
 * that one of those accounts actually posted the video. Repeating any of it
 * would mean two implementations of the ownership rule, and the weaker one
 * would be the one that mattered the moment they disagreed.
 *
 * So this collects, submits, and reports back honestly, including the wait:
 * a clip arrives `pending` and earns nothing until the check clears.
 */
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
  const [platform, setPlatform] = useState<"TikTok" | "Instagram">("TikTok");
  const [campaignId, setCampaignId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onPlatform = accounts.filter((a) => a.platform === platform);

  // The one thing the website cannot resolve. Registering an account needs the
  // verification-code exchange, and that only exists in Discord — so say so
  // rather than letting them fill the form in and be refused at the end.
  if (accounts.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        You haven&apos;t verified a posting account yet. Run <code>/add-account</code> in Discord
        first — it proves the account is yours, which is what lets a clip earn.
      </p>
    );
  }

  if (campaigns.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No campaigns are open right now.
      </p>
    );
  }

  async function submit() {
    if (!url.trim() || !campaignId) {
      toast.error("Pick a campaign and paste your clip link.");
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
          url: url.trim(),
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
    <div className="surface mt-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="campaign">Campaign</Label>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger id="campaign">
              <SelectValue placeholder="Pick a campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={platform}
            onValueChange={(v) => {
              setPlatform(v as "TikTok" | "Instagram");
              // The account list is per platform, so a stale pick from the
              // other one would be rejected as "not one of your accounts".
              setAccountId("");
            }}
          >
            <SelectTrigger id="platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Only when there is something to choose. One account needs no
            question, and none at all is handled above. */}
        {onPlatform.length > 1 && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="account">Which account posted it</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Pick an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {onPlatform.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      @{a.handle}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="url">Clip link</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              platform === "TikTok"
                ? "https://www.tiktok.com/@you/video/…"
                : "https://www.instagram.com/reel/…"
            }
          />
        </div>
      </div>

      {onPlatform.length === 0 && (
        <p className="mt-4 text-sm text-warning">
          No verified {platform} account. Run <code>/add-account</code> in Discord, or switch
          platform.
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={() => void submit()} disabled={busy || onPlatform.length === 0}>
          {busy ? "Submitting…" : "Submit clip"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Checked against the live post before it earns.
        </p>
      </div>
    </div>
  );
}
