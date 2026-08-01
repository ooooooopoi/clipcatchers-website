import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DollarSign, Eye, Megaphone, PlusCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusOverview } from "@/components/dashboard/status-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingUpdates } from "@/components/dashboard/upcoming-updates";
import { AreaTrend } from "@/components/charts/area-trend";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth-helpers";
import { getDashboardData } from "@/lib/queries";
import { formatCompact, formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const firstName = user.name.split(" ")[0];
  const budgetPct = data.totals.budgetCents
    ? Math.min(100, (data.totals.spentCents / data.totals.budgetCents) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here's how your campaigns are performing across every platform."
      >
        <Button asChild>
          <Link href="/campaigns/new">
            <PlusCircle />
            New campaign
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Active campaigns"
          value={data.totals.active}
          format="number"
          icon={<Megaphone />}
          hint={`${data.totals.campaigns} total`}
        />
        <StatCard
          index={1}
          label="Total views"
          value={data.totals.views}
          format="compact"
          icon={<Eye />}
          trend={data.viewsTrend}
          hint="vs. previous 15 days"
        />
        <StatCard
          index={2}
          label="Estimated reach"
          value={data.totals.reach}
          format="compact"
          icon={<Users />}
          hint="unique accounts"
        />
        <StatCard
          index={3}
          label="Budget spent"
          value={data.totals.spentCents}
          format="currency"
          icon={<DollarSign />}
          hint={`of ${formatCurrency(data.totals.budgetCents)} allocated`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Performance</CardTitle>
                <CardDescription>Views and reach over the last 30 days.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/analytics">
                  Full analytics
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <AreaTrend
              data={data.series}
              keys={[
                { key: "views", label: "Views", color: "hsl(var(--primary))" },
                { key: "reach", label: "Reach", color: "hsl(199 89% 55%)" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <StatusOverview counts={data.statusCounts} total={data.totals.campaigns} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Budget</CardTitle>
              <CardDescription>Spend against everything allocated.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-semibold">
                  {formatCurrency(data.totals.spentCents)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {formatCurrency(data.totals.budgetCents)}
                </span>
              </div>
              <Progress value={budgetPct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {budgetPct.toFixed(0)}% of allocated budget used
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RecentActivity items={data.activity} />
        <QuickActions />
        <UpcomingUpdates
          campaigns={data.upcoming}
          nextInvoice={data.nextInvoice}
          plan={data.plan}
          planRenewsAt={data.planRenewsAt}
        />
      </div>

      {data.campaigns.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Latest campaigns</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/campaigns">
                  View all
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.campaigns.map((campaign) => {
              const pct = campaign.budgetCents
                ? Math.min(100, (campaign.spentCents / campaign.budgetCents) * 100)
                : 0;
              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-3 transition-colors hover:border-border hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{campaign.name}</span>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {campaign.brandName}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-mono font-medium">{formatCompact(campaign.totalViews)}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                    <div className="hidden w-32 sm:block">
                      <Progress value={pct} className="h-1.5" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(campaign.spentCents)} of{" "}
                        {formatCurrency(campaign.budgetCents)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
