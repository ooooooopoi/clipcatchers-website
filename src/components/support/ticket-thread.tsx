"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  body: string;
  fromStaff: boolean;
  createdAt: string;
  authorName: string;
};

export function TicketThread({
  ticketId,
  status,
  initialMessages,
}: {
  ticketId: string;
  status: string;
  initialMessages: ThreadMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);

    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't send your reply.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: data.message.id,
        body: data.message.body,
        fromStaff: false,
        createdAt: data.message.createdAt,
        authorName: data.message.author?.name ?? "You",
      },
    ]);
    setBody("");
    router.refresh();
  }

  async function resolve() {
    setResolving(true);
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setResolving(false);

    if (!res.ok) {
      toast.error("Couldn't update the ticket.");
      return;
    }
    toast.success("Ticket marked resolved");
    router.refresh();
  }

  const closed = status === "RESOLVED" || status === "CLOSED";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
          >
            <Card
              className={cn(
                "p-4",
                message.fromStaff ? "border-primary/25 bg-primary/[0.04]" : "",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className={cn(
                      "text-[10px]",
                      message.fromStaff && "bg-primary/20 text-primary",
                    )}
                  >
                    {message.fromStaff ? "CC" : initials(message.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {message.fromStaff ? "Clip Catchers Support" : message.authorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={closed ? "Replying will reopen this ticket…" : "Write a reply…"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ⌘↵
            </kbd>{" "}
            to send
          </p>
          <div className="flex items-center gap-2">
            {!closed && (
              <Button variant="outline" size="sm" loading={resolving} onClick={resolve}>
                <CheckCircle2 />
                Mark resolved
              </Button>
            )}
            <Button size="sm" loading={sending} disabled={!body.trim()} onClick={send}>
              <Send />
              Send reply
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
