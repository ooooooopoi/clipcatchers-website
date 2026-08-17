import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarRange,
  Clapperboard,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Info,
  MessageSquare,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { AreaTrend } from "@/components/charts/area-trend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  initials,
} from "@/lib/format";
import { REACH_LABEL, REACH_NOTE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id }, select: { name: true } });
  return { title: campaign?.name ?? "Campaign" };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      metrics: { orderBy: { date: "asc" } },
      clips: { orderBy: [{ views: "desc" }, { externalId: "desc" }], take: 200 },
      files: { orderBy: { createdAt: "desc" } },
    },
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

  return (
    <div>
      <Link
        href="/campaigns"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All campaigns
      </Link>

      <div className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {campaign.brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.brandLogoUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/20 to-primary/5 text-base font-semibold text-primary">
              {initials(campaign.brandName)}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {campaign.brandName}
              {campaign.goal ? ` · ${campaign.goal}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {campaign.platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        <CampaignActions
          id={campaign.id}
          name={campaign.name}
          status={campaign.status}
          variant="buttons"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Eye} label="Total views" value={formatNumber(campaign.totalViews)} />
        <Metric
          icon={Users}
          label={REACH_LABEL}
          value={formatNumber(campaign.estimatedReach)}
          note={REACH_NOTE}
        />
        <Metric
          icon={DollarSign}
          label="Spent"
          value={formatCurrency(campaign.spentCents)}
          sub={`of ${formatCurrency(campaign.budgetCents)}`}
        />
        <Metric
          icon={Clapperboard}
          label="Clips"
          value={formatNumber(campaign.clipCount)}
          sub="approved and live"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delivery</CardTitle>
            <CardDescription>
              Views recorded for this campaign, with modelled reach alongside.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {series.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Performance data appears once the campaign starts delivering.
              </p>
            ) : (
              <AreaTrend
                data={series}
                keys={[
                  { key: "views", label: "Views", color: "hsl(var(--primary))" },
                  { key: "reach", label: REACH_LABEL, color: "hsl(199 89% 55%)" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
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
                    <span className="font-medium">{budgetPct.toFixed(1)}% used</span>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={CalendarRange} label="Start" value={formatDate(campaign.startDate)} />
              <Row icon={CalendarRange} label="End" value={formatDate(campaign.endDate)} />
              <Row icon={CalendarRange} label="Created" value={formatDate(campaign.createdAt)} />
              {campaign.website && (
                <a
                  href={campaign.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="truncate">{campaign.website}</span>
                </a>
              )}
              {campaign.discord && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="truncate">{campaign.discord}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clips</CardTitle>
          <CardDescription>
            Every approved clip running on this campaign. Open any one to see the live post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.clips.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Approved clips appear here as creators post them.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {campaign.clips.map((clip) => (
                <li
                  key={clip.id}
                  className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {clip.handle ? `@${clip.handle}` : "Creator"}
                    </p>
                    {clip.platform && (
                      <p className="text-xs text-muted-foreground">{clip.platform}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-sm tabular-nums">
                      {formatNumber(clip.views)}
                      <span className="ml-1 text-xs text-muted-foreground">views</span>
                    </span>
                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {campaign.description || "No description provided."}
              </p>
            </div>
            {campaign.notes && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {campaign.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Assets</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/files">Manage</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {campaign.files.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No assets attached to this campaign.
              </p>
            ) : (
              <ul className="space-y-2">
                {campaign.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={`/api/files/${file.id}/raw`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 transition-colors hover:border-border hover:bg-accent/40"
                    >
                      {file.mimeType.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/files/${file.id}/raw`}
                          alt=""
                          className="h-9 w-9 rounded border border-border object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded border border-border bg-background">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{file.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {file.kind.toLowerCase().replace("_", " ")} · {formatBytes(file.sizeBytes)}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  note,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  sub?: string;
  /** How the figure was arrived at, for anything that isn't a direct reading. */
  note?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {label}
          {note && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`How ${label} is calculated`}
                  className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[16rem] text-xs leading-relaxed">
                {note}
              </TooltipContent>
            </Tooltip>
          )}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/60">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </span>
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}
