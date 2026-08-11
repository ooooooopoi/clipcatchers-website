import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { teamSignatureValid, shareSignature } from "@/lib/share";
import { fetchCampaigns, fetchStats } from "@/lib/bot";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Campaigns", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeamCampaignsPage({
  params,
}: {
  params: Promise<{ sig: string }>;
}) {
  const { sig } = await params;
  if (!teamSignatureValid(sig)) notFound();

  let rows: {
    id: number;
    name: string;
    active: number;
    budget: number;
    clips: number;
    spentCents: number;
    totalViews: number;
  }[] = [];
  let error: string | null = null;

  try {
    const [{ campaigns }, stats] = await Promise.all([fetchCampaigns(), fetchStats()]);
    const clipCounts = new Map(stats.campaigns.map((c) => [c.id, c.clips]));

    // Spend and views come from the mirrored campaigns, which carry the same
    // figures the client reports show — so the two can't disagree.
    const mirrored = await prisma.campaign.findMany({
      where: { externalId: { in: campaigns.map((c) => `bot-${c.id}`) } },
      select: { externalId: true, spentCents: true, totalViews: true },
    });
    const byExternal = new Map(mirrored.map((m) => [m.externalId, m]));

    rows = campaigns.map((c) => {
      const m = byExternal.get(`bot-${c.id}`);
      return {
        id: c.id,
        name: c.name,
        active: c.active,
        budget: c.budget ?? 0,
        clips: clipCounts.get(c.id) ?? 0,
        spentCents: m?.spentCents ?? 0,
        totalViews: m?.totalViews ?? 0,
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
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">
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

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every campaign, live and closed, with what it has spent.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>campaign</TableHead>
                <TableHead>status</TableHead>
                <TableHead className="text-right">clips</TableHead>
                <TableHead className="text-right">views</TableHead>
                <TableHead className="text-right">spent</TableHead>
                <TableHead className="text-right">budget</TableHead>
                <TableHead className="w-[180px]">progress</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const budgetCents = Math.round(c.budget * 100);
                const pct = budgetCents ? Math.min(100, (c.spentCents / budgetCents) * 100) : 0;
                const over = budgetCents > 0 && c.spentCents > budgetCents;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          c.active
                            ? "border-lime-500/30 bg-lime-500/10 text-lime-400"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {c.active ? "live" : "closed"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(c.clips)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(c.totalViews)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${over ? "text-amber-400" : ""}`}
                    >
                      {formatCurrency(c.spentCents)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {budgetCents ? formatCurrency(budgetCents) : "—"}
                    </TableCell>
                    <TableCell>
                      {budgetCents ? (
                        <div>
                          <Progress
                            value={pct}
                            className="h-2"
                            indicatorClassName={over ? "bg-amber-400" : undefined}
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {over
                              ? `over by ${formatCurrency(c.spentCents - budgetCents)}`
                              : `${pct.toFixed(0)}% · ${formatCurrency(budgetCents - c.spentCents)} left`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">no budget</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Link
                        href={`/team/${sig}/payouts?campaign=${c.id}`}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        payouts
                      </Link>
                      {shareSignature(`bot-${c.id}`) && (
                        <>
                          {" · "}
                          <a
                            href={`/c/bot-${c.id}/${shareSignature(`bot-${c.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline-offset-4 hover:underline"
                          >
                            report
                          </a>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Internal view — don&apos;t share this link.
        </footer>
      </div>
    </div>
  );
}
