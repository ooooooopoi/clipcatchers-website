import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NewTicketDialog } from "@/components/support/new-ticket-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS_META } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireUser();

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "PENDING").length;

  return (
    <div>
      <PageHeader
        title="Support"
        description={
          tickets.length
            ? `${open} open · ${tickets.length} total ticket${tickets.length === 1 ? "" : "s"}`
            : "Questions, issues, requests — we're here."
        }
      >
        <NewTicketDialog />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="No tickets yet"
              description="Open a ticket and our team will reply within one business day."
              action={<NewTicketDialog />}
            />
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => {
                const meta = TICKET_STATUS_META[ticket.status];
                return (
                  <Link key={ticket.id} href={`/support/${ticket.id}`} className="block">
                    <Card className="p-4 transition-colors hover:border-border/90 hover:bg-accent/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{ticket.subject}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {ticket._count.messages} message
                            {ticket._count.messages === 1 ? "" : "s"} ·{" "}
                            {formatRelative(ticket.updatedAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Before you write in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">When do views update?</p>
              <p className="mt-1">
                Every 6 hours for running campaigns. Fresh clips can take a day to register.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">How fast is approval?</p>
              <p className="mt-1">
                Usually within one business day of submitting the brief and assets.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Can I change a live campaign?</p>
              <p className="mt-1">
                Yes — edit the brief or budget anytime, or pause it while you rework things.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
