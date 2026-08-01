import Link from "next/link";
import type { Campaign, Invoice, Plan } from "@prisma/client";
import { CalendarClock, CreditCard, Flag, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { PLAN_META } from "@/lib/constants";

export function UpcomingUpdates({
  campaigns,
  nextInvoice,
  plan,
  planRenewsAt,
}: {
  campaigns: Campaign[];
  nextInvoice: Invoice | null;
  plan: Plan;
  planRenewsAt: Date | null;
}) {
  const rows = [
    ...campaigns.map((c) => ({
      key: `c-${c.id}`,
      icon: Flag,
      title: `${c.name} wraps`,
      detail: formatDate(c.endDate),
      href: `/campaigns/${c.id}`,
    })),
    ...(nextInvoice
      ? [
          {
            key: `i-${nextInvoice.id}`,
            icon: CreditCard,
            title: `${nextInvoice.number} due`,
            detail: `${formatCurrency(nextInvoice.amountCents)} · ${formatDate(nextInvoice.dueAt)}`,
            href: "/billing",
          },
        ]
      : []),
    ...(planRenewsAt
      ? [
          {
            key: "plan",
            icon: RefreshCw,
            title: `${PLAN_META[plan].label} plan renews`,
            detail: formatDate(planRenewsAt),
            href: "/billing",
          },
        ]
      : []),
  ].slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Upcoming</CardTitle>
        <CardDescription>Dates worth keeping an eye on.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Nothing scheduled yet.
          </div>
        ) : (
          <ul className="space-y-1">
            {rows.map(({ key, icon: Icon, title, detail, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
