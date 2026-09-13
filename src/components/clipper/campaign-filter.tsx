"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type CampaignType = "all" | "active" | "ended";

const OPTIONS: { value: CampaignType; label: string }[] = [
  { value: "all", label: "All campaigns" },
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
];

/**
 * The Type filter above the campaign grid.
 *
 * A native <select> rather than a custom menu: it is one control, it is
 * keyboard- and screen-reader-correct for free, and on a phone it opens the
 * platform picker instead of a list that has to be scrolled inside a card.
 * The chevron is drawn alongside and the select laid over it transparently, so
 * it looks like the rest of the UI without any of the behaviour being
 * reimplemented.
 *
 * Filtering happens on the server off the `type` search param, so the state
 * survives a refresh and can be linked to.
 */
export function CampaignFilter({
  value,
  base,
}: {
  value: CampaignType;
  base: string;
}) {
  const router = useRouter();
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm">
      <span className="text-muted-foreground">Type:</span>
      <span className="font-medium">{current.label}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <select
        aria-label="Filter campaigns by type"
        value={value}
        onChange={(e) => {
          const next = e.target.value as CampaignType;
          router.push(next === "all" ? base : `${base}?type=${next}`);
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
