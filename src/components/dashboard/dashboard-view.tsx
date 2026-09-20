import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info, PlusCircle } from "lucide-react";
import { AreaTrend } from "@/components/charts/area-trend";
import { StatusBadge } from "@/components/campaigns/status-badge";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatusOverview } from "@/components/dashboard/status-overview";
import { UpcomingUpdates } from "@/components/dashboard/upcoming-updates";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import { REACH_LABEL, REACH_NOTE } from "@/lib/constants";
import type { getDashboardData } from "@/lib/queries";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

/**
 * The client's overview.
 *
 * ── Why it doesn't look like the rest of the dashboard used to ───────────
 * This page opened with "Good morning, Alex" over four identical icon tiles:
 * the arrangement every admin template ships with, and one where views, reach,
 * spend and campaign count all shout at the same volume. A client opens this
 * to answer one question — is my campaign spreading, and what has it cost —
 * and four equal tiles answer it no faster than a table would.
 *
 * So there is one loud thing. Delivered views is the product itself: the offer
 * is that you pay for views that actually landed, so that figure is the whole
 * report and everything else is context for it. It is set in the site's own
 * display face rather than a dashboard numeral, because the marketing site has
 * a voice — heavy, uppercase, tight — and the product behind the login had
 * been speaking in a different one.
 *
 * Everything under the hero is deliberately quiet: rules instead of cards, one
 * weight of type, figures in mono. Boldness spent twice is boldness wasted.
 *
 * ── On money ─────────────────────────────────────────────────────────────
 * Spend here is what the client is billed, not what we pay clippers — the bot
 * prefers an explicit invoice, then the client budget scaled by delivery, and
 * only falls back to the clipper figure when neither is set. Because of that
 * last fallback there is deliberately no cost-per-view or CPM anywhere on this
 * page: derived from a fallback it would quote our own cost back to the client
 * as their price.
 */
