"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  AddAccountForm,
  CheckBioButton,
  IssuedCode,
  type IssuedAccount,
} from "@/components/clipper/add-account-form";
import { Button } from "@/components/ui/button";
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
  const [removing, setRemoving] = useState<number | null>(null);
  // Shown once, after registering. Kept in state rather than re-fetched
  // because the accounts endpoint deliberately never returns codes.
  const [issued, setIssued] = useState<IssuedAccount | null>(null);
  const router = useRouter();

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
              className="surface rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {a.platform}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">@{a.handle}</span>
                {/* Nothing when an older bot doesn't say. */}
                {a.verified === true && (
                  <span className="shrink-0 text-xs font-medium text-success">Verified</span>
                )}
                {a.verified === false && (
                  <span className="shrink-0 text-xs text-warning">Not verified</span>
                )}
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
              </div>
              {isOwner && a.verified === false && issued?.id !== a.id && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Put your code in this account&apos;s bio, then check. Lost the code? Checking
                    shows it again.
                  </p>
                  <CheckBioButton userId={userId} sig={sig} account={a} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {issued && (
        <div className="mt-4 max-w-2xl">
          <IssuedCode
            account={issued}
            userId={userId}
            sig={sig}
            onVerified={() => setIssued(null)}
          />
        </div>
      )}

      {/* Desktop only. On a phone, Add account is one of the buttons at the
          top of every page (MobileActions), and a second one under the list
          would be the same thing twice on one screen. */}
      <div className="hidden lg:block">
        {!isOwner ? (
          <div className="mt-6 max-w-2xl">
            <AddAccountForm
              userId={userId}
              sig={sig}
              platforms={platforms}
              signedInAs={signedInAs}
              onAdded={setIssued}
            />
          </div>
        ) : adding ? (
          <div className="surface mt-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
            <AddAccountForm
              userId={userId}
              sig={sig}
              platforms={platforms}
              signedInAs={signedInAs}
              onAdded={(account) => {
                setIssued(account);
                setAdding(false);
                router.refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-6" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add an account
          </Button>
        )}
      </div>
    </>
  );
}
