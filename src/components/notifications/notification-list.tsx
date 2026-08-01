"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, typeof Bell> = {
  CAMPAIGN_APPROVED: Sparkles,
  CAMPAIGN_RUNNING: PlayCircle,
  CAMPAIGN_COMPLETED: Trophy,
  INVOICE_PAID: CircleDollarSign,
  NEW_MESSAGE: MessageSquare,
  SYSTEM: Bell,
};

export function NotificationList({ initial }: { initial: NotificationRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [, startTransition] = useTransition();

  const visible = filter === "unread" ? items.filter((i) => !i.read) : items;
  const unreadCount = items.filter((i) => !i.read).length;

  async function markAll() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    toast.success("All caught up");
    startTransition(() => router.refresh());
  }

  async function clearRead() {
    const removed = items.filter((i) => i.read).length;
    setItems((prev) => prev.filter((i) => !i.read));
    await fetch("/api/notifications", { method: "DELETE" });
    toast.success(`${removed} notification${removed === 1 ? "" : "s"} cleared`);
    startTransition(() => router.refresh());
  }

  async function open(item: NotificationRow) {
    if (!item.read) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      await fetch(`/api/notifications/${item.id}`, { method: "PATCH" });
      startTransition(() => router.refresh());
    }
    if (item.link) router.push(item.link);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Campaign approvals, invoices and replies from our team will show up here."
        action={
          <Button asChild variant="outline">
            <Link href="/campaigns">Go to campaigns</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="inline-flex rounded-lg border border-border bg-card/60 p-1">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
              {value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 text-primary">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck />
              Mark all read
            </Button>
          )}
          {items.some((i) => i.read) && (
            <Button variant="ghost" size="sm" onClick={clearRead}>
              <Trash2 />
              Clear read
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={CheckCheck} title="Nothing unread" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {visible.map((item) => {
              const Icon = ICONS[item.type] ?? Bell;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => open(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") open(item);
                    }}
                    className={cn(
                      "flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-accent/40",
                      !item.read && "border-primary/25 bg-primary/[0.03]",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground/70">
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
