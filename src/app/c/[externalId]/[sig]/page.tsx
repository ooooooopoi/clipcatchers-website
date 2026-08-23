import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Clapperboard, DollarSign, Eye, Gauge, Users } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { AreaTrend } from "@/components/charts/area-trend";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { ClipsExplorer } from "@/components/team/clips-explorer";
import { ExportClips } from "@/components/team/export-clips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { combineCampaigns } from "@/lib/combined-campaign";
import { effectiveCpm } from "@/lib/pricing";
import { shareSignatureValid } from "@/lib/share";
import { formatCurrency, formatDate, formatNumber, initials } from "@/lib/format";
import { REACH_LABEL, REACH_NOTE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campaign report",
  robots: { index: false, follow: false },
};

/**
 * Public, read-only report for a single campaign. The signature in the URL is
 * the only credential, so this renders exactly one campaign and never exposes
 * anything account-level.
 */
export default async function SharedCampaignPage({
  params,
}: {
  params: Promise<{ externalId: string; sig: string }>;
}) {
  const { externalId, sig } = await params;
  const key = decodeURIComponent(externalId);
  // The signature covers the whole key, so a link for one campaign can't be
  // edited into a link for two.
  if (!shareSignatureValid(key, sig)) notFound();

  // A "+"-joined key reports on several campaigns at once, for a client
  // running the same promotion across platforms.
  const ids = key.split("+").map((part) => part.trim()).filter(Boolean);

  const records = await prisma.campaign.findMany({
    where: { externalId: { in: ids } },
    include: {
      metrics: { orderBy: { date: "asc" }, take: 120 },
      clips: { orderBy: [{ views: "desc" }, { externalId: "desc" }], take: 200 },
    },
  });
  if (records.length === 0) notFound();

  // Keep the client's chosen order rather than whatever the database returns.
  records.sort((a, b) => ids.indexOf(a.externalId ?? "") - ids.indexOf(b.externalId ?? ""));
  const campaign = combineCampaigns(records);

  const series = campaign.metrics.map((m) => ({
    label: format(m.date, "MMM d"),
    views: m.views,
    reach: m.reach,
  }));
  const budgetPct = campaign.budgetCents
    ? Math.min(100, (campaign.spentCents / campaign.budgetCents) * 100)
    : 0;

  // Serialised once and shared: a Date can't cross into a client component,
  // and both the table and the export need the same rows.
  const explorerClips = campaign.clips.map((clip) => ({
    id: clip.id,
    url: clip.url,
    handle: clip.handle,
    platform: clip.platform,
    views: clip.views,
    createdAt: clip.createdAt.toISOString(),
  }));

  // The homepage sells "views, reach, spend and effective CPM per campaign"
  // and this report — the one a client actually forwards to their manager —
  // was the one surface that didn't show the CPM. It's computed from real
  // spend against real views rather than assumed to equal the list rate: a
  // campaign that closed early or was trimmed to budget won't match.
  const cpm = effectiveCpm(campaign.spentCents, campaign.totalViews);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-grid opacity-[0.25]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandWordmark />
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Live — updates automatically
          </span>
        </header>

        <div className="mt-10 flex flex-wrap items-start gap-4">
          {campaign.brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.brandLogoUrl}
              alt=""
              className="h-14 w-14 rounded-xl border border-border object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/20 to-primary/5 text-base font-semibold text-primary">
              {initials(campaign.brandName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              Campaign report
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{campaign.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={campaign.status} />
              <span>{campaign.brandName}</span>
              {campaign.platforms.length > 0 && <span>· {campaign.platforms.join(", ")}</span>}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} label="Total views" value={campaign.totalViews} format="compact" icon={<Eye />} />
          <StatCard
            index={1}
            label="Effective CPM"
            value={Math.round(cpm * 100)}
            format="currency"
            icon={<Gauge />}
            hint="spend per 1,000 views delivered"
          />
          <StatCard
            index={2}
            label="Spend"
            value={campaign.spentCents}
            format="currency"
            icon={<DollarSign />}
            hint={campaign.budgetCents ? `of ${formatCurrency(campaign.budgetCents)}` : undefined}
          />
          <StatCard
            index={3}
            label="Clips"
            value={campaign.clipCount}
            format="number"
            icon={<Clapperboard />}
            hint="approved and live"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StatCard
            index={4}
            label={REACH_LABEL}
            value={campaign.estimatedReach}
            format="compact"
            icon={<Users />}
            note={REACH_NOTE}
            hint="estimated, not measured"
          />
          <StatCard
            index={5}
            label="Creators"
            value={new Set(explorerClips.map((c) => c.handle).filter(Boolean)).size}
            format="number"
            icon={<Users />}
            hint="posting on this campaign"
          />
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delivery</CardTitle>
            <CardDescription>
              Views delivered by your creators, with modelled reach alongside.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {series.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Performance data appears here as clips go live.
              </p>
            ) : (
              <AreaTrend
                data={series}
                height={300}
                keys={[
                  { key: "views", label: "Views", color: "hsl(var(--primary))" },
                  { key: "reach", label: REACH_LABEL, color: "hsl(199 89% 55%)" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {campaign.parts.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">By campaign</CardTitle>
              <CardDescription>
                How each platform contributed to the totals above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {campaign.parts.map((part) => (
                  <li
                    key={part.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{part.name}</p>
                      {part.platforms.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {part.platforms.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-5 font-mono text-sm tabular-nums">
                      <span>
                        {formatNumber(part.totalViews)}
                        <span className="ml-1 text-xs text-muted-foreground">views</span>
                      </span>
                      <span>
                        {formatNumber(part.clipCount)}
                        <span className="ml-1 text-xs text-muted-foreground">clips</span>
                      </span>
                      <span>{formatCurrency(part.spentCents)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Clips</CardTitle>
                <CardDescription>
                  Every approved clip running on this campaign. Search by creator, filter
                  by platform, and open any one to see the live post.
                </CardDescription>
              </div>
              <ExportClips clips={explorerClips} campaignName={campaign.name} />
            </div>
          </CardHeader>
          <CardContent>
            {explorerClips.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Approved clips appear here as creators post them.
              </p>
            ) : (
              <ClipsExplorer clips={explorerClips} />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-2xl font-semibold">
                  {formatCurrency(campaign.spentCents)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {campaign.budgetCents > 0 ? `of ${formatCurrency(campaign.budgetCents)}` : "spent"}
                </span>
              </div>
              {campaign.budgetCents > 0 ? (
                <>
                  <Progress value={budgetPct} className="mt-3 h-3" />
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium">{budgetPct.toFixed(1)}% delivered</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(Math.max(campaign.budgetCents - campaign.spentCents, 0))}{" "}
                      remaining
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  No budget cap set on this campaign.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={campaign.description ? "lg:col-span-2" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Started</span>
                <span className="font-medium">{formatDate(campaign.startDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">{formatDate(campaign.updatedAt)}</span>
              </div>
              {campaign.description && (
                <p className="whitespace-pre-wrap border-t border-border pt-3 leading-relaxed text-muted-foreground">
                  {campaign.description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>Powered by Clip Catchers</span>
          <span>This report is private — please don&apos;t share the link.</span>
        </footer>
      </div>
    </div>
  );
}
