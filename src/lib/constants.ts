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

export const PLAN_META = {
  STARTER: {
    label: "Starter",
    priceCents: 29900,
    tagline: "One live campaign, core analytics.",
    features: ["1 active campaign", "Core analytics", "5 GB asset storage", "Email support"],
  },
  GROWTH: {
    label: "Growth",
    priceCents: 79900,
    tagline: "Scale to a full campaign slate.",
    features: [
      "5 active campaigns",
      "Advanced analytics + CPM",
      "50 GB asset storage",
      "Priority support",
      "Dedicated strategist",
    ],
  },
  SCALE: {
    label: "Scale",
    priceCents: 199900,
    tagline: "Unlimited volume, white-glove service.",
    features: [
      "Unlimited campaigns",
      "Custom reporting",
      "500 GB asset storage",
      "24/7 support",
      "Dedicated account team",
    ],
  },
} as const;
