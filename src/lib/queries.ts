import { subDays, startOfDay, format } from "date-fns";
import type { CampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityItem = {
  id: string;
  kind: "campaign" | "invoice" | "ticket" | "file";
  title: string;
  detail: string;
  at: Date;
  href: string;
};

export async function getDashboardData(userId: string, scope: Prisma.CampaignWhereInput = { userId }) {
  const since = startOfDay(subDays(new Date(), 29));

  const [campaigns, statusGroups, totals, metrics, invoices, tickets, files, user] =
    await Promise.all([
      prisma.campaign.findMany({
        where: scope,
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.campaign.groupBy({
        by: ["status"],
        where: scope,
        _count: { _all: true },
      }),
      prisma.campaign.aggregate({
        where: scope,
        _sum: { totalViews: true, estimatedReach: true, spentCents: true, budgetCents: true },
        _count: { _all: true },
      }),
      prisma.campaignMetric.findMany({
        where: { campaign: scope, date: { gte: since } },
        orderBy: { date: "asc" },
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { issuedAt: "desc" },
        take: 5,
      }),
      prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.fileAsset.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

  const statusCounts = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  ) as Record<CampaignStatus, number | undefined>;

  // Daily series, gap-filled so the chart never has holes.
  const byDay = new Map<string, { views: number; reach: number; spendCents: number }>();
  for (const metric of metrics) {
    const key = format(metric.date, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { views: 0, reach: 0, spendCents: 0 };
    entry.views += metric.views;
    entry.reach += metric.reach;
    entry.spendCents += metric.spendCents;
    byDay.set(key, entry);
  }

  const series = Array.from({ length: 30 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i));
    const key = format(date, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { views: 0, reach: 0, spendCents: 0 };
    return {
      date: key,
      label: format(date, "MMM d"),
      views: entry.views,
      reach: entry.reach,
      spend: entry.spendCents / 100,
    };
  });

  // The chart's line: views and reach to date, climbing. Daily figures drew
  // a saw: a campaign only reports on days it syncs, so a quiet day read 0
  // and the next day carried both. A running total, started from what came
  // before the window, and with silent days drawn straight between their
  // neighbours, shows the growth that actually happened.
  const before = await prisma.campaignMetric.aggregate({
    where: { campaign: scope, date: { lt: since } },
    _sum: { views: true, reach: true },
  });
  let views = before._sum.views ?? 0;
  let reach = before._sum.reach ?? 0;
  const growth = series.map((point) => {
    const seen = byDay.has(point.date);
    views += Number(point.views);
    reach += Number(point.reach);
    return { date: point.date, label: point.label, views, reach, seen };
  });
  // Fill silent days between two reported ones with a straight line.
  let last = -1;
  growth.forEach((point, i) => {
    if (!point.seen && i !== 0) return;
    if (last >= 0 && i - last > 1) {
      const a = growth[last];
      for (let k = last + 1; k < i; k++) {
        const t = (k - last) / (i - last);
        growth[k].views = Math.round(a.views + (point.views - a.views) * t);
        growth[k].reach = Math.round(a.reach + (point.reach - a.reach) * t);
      }
    }
    last = i;
  });
  const cumulative = growth.map(({ date, label, views, reach }) => ({ date, label, views, reach }));

  const half = Math.floor(series.length / 2);
  const recent = series.slice(half).reduce((sum, d) => sum + d.views, 0);
  const previous = series.slice(0, half).reduce((sum, d) => sum + d.views, 0);
  const viewsTrend = previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) / previous) * 100;

  const activity: ActivityItem[] = [
    ...campaigns.map((c) => ({
      id: `campaign-${c.id}`,
      kind: "campaign" as const,
      title: c.name,
      detail: `Campaign ${c.status.toLowerCase()}`,
      at: c.updatedAt,
      href: `/campaigns/${c.id}`,
    })),
    ...invoices.map((i) => ({
      id: `invoice-${i.id}`,
      kind: "invoice" as const,
      title: i.number,
      detail: i.status === "PAID" ? "Invoice paid" : "Invoice issued",
      at: i.paidAt ?? i.issuedAt,
      href: "/billing",
    })),
    ...tickets.map((t) => ({
      id: `ticket-${t.id}`,
      kind: "ticket" as const,
      title: t.subject,
      detail: `Ticket ${t.status.toLowerCase()}`,
      at: t.updatedAt,
      href: `/support/${t.id}`,
    })),
    ...files.map((f) => ({
      id: `file-${f.id}`,
      kind: "file" as const,
      title: f.name,
      detail: "Asset uploaded",
      at: f.createdAt,
      href: "/files",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 7);

  const upcoming = await prisma.campaign.findMany({
    where: { ...scope, endDate: { gte: new Date() }, status: { in: ["RUNNING", "APPROVED"] } },
    orderBy: { endDate: "asc" },
    take: 4,
  });

  // Which campaigns actually produced the views, biggest first.
  //
  // Deliberately its own query rather than a reuse of `campaigns` above: that
  // list is the five most recently *touched*, which is a different question
  // and would put a campaign that was renamed yesterday ahead of the one that
  // delivered ninety percent of the result.
  const byViews = await prisma.campaign.findMany({
    where: { ...scope, totalViews: { gt: 0 } },
    orderBy: { totalViews: "desc" },
    take: 6,
    select: { id: true, name: true, totalViews: true, status: true },
  });

  return {
    campaigns,
    byViews,
    statusCounts,
    totals: {
      campaigns: totals._count._all,
      active: (statusCounts.RUNNING ?? 0) + (statusCounts.APPROVED ?? 0),
      views: totals._sum.totalViews ?? 0,
      reach: totals._sum.estimatedReach ?? 0,
      spentCents: totals._sum.spentCents ?? 0,
      budgetCents: totals._sum.budgetCents ?? 0,
    },
    series,
    cumulative,
    viewsTrend,
    activity,
    upcoming,
  };
}

export async function getAnalyticsData(userId: string, days: number, scope: Prisma.CampaignWhereInput = { userId }) {
  const since = startOfDay(subDays(new Date(), days - 1));

  const [metrics, campaigns] = await Promise.all([
    prisma.campaignMetric.findMany({
      where: { campaign: scope, date: { gte: since } },
      orderBy: { date: "asc" },
      include: { campaign: { select: { id: true, name: true } } },
    }),
    prisma.campaign.findMany({
      where: scope,
      orderBy: { totalViews: "desc" },
      select: {
        id: true,
        name: true,
        brandName: true,
        totalViews: true,
        estimatedReach: true,
        spentCents: true,
        budgetCents: true,
        status: true,
      },
    }),
  ]);

  const byDay = new Map<string, { views: number; reach: number; spendCents: number }>();
  for (const metric of metrics) {
    const key = format(metric.date, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { views: 0, reach: 0, spendCents: 0 };
    entry.views += metric.views;
    entry.reach += metric.reach;
    entry.spendCents += metric.spendCents;
    byDay.set(key, entry);
  }

  const daily = Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const key = format(date, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { views: 0, reach: 0, spendCents: 0 };
    return {
      date: key,
      label: format(date, days > 45 ? "MMM d" : "MMM d"),
      views: entry.views,
      reach: entry.reach,
      spend: entry.spendCents / 100,
      cpm: entry.views ? Number(((entry.spendCents / entry.views) * 1000 / 100).toFixed(2)) : 0,
    };
  });

  // Week/month rollups for the growth charts.
  const weekly = new Map<string, { label: string; views: number; reach: number }>();
  const monthly = new Map<string, { label: string; views: number; reach: number }>();
  for (const day of daily) {
    const date = new Date(day.date);
    const weekKey = format(subDays(date, date.getDay()), "yyyy-MM-dd");
    const monthKey = format(date, "yyyy-MM");
    const w = weekly.get(weekKey) ?? {
      label: `Wk of ${format(subDays(date, date.getDay()), "MMM d")}`,
      views: 0,
      reach: 0,
    };
    w.views += day.views;
    w.reach += day.reach;
    weekly.set(weekKey, w);

    const m = monthly.get(monthKey) ?? { label: format(date, "MMM yyyy"), views: 0, reach: 0 };
    m.views += day.views;
    m.reach += day.reach;
    monthly.set(monthKey, m);
  }

  const totalViews = daily.reduce((s, d) => s + d.views, 0);
  const totalReach = daily.reduce((s, d) => s + d.reach, 0);
  const totalSpend = daily.reduce((s, d) => s + d.spend, 0);

  return {
    daily,
    weekly: Array.from(weekly.values()),
    monthly: Array.from(monthly.values()),
    campaigns,
    totals: {
      views: totalViews,
      reach: totalReach,
      spend: totalSpend,
      cpm: totalViews ? (totalSpend / totalViews) * 1000 : 0,
    },
  };
}
