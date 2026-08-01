import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarChart3, DollarSign, Eye, Gauge, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RangePicker } from "@/components/analytics/range-picker";
import { AreaTrend } from "@/components/charts/area-trend";
import { BarTrend } from "@/components/charts/bar-trend";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/lib/auth-helpers";
import { getAnalyticsData } from "@/lib/queries";
import { cpmCents, formatCompact, formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const range = ["7", "30", "90", "365"].includes(params.range ?? "") ? params.range! : "30";
  const data = await getAnalyticsData(user.id, Number(range));

  const hasData = data.totals.views > 0 || data.campaigns.length > 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Delivery, efficiency and per-campaign performance."
      >
        <Suspense fallback={<Skeleton className="h-9 w-64" />}>
          <RangePicker active={range} />
        </Suspense>
      </PageHeader>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Once your first campaign starts delivering, performance data lands here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index={0}
              label="Views"
              value={data.totals.views}
              format={formatCompact}
              icon={Eye}
              hint={`last ${range} days`}
            />
            <StatCard
              index={1}
              label="Reach"
              value={data.totals.reach}
              format={formatCompact}
              icon={Users}
              hint="unique accounts"
            />
            <StatCard
              index={2}
              label="Spend"
              value={Math.round(data.totals.spend * 100)}
              format={(n) => formatCurrency(n)}
              icon={DollarSign}
              hint={`last ${range} days`}
            />
            <StatCard
              index={3}
              label="Blended CPM"
              value={Math.round(data.totals.cpm * 100)}
              format={(n) => formatCurrency(n)}
              icon={Gauge}
              hint="cost per 1,000 views"
            />
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Views & reach</CardTitle>
              <CardDescription>Daily delivery across every active campaign.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <AreaTrend
                data={data.daily}
                height={300}
                keys={[
                  { key: "views", label: "Views", color: "hsl(var(--primary))" },
                  { key: "reach", label: "Reach", color: "hsl(199 89% 55%)" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Growth</CardTitle>
                <CardDescription>Views rolled up by period.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="daily">
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                  <TabsContent value="daily">
                    <BarTrend data={data.daily} dataKey="views" label="Views" />
                  </TabsContent>
                  <TabsContent value="weekly">
                    <BarTrend data={data.weekly} dataKey="views" label="Views" />
                  </TabsContent>
                  <TabsContent value="monthly">
                    <BarTrend data={data.monthly} dataKey="views" label="Views" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">CPM over time</CardTitle>
                <CardDescription>Cost per 1,000 views — lower is better.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2 pt-6">
                <AreaTrend
                  data={data.daily}
                  height={260}
                  valueFormatter={(n) => `$${n.toFixed(2)}`}
                  keys={[{ key: "cpm", label: "CPM", color: "hsl(38 92% 55%)" }]}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Campaign performance</CardTitle>
              <CardDescription>Every campaign, ranked by views delivered.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.campaigns.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No campaigns yet.</p>
              ) : (
                <>
                  <div className="mb-6">
                    <BarTrend
                      data={data.campaigns.slice(0, 6).map((c) => ({
                        label: c.name.length > 22 ? `${c.name.slice(0, 22)}…` : c.name,
                        views: c.totalViews,
                      }))}
                      dataKey="views"
                      label="Views"
                      layout="vertical"
                      height={Math.max(180, data.campaigns.slice(0, 6).length * 44)}
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Reach</TableHead>
                        <TableHead className="text-right">Spend</TableHead>
                        <TableHead className="text-right">CPM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="font-medium transition-colors hover:text-primary"
                            >
                              {campaign.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{campaign.brandName}</p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={campaign.status} />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(campaign.totalViews)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(campaign.estimatedReach)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(campaign.spentCents)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {campaign.totalViews
                              ? formatCurrency(cpmCents(campaign.spentCents, campaign.totalViews))
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
