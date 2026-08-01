import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { DollarSign, Eye, Gauge, Users } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { AreaTrend } from "@/components/charts/area-trend";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { shareSignatureValid } from "@/lib/share";
import { cpmCents, formatCurrency, formatDate, initials } from "@/lib/format";

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
  if (!shareSignatureValid(decodeURIComponent(externalId), sig)) notFound();

  const campaign = await prisma.campaign.findUnique({
    where: { externalId: decodeURIComponent(externalId) },
    include: { metrics: { orderBy: { date: "asc" }, take: 120 } },
  });
  if (!campaign) notFound();

  const series = campaign.metrics.map((m) => ({
    label: format(m.date, "MMM d"),
    views: m.views,
    reach: m.reach,
  }));
  const budgetPct = campaign.budgetCents
    ? Math.min(100, (campaign.spentCents / campaign.budgetCents) * 100)
    : 0;
  const cpm = cpmCents(campaign.spentCents, campaign.totalViews);

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
            label="Estimated reach"
            value={campaign.estimatedReach}
            format="compact"
            icon={<Users />}
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
            label="Effective CPM"
            value={cpm}
            format="currency"
            icon={<Gauge />}
            hint="per 1,000 views"
          />
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delivery</CardTitle>
            <CardDescription>Views and reach delivered by your creators.</CardDescription>
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
                  { key: "reach", label: "Reach", color: "hsl(199 89% 55%)" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {campaign.budgetCents > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xl font-semibold">
                    {formatCurrency(campaign.spentCents)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatCurrency(campaign.budgetCents)}
                  </span>
                </div>
                <Progress value={budgetPct} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">{budgetPct.toFixed(0)}% delivered</p>
              </CardContent>
            </Card>
          )}

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
