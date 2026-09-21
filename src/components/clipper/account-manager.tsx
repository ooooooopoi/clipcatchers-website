"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClipperAccount } from "@/lib/bot";

/**
 * Add and remove the profiles a clipper posts from.
 *
 * ── Both actions need a Discord session ──────────────────────────────────
 * Adding returns a verification code, which is the whole proof that a profile
 * belongs to the person claiming it — behind a forwardable link, anyone could
 * claim somebody else's account and earn from their posts. Removing cascades
 * to the account's clips and the earnings on them, which is not something a
 * leaked URL should be able to do.
 */
export function AccountManager({
  userId,
  sig,
  accounts,
  platforms,
  signedInAs,
}: {
  userId: string;
  sig: string;
  accounts: ClipperAccount[];
  platforms: string[];
  signedInAs: string | null;
}) {
  const isOwner = signedInAs === userId;
  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState(platforms[0] ?? "TikTok");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  // Shown once, after registering. Kept in state rather than re-fetched
  // because the accounts endpoint deliberately never returns codes.
  const [issued, setIssued] = useState<{ handle: string; code: string } | null>(null);
  const router = useRouter();

  async function add() {
    setBusy(true);
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Couldn't register that account.");
        return;
      }
      setIssued({ handle: body.handle, code: body.code });
      setHandle("");
      setAdding(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(account: ClipperAccount) {
    // Confirmed in the browser rather than with a second button, because the
    // thing being lost isn't the row — it's every clip posted from it.
    const sure = window.confirm(
      `Remove @${account.handle}?\n\nThis also deletes every clip submitted from it, ` +
        `and the earnings on those clips. This can't be undone.`,
    );
    if (!sure) return;

    setRemoving(account.id);
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/accounts/${account.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Couldn't remove it.");
        return;
      }
      toast.success(
        body.clips_removed
          ? `@${account.handle} removed, along with ${body.clips_removed} clip(s).`
          : `@${account.handle} removed.`,
      );
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      {accounts.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No accounts registered yet. Add the profile you post from to start submitting clips.
        </p>
      ) : (
        <ul className="mt-8 max-w-2xl space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="surface flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {a.platform}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">@{a.handle}</span>
              {isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={removing === a.id}
                  onClick={() => void remove(a)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remove this account and its clips"
                >
                  {removing !== a.id && <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* The code, once. It is never returned by any read endpoint, so if they
          navigate away it has to come from /my-accounts in Discord. */}
      {issued && (
        <div className="surface mt-4 max-w-2xl rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
          <p className="text-sm font-medium">@{issued.handle} added — one step left</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Put this code in your bio, then it can be verified:
          </p>
          <p className="mt-2 font-mono text-lg font-semibold tracking-wider text-primary-ink">
            {issued.code}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Run <code className="font-mono">/verify</code> in Discord once it&apos;s there. Write
            this down — this is the only time it&apos;s shown here.
          </p>
        </div>
      )}

      {!isOwner ? (
        <div className="mt-6 max-w-2xl">
          <p className="text-sm text-muted-foreground">
            Adding an account gives you a code that proves the profile is yours, so it needs
            your Discord account rather than just this link.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() =>
              signIn("discord", { callbackUrl: `/clipper/${userId}/${sig}/accounts` })
            }
          >
            Sign in with Discord to add one
          </Button>
        </div>
      ) : adding ? (
        <div className="surface mt-6 max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <Label>Platform</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                    platform === p
                      ? "border-primary bg-primary/10 font-medium text-primary-ink"
                      : "border-border text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Your profile</Label>
            <Input
              id="handle"
              value={handle}
              spellCheck={false}
              autoComplete="off"
              placeholder="@yourname — or paste your profile link"
              onChange={(e) => setHandle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Pasting the share link from the app works. A link to a single video doesn&apos;t —
              it has to be your profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void add()} loading={busy} disabled={!handle.trim()}>
              Add account
            </Button>
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="mt-6" onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add an account
        </Button>
      )}
    </>
  );
}
