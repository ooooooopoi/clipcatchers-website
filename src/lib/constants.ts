import type { CampaignStatus, InvoiceStatus, TicketStatus } from "@prisma/client";

export const CAMPAIGN_STATUS_META: Record<
  CampaignStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  APPROVED: {
    label: "Approved",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    dot: "bg-sky-400",
  },
  RUNNING: {
    label: "Running",
    className: "border-lime-500/30 bg-lime-500/10 text-lime-400",
    dot: "bg-lime-400",
  },
  PAUSED: {
    label: "Paused",
    className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    dot: "bg-zinc-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    dot: "bg-violet-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
  },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300" },
  OPEN: { label: "Due", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  PAID: { label: "Paid", className: "border-lime-500/30 bg-lime-500/10 text-lime-400" },
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
