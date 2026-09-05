import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Coins, Eye, Megaphone, Users, Wallet } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { ClipActions } from "@/components/team/clip-actions";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { teamSignatureValid } from "@/lib/share";
import { formatCompact, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Team", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type Snapshot = {
  campaigns?: Row[];
  clips?: Row[];
  clippers?: Row[];
  accounts?: Row[];
  invites?: Row[];
};

const SHEETS = [
  { key: "campaigns", label: "Campaigns" },
  { key: "clips", label: "Clips" },
  { key: "clippers", label: "Clippers" },
  { key: "accounts", label: "Accounts" },
  { key: "invites", label: "Invites" },
] as const;

/** Columns that read better as money, counts, or status pills. */
const MONEY = new Set(["earned", "owed", "paid", "budget", "rate_amount"]);
const COUNTS = new Set(["views", "approved_views", "clips", "clippers", "min_views", "max_views"]);

function cellFor(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (key === "status") {
    const v = String(value);
    const tone =
      v === "approved"
        ? "border-success/30 bg-success/10 text-success"
        : v === "pending"
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-destructive/30 bg-destructive/10 text-destructive";
    return (
      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", tone)}>{v}</span>
    );
  }
  if (key === "url") {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline"
      >
        open ↗
      </a>
    );
  }
  if ((key === "paid" || key === "verified" || key === "active") && (value === 0 || value === 1)) {
    return value === 1 ? "✅" : "—";
  }
  if (typeof value === "number") {
    if (MONEY.has(key)) return <span className="font-mono">${value.toFixed(2)}</span>;
    if (COUNTS.has(key)) return <span className="font-mono">{formatNumber(value)}</span>;
    return <span className="font-mono">{value}</span>;
  }
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function SheetTable({
  rows,
  sig,
  withActions,
}: {
  rows: Row[];
  sig?: string;
  withActions?: boolean;
}) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No rows yet.
      </p>
    );
  }
  const columns = Object.keys(rows[0]);
  return (
    <div className="rounded-xl border border-border">
      <div className="max-h-[65vh] overflow-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c} className="whitespace-nowrap">
                  {c.replace(/_/g, " ")}
                </TableHead>
              ))}
              {withActions && <TableHead className="whitespace-nowrap">review</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c} className="whitespace-nowrap text-sm">
                    {cellFor(c, row[c])}
                  </TableCell>
                ))}
                {withActions && sig && (
                  <TableCell className="whitespace-nowrap">
                    <ClipActions
                      sig={sig}
                      clipId={String(row.id)}
                      status={String(row.status ?? "pending")}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ sig: string }> }) {
  const { sig } = await params;
  if (!teamSignatureValid(sig)) notFound();

  const snapshot = await prisma.botSnapshot.findUnique({ where: { id: "latest" } });
  const data = (snapshot?.data ?? {}) as Snapshot;

  const clips = data.clips ?? [];
  const clippers = data.clippers ?? [];
  const campaigns = data.campaigns ?? [];

  const totals = {
    views: clips.reduce(
      (s, c) => s + (c.status === "approved" ? Number(c.views ?? 0) : 0),
      0,
    ),
    owed: clippers.reduce((s, c) => s + Number(c.owed ?? 0), 0),
    paid: clippers.reduce((s, c) => s + Number(c.paid ?? 0), 0),
    clippers: clippers.length,
    campaigns: campaigns.length,
  };

  // Approved only: a pending clip's view count isn't something to celebrate
  // before anyone has checked it's a real submission.
  const topClips = clips
    .filter((c) => c.status === "approved")
    .sort((a, b) => Number(b.views ?? 0) - Number(a.views ?? 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandWordmark />
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-warning">
            Team — internal
          </span>
        </header>

        <div className="mt-8">
          <h1 className="text-2xl font-semibold tracking-tight">Everything</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mirrored from the Discord bot
            {snapshot ? ` · updated ${formatDateTime(snapshot.updatedAt)}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/team/${sig}/payouts`}
              className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              💸 Payouts
            </Link>
            <Link
              href={`/team/${sig}/campaigns`}
              className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              📣 Campaigns
            </Link>
          </div>
        </div>

        {!snapshot && (
          <p className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            No data yet — run <code className="font-mono">/sync-dashboard</code> in Discord to push
            the first snapshot.
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={<Eye />} label="Approved views" value={formatCompact(totals.views)} />
          <Stat icon={<Megaphone />} label="Campaigns" value={String(totals.campaigns)} />
          <Stat icon={<Users />} label="Clippers" value={String(totals.clippers)} />
          <Stat icon={<Coins />} label="Owed" value={`$${totals.owed.toFixed(2)}`} accent />
          <Stat icon={<Wallet />} label="Paid out" value={`$${totals.paid.toFixed(2)}`} />
        </div>

        {topClips.length > 0 && (
          <Card className="mt-4 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">Most viewed clips</h2>
              <span className="text-xs text-muted-foreground">approved only</span>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {topClips.map((clip, index) => (
                <li
                  key={String(clip.id ?? index)}
                  className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">
                      {["🥇", "🥈", "🥉"][index] ?? index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {clip.handle ? `@${clip.handle}` : "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {String(clip.campaign ?? "")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 font-mono text-sm tabular-nums">
                    <span>{formatCompact(Number(clip.views ?? 0))}</span>
                    <span className="text-muted-foreground">
                      ${Number(clip.earned ?? 0).toFixed(2)}
                    </span>
                    {clip.url ? (
                      <a
                        href={String(clip.url)}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Watch
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Tabs defaultValue="campaigns" className="mt-8">
          <TabsList>
            {SHEETS.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {(data[s.key] ?? []).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {SHEETS.map((s) => (
            <TabsContent key={s.key} value={s.key}>
              <SheetTable
                rows={data[s.key] ?? []}
                sig={sig}
                withActions={s.key === "clips"}
              />
            </TabsContent>
          ))}
        </Tabs>

        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Internal view — contains payout addresses and Discord IDs. Don&apos;t share this link.
        </footer>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/60 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold tracking-tight",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
