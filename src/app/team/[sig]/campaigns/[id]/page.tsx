import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clapperboard, Coins, DollarSign, Eye, Gauge, Users } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { StatCard } from "@/components/dashboard/stat-card";
import { GrowthChart } from "@/components/team/growth-chart";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { teamSignatureValid, shareSignature } from "@/lib/share";
import { fetchCampaignClips } from "@/lib/bot";
import { effectiveCpm } from "@/lib/pricing";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Campaign",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * One campaign, in the numbers the team runs it on.
 *
 * ── Internal only, deliberately ──────────────────────────────────────────
 * This page shows what a campaign cost *us* — clipper spend, what has been
 * paid out, and the CPM those produce. That is our cost of delivery, not what
 * the client was invoiced, and the two are not the same number. It belongs
 * behind the team signature and nowhere else: none of these figures may be
 * copied onto a client report or a marketing page. The client's own view of
 * this campaign is /c/<externalId>/<sig>, which shows delivery without cost.
 *
 * ── The two view counts ──────────────────────────────────────────────────
 * They are genuinely different numbers and the gap is the point.
 *
 *   payable   (clips.views)                 what clippers were paid on.
 *                                           Frozen when a campaign closes or
 *                                           is trimmed to budget.
 *   delivered (MAX(views, reach_views))     what the clips actually went on to
 *                                           do. Keeps climbing after close,
 *                                           recorded but never re-priced.
 *
 * On a live campaign they match. On a closed one, delivered − payable is reach
 * we never paid for, which is why the effective CPM is shown on both bases:
 * the payable one is the rate we contracted at, the delivered one is what a
 * view actually ended up costing.
 */