export function DashboardView({ data }: { data: DashboardData }) {
  const { totals } = data;
  const budgetPct = totals.budgetCents
    ? Math.min(100, (totals.spentCents / totals.budgetCents) * 100)
    : 0;
  const trend = Math.round(data.viewsTrend);

  // Nothing to report yet. The alternative is a page-high "0" over an empty
  // chart and five zeroed tiles, which reads as a broken dashboard rather than
  // a new account — this is the first thing a client sees after signing up, so
  // it says what to do instead of reporting nothing in six places.
  if (totals.campaigns === 0) return <NoCampaignsYet />;

  return (
    <div>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">Across every campaign</p>
          {/* The figure and its unit are one phrase, so they share a line-height
              and sit as a block. `display` carries leading of its own. */}
          <p className="display mt-3 text-6xl sm:text-7xl lg:text-8xl">
            {formatCompact(totals.views)}
          </p>
          <p className="display-sm mt-2 text-lg text-muted-foreground sm:text-xl">
            Views delivered
          </p>

          {totals.views > 0 && (
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-sm">
              <span
                className={
                  trend >= 0 ? "font-mono font-medium text-success" : "font-mono font-medium text-warning"
                }
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-muted-foreground">
                last 15 days against the 15 before
              </span>
            </p>
          )}
        </div>

        {/* Black fill, like every primary action on the public site. The
            dashboard had been using the accent blue, which made the one button
            that creates work look like a link. */}
        <Link
          href="/campaigns/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New campaign
        </Link>
      </header>

      {/* The curve belongs to the number above it, so it sits in the same
          block under a rule rather than in a card of its own. */}
      <section className="mt-8 border-t border-border pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="eyebrow text-muted-foreground">Last 30 days</h2>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Full analytics
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="-ml-2 mt-2">
          <AreaTrend
            data={data.series}
            keys={[
              { key: "views", label: "Views", color: "hsl(var(--foreground))" },
              { key: "reach", label: REACH_LABEL, color: "hsl(var(--primary))" },
            ]}
          />
        </div>
      </section>

      {/* Three figures, no card chrome. Rules carry the grouping; the type does
          the rest. */}
      <section className="mt-2 grid border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
        <Figure
          label={REACH_LABEL}
          value={formatCompact(totals.reach)}
          // Short enough to keep the three columns the same shape. The full
          // caveat is real and has to stay reachable, but set inline it ran to
          // four lines and dragged the row out of rhythm — so it sits behind
          // the marker, where someone questioning the number will look.
          note="Estimated, not measured"
          info={REACH_NOTE}
          className="sm:pr-6"
        />
        <Figure
          label="Spend"
          value={formatCurrency(totals.spentCents)}
          note={
            totals.budgetCents
              ? `${budgetPct.toFixed(0)}% of ${formatCurrency(totals.budgetCents)} budget`
              : "No budget set"
          }
          className="sm:px-6"
        >
          {totals.budgetCents > 0 && <Progress value={budgetPct} className="mt-3 h-1" />}
        </Figure>
        <Figure
          label="Campaigns live"
          value={formatNumber(totals.active)}
          note={`${formatNumber(totals.campaigns)} in total`}
          className="sm:pl-6"
        />
      </section>

      <ViewsByCampaign byViews={data.byViews} total={totals.views} />

      {data.campaigns.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <h2 className="display-sm text-sm">Recently updated</h2>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              All campaigns
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <ul>
            {data.campaigns.map((campaign) => {
              const pct = campaign.budgetCents
                ? Math.min(100, (campaign.spentCents / campaign.budgetCents) * 100)
                : 0;
              return (
                <li key={campaign.id}>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="group flex flex-wrap items-center gap-4 border-b border-border px-1 py-4 transition-colors hover:bg-accent/40"
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
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium">
                          {formatCompact(campaign.totalViews)}
                        </p>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                      <div className="hidden w-32 sm:block">
                        <Progress value={pct} className="h-1" />
                        <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                          {formatCurrency(campaign.spentCents)} / {formatCurrency(campaign.budgetCents)}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* The modules that were competing with the headline. Same data, kept
          where someone goes looking for it rather than where it interrupts. */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <StatusOverview counts={data.statusCounts} total={totals.campaigns} />
        <RecentActivity items={data.activity} />
        <UpcomingUpdates campaigns={data.upcoming} />
      </div>
    </div>
  );
}

function NoCampaignsYet() {
  return (
    <div className="mx-auto max-w-2xl py-16 sm:py-24">
      <p className="eyebrow text-muted-foreground">No campaigns yet</p>
      {/* The imperative, not the absence. "Nothing to report" is accurate and
          useless: it describes the account back to someone who already knows,
          where the screen's one job is to say what happens next. */}
      <h1 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl">Brief the network</h1>
      <p className="mt-6 max-w-lg text-muted-foreground">
        Set a budget, hand over the track and the rules, and hundreds of creators cut from
        it. You pay for the views that land — and they appear here as they do.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Start a campaign
        </Link>
        <Link
          href="/support"
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Talk to us first
        </Link>
      </div>

      {/* The exit for someone who is in the wrong dashboard entirely.
          A clipper signed in with Discord never reaches this page — the layout
          sends them to /me. But one who signed in with Google or an email has
          no discord id on the session, so nothing marks them as a clipper and
          they land here: on a brand's empty dashboard, being invited to brief
          a creator network. This is the only screen that person sees, so it
          has to be the one that offers the way out. */}
      <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        Clipping for us rather than running a campaign?{" "}
        <Link
          href="/me"
          className="text-foreground underline underline-offset-4 hover:text-primary-ink"
        >
          Your clipper dashboard is here
        </Link>{" "}
        — sign in with Discord to reach it.
      </p>
    </div>
  );
}

function Figure({
  label,
  value,
  note,
  info,
  className,
  children,
}: {
  label: string;
  value: string;
  note: string;
  /** The long version, behind a marker beside the label. */
  info?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`py-5 ${className ?? ""}`}>
      <p className="eyebrow flex items-center gap-1.5 text-muted-foreground">
        {label}
        {info ? (
          <Tooltip>
            <TooltipTrigger
              aria-label={`About ${label.toLowerCase()}`}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3 w-3" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs font-normal normal-case tracking-normal">
              {info}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      {children}
    </div>
  );
}

/**
 * Which campaigns produced the views, as one bar.
 *
 * A client running several campaigns at once cannot tell from a total which of
 * them is carrying the result — and that is the thing that decides where the
 * next budget goes. Stacked rather than a pie because the comparison that
 * matters is against the whole, and rendered in steps of the ink rather than
 * in colours so it stays a ledger and not a chart.
 *
 * `byViews` is the top six. Anything past that is summed into a remainder so
 * the bar always represents the real total instead of quietly rescaling to
 * whatever happened to be listed.
 */
function ViewsByCampaign({
  byViews,
  total,
}: {
  byViews: DashboardData["byViews"];
  total: number;
}) {
  // One campaign is not a split, and no campaigns is not a bar.
  if (byViews.length < 2 || total <= 0) return null;

  const listed = byViews.reduce((sum, c) => sum + c.totalViews, 0);
  const remainder = Math.max(0, total - listed);
  const segments = [
    ...byViews.map((c, i) => ({
      key: String(c.id),
      name: c.name,
      views: c.totalViews,
      // Descending ink, floored well above the page so the smallest block is
      // still a block. The remainder sits below that floor on purpose — it's
      // the one segment that isn't a campaign.
      shade: Math.max(0.35, 1 - i * 0.13),
    })),
    ...(remainder > 0
      ? [{ key: "other", name: "Everything else", views: remainder, shade: 0.2 }]
      : []),
  ];

  return (
    <section className="mt-10">
      <h2 className="eyebrow text-muted-foreground">Where the views came from</h2>

      {/* Separated blocks rather than one continuous bar. Butted together, the
          steps of ink read as a single dark smear at this height and the split
          — the whole point of the thing — disappears. The gaps let the page
          through and turn it back into countable pieces. */}
      <div className="mt-3 flex h-3 w-full gap-1">
        {segments.map((s) => (
          <div
            key={s.key}
            className="rounded-sm"
            style={{
              width: `${(s.views / total) * 100}%`,
              backgroundColor: `hsl(var(--foreground) / ${s.shade})`,
            }}
            title={`${s.name} — ${formatCompact(s.views)} views`}
          />
        ))}
      </div>

      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {segments.map((s) => (
          <li key={s.key} className="flex items-baseline gap-2 text-sm">
            <span
              aria-hidden="true"
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: `hsl(var(--foreground) / ${s.shade})` }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.name}</span>
            <span className="font-mono text-xs tabular-nums">
              {Math.round((s.views / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
