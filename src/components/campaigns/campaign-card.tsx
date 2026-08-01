"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarRange, Eye, Users } from "lucide-react";
import type { Campaign } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { formatCompact, formatCurrency, formatDate, initials } from "@/lib/format";

export function CampaignCard({ campaign, index = 0 }: { campaign: Campaign; index?: number }) {
  const pct = campaign.budgetCents
    ? Math.min(100, (campaign.spentCents / campaign.budgetCents) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
    >
      <Card className="group relative h-full p-5 transition-all hover:border-border/90 hover:shadow-lg hover:shadow-black/20">
        <div className="flex items-start gap-3">
          {campaign.brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.brandLogoUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary">
              {initials(campaign.brandName)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <Link href={`/campaigns/${campaign.id}`} className="block">
              <h3 className="truncate font-medium leading-tight transition-colors group-hover:text-primary">
                {campaign.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{campaign.brandName}</p>
            </Link>
          </div>

          <CampaignActions id={campaign.id} name={campaign.name} status={campaign.status} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <StatusBadge status={campaign.status} />
          {campaign.platforms.slice(0, 2).map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {platform}
            </span>
          ))}
          {campaign.platforms.length > 2 && (
            <span className="text-[11px] text-muted-foreground">
              +{campaign.platforms.length - 2}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Views
            </div>
            <p className="mt-1 font-mono text-sm font-semibold">
              {formatCompact(campaign.totalViews)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Reach
            </div>
            <p className="mt-1 font-mono text-sm font-semibold">
              {formatCompact(campaign.estimatedReach)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-mono">
              {formatCurrency(campaign.spentCents)} / {formatCurrency(campaign.budgetCents)}
            </span>
          </div>
          <Progress value={pct} className="mt-1.5 h-1.5" />
        </div>

        <div className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
        </div>
      </Card>
    </motion.div>
  );
}