export default async function TeamCampaignPage({
  params,
}: {
  params: Promise<{ sig: string; id: string }>;
}) {
  const { sig, id } = await params;
  if (!teamSignatureValid(sig)) notFound();
  if (!/^\d+$/.test(id)) notFound();
  const campaignId = Number(id);

  let data: Awaited<ReturnType<typeof fetchCampaignClips>> | null = null;
  let error: string | null = null;
  try {
    data = await fetchCampaignClips(campaignId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Couldn't reach the bot.";
  }

  const externalId = `bot-${campaignId}`;

  // Daily history for this campaign only. The snapshot holds one row per
  // campaign per day, so filtering by id gives this campaign's own curve;
  // GrowthChart's carry-forward then applies to a single series.
  const [snapshot, mirrored] = await Promise.all([
    prisma.botSnapshot.findUnique({ where: { id: "latest" } }),
    prisma.campaign.findUnique({
      where: { externalId },
      select: { spentCents: true, totalViews: true },
    }),
  ]);
  const allRows = ((snapshot?.data ?? {}) as { snapshots?: Record<string, unknown>[] }).snapshots ?? [];
  const rows = allRows.filter((r) => Number(r.campaign_id ?? -1) === campaignId);

  const clips = data?.clips ?? [];
  // `earned` is already 0 for anything not approved and above min_views, so
  // these sums need no status filter of their own -- and can't drift from
  // /payouts, which computes earnings from the same expression.
  const paidCents = Math.round(clips.reduce((s, c) => s + (c.paid ? (c.earned ?? 0) : 0), 0) * 100);
  const unpaidCents = Math.round(
    clips.reduce((s, c) => s + (c.paid ? 0 : (c.earned ?? 0)), 0) * 100,
  );

  const approved = clips.filter((c) => c.status === "approved");
  const pendingClips = clips.filter((c) => c.status === "pending").length;
  const payableViews = approved.reduce((s, c) => s + (c.views ?? 0), 0);
  const deliveredViews = approved.reduce((s, c) => s + Math.max(c.views ?? 0, c.delivered ?? 0), 0);
  const creators = new Set(approved.map((c) => c.handle).filter(Boolean)).size;

  /**
   * Budget consumed, taken from the mirror rather than summed here.
   *
   * `earned` is approved-only (EARNED_SQL gates on status='approved'), but a
   * campaign's budget is consumed by approved *and* pending clips — a
   * submitted clip nobody has reviewed yet is money about to be owed, and the
   * bot counts it that way precisely so a campaign can't keep selling budget
   * it has already spoken for. Summing `earned` therefore understates spend by
   * whatever is sitting in the review queue: on GREEN HOUR that was 40 pending
   * clips worth $56.32, and this page said $1,043.62 where the campaigns list
   * and the client's own report both said $1,099.94.
   *
   * The mirror is the figure those two already agree on, so it is the one used
   * here for spend, for budget progress and for the CPM. The gap is surfaced
   * as "In review" below rather than left as an unexplained discrepancy
   * between three pages.
   */
  const spentCents = mirrored?.spentCents ?? paidCents + unpaidCents;
  const pendingCents = Math.max(0, spentCents - paidCents - unpaidCents);

  const cpmPayable = effectiveCpm(spentCents, payableViews);
  const cpmDelivered = effectiveCpm(spentCents, deliveredViews);

  const budgetDollars = data?.campaign.budget ?? 0;
  const budgetCents = Math.round(budgetDollars * 100);
  const budgetPct = budgetCents ? Math.min(100, (spentCents / budgetCents) * 100) : 0;
  const over = budgetCents > 0 && spentCents > budgetCents;
  const freeReach = deliveredViews - payableViews;

  const reportSig = shareSignature(externalId);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandWordmark />
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-warning">
            Team — internal
          </span>
        </header>

        <Link
          href={`/team/${sig}/campaigns`}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Campaigns
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {data?.campaign.name ?? `Campaign ${campaignId}`}
          </h1>
          {data && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                data.campaign.active
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border text-muted-foreground"
              }`}
            >
              {data.campaign.active ? "live" : "closed"}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>What this campaign has delivered and what it has cost us.</span>
          <Link
            href={`/team/${sig}/payouts?campaign=${campaignId}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            payouts
          </Link>
          {reportSig && (
            <a
              href={`/c/${externalId}/${reportSig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              client report ↗
            </a>
          )}
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {data && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                index={0}
                label="Total views"
                value={payableViews}
                format="compact"
                icon={<Eye />}
                hint="payable — what clippers were paid on"
              />
              <StatCard
                index={1}
                label="Reach views"
                value={deliveredViews}
                format="compact"
                icon={<Users />}
                hint={
                  freeReach > 0
                    ? `${formatNumber(freeReach)} beyond what was paid for`
                    : "matches payable while the campaign is live"
                }
                note="Delivered views, read from the live posts. A closed campaign's clips keep gathering views that are recorded but never re-priced, so this climbs after payable stops."
              />
              <StatCard
                index={2}
                label="Amount paid"
                value={paidCents}
                format="currency"
                icon={<DollarSign />}
                hint={
                  unpaidCents > 0
                    ? `${formatCurrency(unpaidCents)} still unpaid`
                    : "everything earned has been paid out"
                }
              />
              <StatCard
                index={3}
                label="Effective CPM"
                value={Math.round(cpmPayable * 100)}
                format="currency"
                icon={<Gauge />}
                hint={
                  deliveredViews > payableViews
                    ? `$${cpmDelivered.toFixed(2)} against reach`
                    : "cost per 1,000 views"
                }
                note="Our cost per 1,000 payable views — spend divided by the views it was charged on, not the list rate. Internal: this is what delivery cost us, not what a client pays."
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                index={4}
                label="Unpaid"
                value={unpaidCents}
                format="currency"
                icon={<Coins />}
                note="Approved and earned but not yet sent. Measured before the per-clipper payout minimum, so it runs slightly ahead of the Owed figure on the payouts page, which only counts balances large enough to pay out."
              />
              <StatCard
                index={5}
                label="In review"
                value={pendingCents}
                format="currency"
                icon={<Clapperboard />}
                hint={pendingClips > 0 ? `${formatNumber(pendingClips)} clips waiting` : "queue is clear"}
                note="What the clips still awaiting review will be worth once approved. It already counts against the budget — a campaign that ignored its review queue would keep selling budget it had spoken for."
              />
              <StatCard
                index={6}
                label="Total spend"
                value={spentCents}
                format="currency"
                icon={<DollarSign />}
                hint={budgetCents ? `of ${formatCurrency(budgetCents)} budget` : "no budget cap"}
                note="Budget consumed: paid, unpaid and in review together. The same figure the campaigns list and the client's own report show, taken from the same mirrored row so the three can't disagree."
              />
              <StatCard
                index={7}
                label="Clips"
                value={approved.length}
                format="number"
                icon={<Clapperboard />}
                hint={
                  clips.length > approved.length
                    ? `${formatNumber(clips.length - approved.length)} not approved`
                    : "all approved"
                }
              />
              <StatCard
                index={8}
                label="Creators"
                value={creators}
                format="number"
                icon={<Users />}
                hint="with an approved clip here"
              />
            </div>

            {budgetCents > 0 && (
              <Card className="mt-4 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold">Budget</h2>
                  <span className={`font-mono text-sm ${over ? "text-warning" : "text-muted-foreground"}`}>
                    {over
                      ? `over by ${formatCurrency(spentCents - budgetCents)}`
                      : `${formatCurrency(budgetCents - spentCents)} left`}
                  </span>
                </div>
                <Progress
                  value={budgetPct}
                  className="mt-3 h-3"
                  indicatorClassName={over ? "bg-warning" : undefined}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {budgetPct.toFixed(1)}% of budget committed — {formatCurrency(paidCents)} paid,{" "}
                  {formatCurrency(unpaidCents)} still to send
                  {pendingCents > 0 ? `, ${formatCurrency(pendingCents)} in review` : ""}.
                </p>
              </Card>
            )}

            <GrowthChart rows={rows} />
          </>
        )}

        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Internal view — shows our cost of delivery. Don&apos;t share this link or these figures.
        </footer>
      </div>
    </div>
  );
}
