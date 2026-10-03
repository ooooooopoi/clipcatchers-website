"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClipperAccount } from "@/lib/bot";

/** A just-registered account, with the bio code that proves it's theirs. */
export type IssuedAccount = ClipperAccount & { code: string };

/**
 * Register a posting account from the website: what /add-account does in
 * Discord, through the same bot endpoint.
 *
 * Used on the Accounts page and inside the submit form. The submit form used
 * to stop a clipper with "run /add-account in Discord", sending them off the
 * site in the middle of submitting a clip.
 *
 * ── Needs a Discord session, not just the link ──────────────────────────
 * Adding issues the bio code, and the code is the whole proof the profile is
 * theirs. Behind a forwardable link anyone could claim somebody else's
 * account and earn from their posts. The route enforces this; here it only
 * decides between the form and a sign-in button.
 */
export function AddAccountForm({
  userId,
  sig,
  platforms,
  initialPlatform,
  signedInAs,
  onAdded,
  onCancel,
}: {
  userId: string;
  sig: string;
  /** One entry fixes the platform; several show a choice. */
  platforms: string[];
  initialPlatform?: string;
  /** The server's answer to who is signed in. Omitted, the browser session is asked. */
  signedInAs?: string | null;
  onAdded: (account: IssuedAccount) => void;
  onCancel?: () => void;
}) {
  const { data: session, status } = useSession();
  const [platform, setPlatform] = useState(initialPlatform ?? platforms[0] ?? "TikTok");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  const known = signedInAs !== undefined;
  // Nothing until the browser knows, rather than flashing a sign-in button at
  // someone who is already signed in.
  if (!known && status === "loading") return null;
  const isOwner = (known ? signedInAs : (session?.user?.discordId ?? null)) === userId;

  if (!isOwner) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">
          Adding an account gives you a code that proves the profile is yours, so it needs your
          Discord account rather than just this link.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          // Back to wherever they were, so the clip they were submitting is
          // one step away when they return.
          onClick={() => signIn("discord", { callbackUrl: window.location.href })}
        >
          Sign in with Discord to add one
        </Button>
      </div>
    );
  }

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
      setHandle("");
      onAdded({ id: body.id, platform: body.platform ?? platform, handle: body.handle, code: body.code });
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {platforms.length > 1 && (
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
      )}

      <div className="space-y-2">
        <Label htmlFor={`handle-${platform}`}>
          {platforms.length > 1 ? "Your profile" : `Your ${platform} profile`}
        </Label>
        <Input
          id={`handle-${platform}`}
          value={handle}
          spellCheck={false}
          autoComplete="off"
          placeholder="@yourname — or paste your profile link"
          onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && handle.trim() && !busy) void add();
          }}
        />
        <p className="text-xs text-muted-foreground">
          Pasting the share link from the app works. A link to a single video doesn&apos;t — it
          has to be your profile.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void add()} loading={busy} disabled={!handle.trim()}>
          Add account
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The bio code, right after adding, with the button that checks for it.
 *
 * No read endpoint returns the code. If they navigate away, Check my bio on
 * the Accounts page shows it again.
 */
export function IssuedCode({
  account,
  userId,
  sig,
  onVerified,
}: {
  account: IssuedAccount;
  userId: string;
  sig: string;
  onVerified?: () => void;
}) {
  return (
    <div className="surface rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
      <p className="text-sm font-medium">@{account.handle} added — one step left</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Put this code in your {account.platform} bio, then check:
      </p>
      <p className="mt-2 select-all font-mono text-lg font-semibold tracking-wider text-primary-ink">
        {account.code}
      </p>
      <div className="mt-3">
        <CheckBioButton userId={userId} sig={sig} account={account} onVerified={onVerified} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        We also check once by ourselves, about two minutes after adding.
      </p>
    </div>
  );
}

/**
 * Check my bio: looks for the account's code in its bio and verifies it if
 * it's there. What /verify-account does in Discord, with the same cooldown.
 *
 * "Not there yet" is usually not a mistake: the platforms take about two
 * minutes to show a bio change, so someone who saved the code and pressed at
 * once sees this. The message says that first, so the next move is to wait
 * rather than to re-edit a bio that was already right. It also shows the
 * code, which is how someone who lost theirs gets it back.
 */
export function CheckBioButton({
  userId,
  sig,
  account,
  onVerified,
}: {
  userId: string;
  sig: string;
  account: ClipperAccount;
  onVerified?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const router = useRouter();

  async function check() {
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch(`/api/clipper/${userId}/${sig}/accounts/${account.id}/verify`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.verified) {
        setMissing(null);
        toast.success(`@${account.handle} is verified.`);
        onVerified?.();
        router.refresh();
        return;
      }
      if (res.ok) {
        setMissing(body.code ?? null);
        return;
      }
      setProblem(body.error ?? "Couldn't check right now.");
    } catch {
      setProblem("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" size="sm" variant="outline" loading={busy} onClick={() => void check()}>
        Check my bio
      </Button>
      {missing && (
        <p className="mt-2 text-xs leading-relaxed text-warning">
          <span className="select-all font-mono font-semibold">{missing}</span> isn&apos;t showing in
          your {account.platform} bio yet. If you only just added it, that&apos;s normal: it takes
          about 2 minutes to show. Wait, then check again. If it&apos;s been longer, check the
          code is saved and the account is public.
        </p>
      )}
      {problem && <p className="mt-2 text-xs text-warning">{problem}</p>}
    </div>
  );
}
