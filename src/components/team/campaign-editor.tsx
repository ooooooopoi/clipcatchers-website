"use client";

import { useState } from "react";
import { BadgeDollarSign, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignEditForm } from "@/components/team/campaign-edit-form";
import type { BotCampaign } from "@/lib/bot";

/**
 * Edit a campaign from its detail page.
 *
 * A closed button until asked for — the page is mostly read, and the numbers
 * shouldn't sit below a wall of inputs nobody came to change. The fields
 * themselves are CampaignEditForm.
 */
export function CampaignEditor({
  sig,
  campaign,
}: {
  sig: string;
  campaign: BotCampaign;
}) {
  const [open, setOpen] = useState(false);
  const paidAds = Number(campaign.paid_ads ?? 0) === 1;

  if (!open) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit campaign
        </Button>
        {paidAds ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-ink">
            <BadgeDollarSign className="h-3.5 w-3.5" />
            Paid ads
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="surface mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <CampaignEditForm sig={sig} campaign={campaign} onDone={() => setOpen(false)} />
    </div>
  );
}
