"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { CampaignEditForm } from "@/components/team/campaign-edit-form";
import { BoardToggle, StatusToggle } from "@/components/team/campaign-toggles";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BotCampaign } from "@/lib/bot";

/**
 * One campaign row, assembled server-side.
 *
 * Carries the whole BotCampaign rather than the handful of columns the table
 * prints, because the row's edit sheet needs every field the form can change —
 * re-fetching them on open would mean a second bot round-trip per edit, and a
 * form that opens empty when that call fails. reportSig is minted server-side
 * too: it's an HMAC over INGEST_SECRET, which the browser must never hold.
 */
export type CampaignTableRow = {
  campaign: BotCampaign;
  clips: number;
  spentCents: number;
  totalViews: number;
  paidAds: boolean;
  reportSig: string | null;
};

/**
 * The campaigns list, with the editing pulled up into it.
 *
 * ── Why editing happens here and not on the detail page ──────────────────
 * The detail page loads every clip on the campaign to compute its figures —
 * the right cost when the question is "how is it doing", pure wait when the
 * question is "fix the budget". The edit sheet mounts the same form the detail
 * page uses on the row itself, so a rate tweak is: find the row, edit, save.
 *
 * ── Why the filters are client-side ──────────────────────────────────────
 * The rows are already all here — the page fetches the full list to render at
 * all, and the team's list is dozens of campaigns, not thousands. Filtering
 * in the browser makes the search instant and keeps the server page free of
 * query-param plumbing.
 */
export function CampaignsTable({ sig, rows }: { sig: string; rows: CampaignTableRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "live" | "closed">("all");
  const [board, setBoard] = useState<"all" | "ads" | "organic">("all");
  const [editing, setEditing] = useState<CampaignTableRow | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (status !== "all" && (r.campaign.active === 1) !== (status === "live")) return false;
    if (board !== "all" && r.paidAds !== (board === "ads")) return false;
    if (
      q &&
      !r.campaign.name.toLowerCase().includes(q) &&
      !(r.campaign.artist ?? "").toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or artist…"
            className="h-9 w-56 pl-9"
          />
        </div>
        <FilterGroup
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "live", label: "Live" },
            { value: "closed", label: "Closed" },
          ]}
        />
        <FilterGroup
          value={board}
          onChange={setBoard}
          options={[
            { value: "all", label: "Both boards" },
            { value: "ads", label: "Ads" },
            { value: "organic", label: "Organic" },
          ]}
        />
        {filtered.length !== rows.length ? (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {rows.length}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>campaign</TableHead>
              <TableHead>status</TableHead>
              <TableHead>board</TableHead>
              <TableHead className="text-right">clips</TableHead>
              <TableHead className="text-right">views</TableHead>
              <TableHead className="text-right">spent</TableHead>
              <TableHead className="text-right">budget</TableHead>
              <TableHead className="w-[180px]">progress</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                  No campaigns match.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const c = r.campaign;
                const budgetCents = Math.round((c.budget ?? 0) * 100);
                const pct = budgetCents ? Math.min(100, (r.spentCents / budgetCents) * 100) : 0;
                const over = budgetCents > 0 && r.spentCents > budgetCents;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <Link
                        href={`/team/${sig}/campaigns/${c.id}`}
                        className="underline-offset-4 hover:text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusToggle sig={sig} id={c.id} active={c.active === 1} />
                    </TableCell>
                    <TableCell>
                      <BoardToggle sig={sig} id={c.id} paidAds={r.paidAds} />
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(r.clips)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(r.totalViews)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${over ? "text-warning" : ""}`}>
                      {formatCurrency(r.spentCents)}
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
                            indicatorClassName={over ? "bg-warning" : undefined}
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {over
                              ? `over by ${formatCurrency(r.spentCents - budgetCents)}`
                              : `${pct.toFixed(0)}% · ${formatCurrency(budgetCents - r.spentCents)} left`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">no budget</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {/* Named in full rather than "edit". Sat among "edit ·
                          payouts · report" it read as a row action of the same
                          weight as the two links beside it, and the one control
                          on this page that changes a campaign was the hardest
                          of the three to find. */}
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                        edit campaign
                      </button>
                      {" · "}
                      <Link
                        href={`/team/${sig}/payouts?campaign=${c.id}`}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        payouts
                      </Link>
                      {r.reportSig && (
                        <>
                          {" · "}
                          <a
                            href={`/c/bot-${c.id}/${r.reportSig}`}
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
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Keyed by campaign so reopening on another row starts from that row's
          values instead of the previous form state; content unmounts on close,
          so a reopened sheet always reads the freshest row the server sent. */}
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-xl">
          {editing ? (
            <>
              <SheetHeader className="p-0">
                <SheetTitle>{editing.campaign.name}</SheetTitle>
                <SheetDescription>
                  Campaign #{editing.campaign.id} — saves only the fields you change.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5">
                <CampaignEditForm
                  key={editing.campaign.id}
                  sig={sig}
                  campaign={editing.campaign}
                  onDone={() => setEditing(null)}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 text-xs transition-colors",
            value === o.value
              ? "bg-foreground font-medium text-background"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
