import Link from "next/link";
import type { CampaignStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CAMPAIGN_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ORDER: CampaignStatus[] = [
  "RUNNING",
  "APPROVED",
  "PENDING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

export function StatusOverview({
  counts,
  total,
}: {
  counts: Record<CampaignStatus, number | undefined>;
  total: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Campaign status</CardTitle>
        <CardDescription>Where each campaign sits right now.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No campaigns yet.{" "}
            <Link href="/campaigns/new" className="text-primary underline-offset-4 hover:underline">
              Create your first
            </Link>
            .
          </p>
        )}

        {total > 0 &&
          ORDER.map((status) => {
            const count = counts[status] ?? 0;
            const pct = total ? (count / total) * 100 : 0;
            const meta = CAMPAIGN_STATUS_META[status];
            return (
              <Link
                key={status}
                href={`/campaigns?status=${status}`}
                className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {count} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", meta.dot)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
      </CardContent>
    </Card>
  );
}
