import type { Campaign, CampaignClip, CampaignMetric, CampaignStatus } from "@prisma/client";

export type CampaignWithDetail = Campaign & {
  metrics: CampaignMetric[];
  clips: CampaignClip[];
};

/**
 * A single campaign the report renders as one part of the whole — used to show
 * per-platform rows when a link covers more than one campaign.
 */
export type CampaignPart = {
  id: string;
  name: string;
  platforms: string[];
  totalViews: number;
  clipCount: number;
  spentCents: number;
  budgetCents: number;
};

/** Longest shared opening text of the campaign names, e.g. "CLUB 97". */
function sharedName(names: string[]): string | null {
  if (names.length === 0) return null;
  let prefix = names[0];
  for (const name of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i += 1;
    prefix = prefix.slice(0, i);
  }
  // Trim the punctuation and connecting words a split leaves dangling.
  const trimmed = prefix.replace(/[\s\-–—:|[({]+$/, "").replace(/\s+(and|&|\+)$/i, "").trim();
  return trimmed.length >= 3 ? trimmed : null;
}

const STATUS_PRIORITY: CampaignStatus[] = [
  "RUNNING",
  "APPROVED",
  "PENDING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

/**
 * Fold one or more campaigns into a single report view.
 *
 * A client running the same promotion on two platforms thinks of it as one
 * campaign, even though the bot tracks a separate campaign per platform. The
 * totals are summed and the daily series merged by date, so the chart shows
 * combined delivery rather than two half-pictures.
 */
export function combineCampaigns(campaigns: CampaignWithDetail[]) {
  const [first] = campaigns;
  const many = campaigns.length > 1;

  const byDate = new Map<number, { date: Date; views: number; reach: number; spendCents: number }>();
  for (const campaign of campaigns) {
    for (const metric of campaign.metrics) {
      const key = metric.date.getTime();
      const entry = byDate.get(key) ?? { date: metric.date, views: 0, reach: 0, spendCents: 0 };
      entry.views += metric.views;
      entry.reach += metric.reach;
      entry.spendCents += metric.spendCents;
      byDate.set(key, entry);
    }
  }
  const metrics = [...byDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime());

  const sum = (pick: (c: CampaignWithDetail) => number) =>
    campaigns.reduce((total, campaign) => total + pick(campaign), 0);

  const startDates = campaigns
    .map((c) => c.startDate)
    .filter((d): d is Date => d instanceof Date);

  const parts: CampaignPart[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    platforms: c.platforms,
    totalViews: c.totalViews,
    clipCount: c.clipCount,
    spentCents: c.spentCents,
    budgetCents: c.budgetCents,
  }));

  return {
    name: (many ? sharedName(campaigns.map((c) => c.name)) : null) ?? first.name,
    brandName: first.brandName,
    brandLogoUrl: campaigns.find((c) => c.brandLogoUrl)?.brandLogoUrl ?? null,
    status:
      STATUS_PRIORITY.find((status) => campaigns.some((c) => c.status === status)) ?? first.status,
    platforms: [...new Set(campaigns.flatMap((c) => c.platforms))],
    description: campaigns.find((c) => c.description)?.description ?? null,

    totalViews: sum((c) => c.totalViews),
    estimatedReach: sum((c) => c.estimatedReach),
    spentCents: sum((c) => c.spentCents),
    budgetCents: sum((c) => c.budgetCents),
    clipCount: sum((c) => c.clipCount),

    startDate: startDates.length ? new Date(Math.min(...startDates.map((d) => d.getTime()))) : null,
    updatedAt: new Date(Math.max(...campaigns.map((c) => c.updatedAt.getTime()))),

    metrics,
    clips: campaigns.flatMap((c) => c.clips).sort((a, b) => b.views - a.views),
    parts: many ? parts : [],
  };
}
