import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Coins, Users } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { MarkPaid } from "@/components/team/mark-paid";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teamSignatureValid } from "@/lib/share";
import { fetchCampaigns, fetchPayouts } from "@/lib/bot";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Payouts", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PayoutsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sig: string }>;
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { sig } = await params;
  if (!teamSignatureValid(sig)) notFound();

  const { campaign } = await searchParams;
  const campaignId = campaign && /^\d+$/.test(campaign) ? Number(campaign) : undefined;

  let payouts;
  let campaigns: { id: number; name: string; active: number }[] = [];
  let error: string | null = null;
  try {
    [payouts, { campaigns }] = await Promise.all([
      fetchPayouts(campaignId, true),
      fetchCampaigns(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Couldn't reach the bot.";
  }

  // Same destination across accounts is worth seeing before money moves.
  const destinations = new Map<string, string[]>();
  for (const c of payouts?.clippers ?? []) {
    if (!c.address) continue;
    const who = c.handle ? `@${c.handle}` : `user ${c.user_id}`;
    destinations.set(c.address, [...(destinations.get(c.address) ?? []), who]);
  }
  const shared = [...destinations.entries()].filter(([, who]) => who.length > 1);

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

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved clips above the minimum that haven&apos;t been paid yet.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {payouts && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              <FilterLink sig={sig} active={!campaignId} label="All campaigns" />
              {campaigns.map((c) => (
                <FilterLink
                  key={c.id}
                  sig={sig}
                  campaignId={c.id}
                  active={campaignId === c.id}
                  label={c.name}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat icon={<Coins />} label="Owed" value={formatCurrency(payouts.total_owed * 100)} />
              <Stat icon={<Users />} label="Clippers" value={String(payouts.clippers_owed)} />
              <Stat
                icon={<AlertTriangle />}
                label="No payout method"
                value={String(payouts.without_payout_method)}
                warn={payouts.without_payout_method > 0}
              />
            </div>

            {shared.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                <p className="font-medium">
                  {shared.length} payout destination{shared.length > 1 ? "s are" : " is"} shared by
                  more than one account
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  {shared.map(([address, who]) => (
                    <li key={address}>
                      <span className="font-mono">{address}</span> — {who.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-border">
              <div className="max-h-[65vh] overflow-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>clipper</TableHead>
                      <TableHead className="text-right">owed</TableHead>
                      <TableHead className="text-right">clips</TableHead>
                      <TableHead className="text-right">views</TableHead>
                      <TableHead>method</TableHead>
                      <TableHead>address</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.clippers.map((c) => (
                      <TableRow key={c.user_id}>
                        <TableCell className="whitespace-nowrap font-medium">
                          {c.handle ? `@${c.handle}` : `user ${c.user_id}`}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono">
                          {formatCurrency(c.owed * 100)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{c.clips}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(c.views)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {c.method ?? <span className="text-red-400">not set</span>}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate font-mono text-xs">
                          {c.address ?? <span className="text-red-400">not set</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.payout_set ? (
                            <MarkPaid
                              sig={sig}
                              userId={c.user_id}
                              campaignId={campaignId ?? null}
                              amount={c.owed}
                              label={c.handle ? `@${c.handle}` : `user ${c.user_id}`}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">no method</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {payouts.clippers.length === 0 && (
              <p className="mt-4 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                Nothing owed here.
              </p>
            )}
          </>
        )}

        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Internal view — contains payout addresses. Don&apos;t share this link.
        </footer>
      </div>
    </div>
  );
}

function FilterLink({
  sig,
  campaignId,
  active,
  label,
}: {
  sig: string;
  campaignId?: number;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={campaignId ? `/team/${sig}/payouts?campaign=${campaignId}` : `/team/${sig}/payouts`}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function Stat({
  icon,
  label,
  value,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={warn ? "text-amber-400" : "text-muted-foreground"}>{icon}</span>
      </div>
      <p className={`mt-2 font-mono text-2xl font-semibold ${warn ? "text-amber-400" : ""}`}>
        {value}
      </p>
    </Card>
  );
}
