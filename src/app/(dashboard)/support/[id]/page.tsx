import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { TicketThread } from "@/components/support/ticket-thread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS_META } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ticket" };
export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      attachments: true,
    },
  });
  if (!ticket) notFound();

  const meta = TICKET_STATUS_META[ticket.status];

  return (
    <div>
      <Link
        href="/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All tickets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Opened {formatDate(ticket.createdAt)} · priority {ticket.priority.toLowerCase()}
          </p>
        </div>
        <span
          className={cn("rounded-full border px-3 py-1 text-xs font-medium", meta.className)}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TicketThread
            ticketId={ticket.id}
            status={ticket.status}
            initialMessages={ticket.messages.map((m) => ({
              id: m.id,
              body: m.body,
              fromStaff: m.fromStaff,
              createdAt: m.createdAt.toISOString(),
              authorName: m.author.name,
            }))}
          />
        </div>

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            {ticket.attachments.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No files attached.</p>
            ) : (
              <ul className="space-y-2">
                {ticket.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={`/api/files/${file.id}/raw?download=1`}
                      className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 transition-colors hover:border-border hover:bg-accent/40"
                    >
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{file.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatBytes(file.sizeBytes)}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
