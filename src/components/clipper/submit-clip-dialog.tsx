"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitClipForm } from "@/components/clipper/submit-clip-form";
import type { BotCampaign, ClipperAccount } from "@/lib/bot";

/**
 * "Submit a clip" on a campaign card, opening the form right there.
 *
 * ── Why a dialog and not a link ──────────────────────────────────────────
 * The button used to navigate to the Clips page, where the same form sat with
 * a campaign picker — so clicking Submit on FRAGILE HORIZONS landed you on a
 * different page being asked "which campaign?", a question you had already
 * answered by clicking. The card is the choice; the dialog keeps it.
 *
 * The form inside is the Clips page's own, not a copy: same URL detection,
 * same account rules, same endpoint. It arrives with this campaign
 * preselected, and the picker shows the one option so what you're submitting
 * to is stated rather than implied.
 */
export function SubmitClipDialog({
  campaign,
  userId,
  sig,
  accounts,
}: {
  campaign: BotCampaign;
  userId: string;
  sig: string;
  accounts: ClipperAccount[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Submit a clip
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* `dark` because the dialog portals to document.body, outside the
            .clipper-shell wrapper that scopes this subtree's variables. */}
        <DialogContent className="dark max-h-[85vh] overflow-y-auto bg-background text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a clip</DialogTitle>
            <DialogDescription>{campaign.name}</DialogDescription>
          </DialogHeader>

          <SubmitClipForm
            userId={userId}
            sig={sig}
            accounts={accounts}
            campaigns={[{ id: campaign.id, name: campaign.name }]}
            initialCampaignId={String(campaign.id)}
            onSubmitted={() => setOpen(false)}
            bare
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
