"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ClipperNotice } from "@/lib/clipper-notifications";

/**
 * The notifications bell in the clipper shell.
 *
 * ── Why "seen" lives in the browser ──────────────────────────────────────
 * Read state is per-person-per-device and worth nothing to anyone else, so
 * storing it server-side would mean a write path, a migration and a bot
 * endpoint to carry information that does not matter if it is lost. The events
 * themselves are already delivered by Discord DM, which is the durable
 * channel; this panel is the place to look them up again, and a dot that
 * resets when someone clears their browser is a fair price for that.
 *
 * Seen is a set of notice ids rather than a last-opened timestamp, because
 * half of what is listed has no timestamp at all — "no payout method set" is
 * true until it isn't. Ids let a standing condition be dismissed once and stay
 * dismissed, while a genuinely new release still arrives unread.
 */
export function ClipperNotifications({
  base,
  userId,
  notices,
}: {
  base: string;
  userId: string;
  notices: ClipperNotice[];
}) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[] | null>(null);

  const key = `cc:seen-notices:${userId}`;

  // Read after mount, never during render: localStorage doesn't exist on the
  // server, and seeding state from it directly would hydrate a different tree
  // than the one the server sent.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setSeen(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      // Private mode, or someone else's JSON under our key. Treating it as
      // "nothing seen" shows a dot that shouldn't be there, which is a much
      // smaller failure than the panel not opening.
      setSeen([]);
    }
  }, [key]);

  // null until the effect runs, which is what keeps the badge off during the
  // first paint instead of flashing every notice as unread.
  const unread = useMemo(() => {
    if (seen === null) return 0;
    const known = new Set(seen);
    return notices.filter((n) => !known.has(n.id)).length;
  }, [notices, seen]);

  function markAllSeen() {
    const ids = notices.map((n) => n.id);
    setSeen(ids);
    try {
      // Only what's currently listed. Keeping ids for notices that have since
      // resolved would grow without bound, and a condition that comes back is
      // news again.
      window.localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // Unreadable storage already fell back to [] above; failing to write
      // just means the dot returns next visit.
    }
  }

  const standing = notices.filter((n) => n.at === null);
  const events = notices.filter((n) => n.at !== null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-[hsl(var(--border-strong))] hover:text-foreground"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // On close, not on open: the panel is the reading, so marking on
          // open would clear the badge before anything had been looked at.
          if (!next) markAllSeen();
        }}
      >
        {/* `dark` is repeated here on purpose. Sheet renders through a portal
            attached to document.body, which sits outside the .clipper-shell
            wrapper that scopes this subtree's dark variables — so without it
            the panel comes out white against a dark dashboard. */}
        <SheetContent
          side="right"
          className="dark w-full overflow-y-auto bg-background p-6 text-foreground sm:max-w-md"
        >
          <SheetHeader className="p-0">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              Everything waiting on you, and what's happened to your clips.
            </SheetDescription>
          </SheetHeader>

          {notices.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <Bell className="mx-auto h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">Nothing to report</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Campaign closes, payout releases and audit results show up here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {standing.length > 0 ? (
                <Group label="Waiting on you">
                  {standing.map((n) => (
                    <NoticeRow
                      key={n.id}
                      notice={n}
                      base={base}
                      mounted={seen !== null}
                      unread={seen !== null && !seen.includes(n.id)}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </Group>
              ) : null}

              {events.length > 0 ? (
                <Group label="Recent">
                  {events.map((n) => (
                    <NoticeRow
                      key={n.id}
                      notice={n}
                      base={base}
                      mounted={seen !== null}
                      unread={seen !== null && !seen.includes(n.id)}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </Group>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

const TONE = {
  good: { Icon: CircleCheck, className: "text-success" },
  warn: { Icon: CircleAlert, className: "text-warning" },
  plain: { Icon: Info, className: "text-muted-foreground" },
} as const;

function NoticeRow({
  notice,
  base,
  mounted,
  unread,
  onNavigate,
}: {
  notice: ClipperNotice;
  base: string;
  /** The effect has run, so client-only values are safe to render. */
  mounted: boolean;
  unread: boolean;
  onNavigate: () => void;
}) {
  const { Icon, className } = TONE[notice.tone];

  const inner = (
    <>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", className)} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium">{notice.title}</span>
          {unread ? (
            <span
              aria-label="Unread"
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            />
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
          {notice.body}
        </span>
        {notice.at !== null && mounted ? (
          <span className="mt-1 block text-xs text-muted-foreground/70">{ago(notice.at)}</span>
        ) : null}
      </span>
    </>
  );

  const shell = cn(
    "flex w-full gap-3 rounded-2xl border p-3 text-left transition-colors",
    unread ? "border-primary/30 bg-primary/[0.04]" : "border-border",
  );

  if (!notice.href) return <div className={shell}>{inner}</div>;

  return (
    <Link href={`${base}${notice.href}`} onClick={onNavigate} className={cn(shell, "hover:bg-accent")}>
      {inner}
    </Link>
  );
}

/**
 * Held back until after mount, which is what `mounted` gates.
 *
 * "2 days ago" computed during SSR is relative to the server's clock at render
 * time, and the browser re-computes it against its own a moment later. Near a
 * boundary — 59 minutes, 23 hours — the two disagree and React reports a
 * hydration mismatch on text nobody would think to suspect.
 */
function ago(unix: number) {
  const seconds = Math.max(0, Date.now() / 1000 - unix);
  const days = Math.floor(seconds / 86400);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `${hours}h ago`;
  const minutes = Math.floor(seconds / 60);
  return minutes >= 1 ? `${minutes}m ago` : "just now";
}
