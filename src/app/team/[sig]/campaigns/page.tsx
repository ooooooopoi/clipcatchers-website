import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { CampaignsTable, type CampaignTableRow } from "@/components/team/campaigns-table";
import { prisma } from "@/lib/prisma";
import { teamSignatureValid, shareSignature } from "@/lib/share";
import { fetchCampaigns, fetchStats } from "@/lib/bot";
import { isPaidAds } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Campaigns", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeamCampaignsPage({
  params,
}: {
  params: Promise<{ sig: string }>;
}) {
  const { sig } = await params;
  if (!teamSignatureValid(sig)) notFound();

  let rows: CampaignTableRow[] = [];
  let error: string | null = null;

  try {
    const [{ campaigns }, stats] = await Promise.all([fetchCampaigns(), fetchStats()]);
    const clipCounts = new Map(stats.campaigns.map((c) => [c.id, c.clips]));

    // Spend and views come from the mirrored campaigns, which carry the same
    // figures the client reports show — so the two can't disagree.
    //
    // Allowed to fail on its own. The bot has already returned every campaign
    // by this point and the mirror only enriches two columns, so letting it
    // throw here would blank the whole list — and a rotated Neon endpoint
    // looks exactly like the bot being down, which is the wrong thing to go
    // looking at.
    const mirrored = await prisma.campaign
      .findMany({
        where: { externalId: { in: campaigns.map((c) => `bot-${c.id}`) } },
        select: { externalId: true, spentCents: true, totalViews: true },
      })
      .catch(() => [] as { externalId: string; spentCents: number; totalViews: number }[]);
    const byExternal = new Map(mirrored.map((m) => [m.externalId, m]));

    rows = campaigns.map((c) => {
      const m = byExternal.get(`bot-${c.id}`);
      return {
        // The whole record, not the columns printed: the row's edit sheet
        // opens on the fields behind the campaign, and re-fetching them per
        // edit would be a bot round-trip that can fail with the sheet open.
        campaign: c,
        clips: clipCounts.get(c.id) ?? 0,
        spentCents: m?.spentCents ?? 0,
        totalViews: m?.totalViews ?? 0,
        // The same predicate the clipper boards use, so this column cannot
        // disagree with the board a clipper actually sees.
        paidAds: isPaidAds(c),
        // Minted here because it's an HMAC over INGEST_SECRET, which stays
        // server-side.
        reportSig: shareSignature(`bot-${c.id}`) || null,
      };
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Couldn't reach the bot.";
  }

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
          href={`/team/${sig}`}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Everything
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every campaign, live and closed, with what it has spent.
            </p>
          </div>
          <Link
            href={`/team/${sig}/campaigns/new`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New campaign
          </Link>
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <CampaignsTable sig={sig} rows={rows} />

        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Internal view — don&apos;t share this link.
        </footer>
      </div>
    </div>
  );
}
