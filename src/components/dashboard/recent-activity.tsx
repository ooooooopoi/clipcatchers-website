import Link from "next/link";
import { FileText, LifeBuoy, Megaphone, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/lib/queries";

const ICONS = {
  campaign: Megaphone,
  invoice: Receipt,
  ticket: LifeBuoy,
  file: FileText,
} as const;

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>The latest across your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Activity will show up here as your campaigns move.
          </p>
        ) : (
          <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-border">
            {items.map((item) => {
              const Icon = ICONS[item.kind];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="relative flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                  >
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1 pt-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.detail} · {formatRelative(item.at)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
