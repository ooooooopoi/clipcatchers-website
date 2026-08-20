import type { CampaignStatus, InvoiceStatus, TicketStatus } from "@prisma/client";

// Every badge carried a 400-level text colour, which is a dark-theme value.
// On the white client report that lands near 2:1 against its own tint —
// readable on a bright monitor and nowhere else. Each now has a light value
// with a dark override.
//
// RUNNING uses the brand orange rather than lime: it's the state a client
// looks for first, and it matched neither the logo nor the LIVE pill on the
// campaign card in Discord.
export const CAMPAIGN_STATUS_META: Record<
  CampaignStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  RUNNING: {
    label: "Running",
    className: "border-primary/30 bg-primary/10 text-primary-ink",
    dot: "bg-primary",
  },
  PAUSED: {
    label: "Paused",
    className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300" },
  OPEN: { label: "Due", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  PAID: { label: "Paid", className: "border-lime-600/30 bg-lime-600/10 text-lime-700 dark:text-lime-400" },
  VOID: { label: "Void", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400" },
  UNCOLLECTIBLE: {
    label: "Uncollectible",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
  },
};

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "border-lime-500/30 bg-lime-500/10 text-lime-400" },
  PENDING: { label: "Awaiting you", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  RESOLVED: { label: "Resolved", className: "border-sky-500/30 bg-sky-500/10 text-sky-400" },
  CLOSED: { label: "Closed", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400" },
};

/**
 * Reach is modelled, not measured.
 *
 * The bot derives it as 72% of views (cogs/client_sync.py) — a flat
 * assumption about how many of a video's views come from distinct accounts.
 * No platform reports it to us. Views, by contrast, are read from the live
 * post per clip. Anywhere reach is shown to a client it carries this note, so
 * the one number we model is never mistaken for one we counted.
 */
export const REACH_LABEL = "Modelled reach";

export const REACH_NOTE =
  "An estimate, not a measurement: 72% of delivered views, on the assumption that most views come from distinct accounts. Views themselves are read directly from each live post.";
