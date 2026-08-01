"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { CAMPAIGN_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUSES = Object.keys(CAMPAIGN_STATUS_META) as (keyof typeof CAMPAIGN_STATUS_META)[];

export function CampaignFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status");
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const debounced = useDebounce(query, 320);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("query") ?? "";
    if (debounced === current) return;

    if (debounced) params.set("query", debounced);
    else params.delete("query");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
    // Only re-run when the debounced text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  function setStatus(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set("status", status);
    else params.delete("status");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search campaigns or brands…"
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setStatus(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !activeStatus
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatus(activeStatus === status ? null : status)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeStatus === status
                ? CAMPAIGN_STATUS_META[status].className
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {CAMPAIGN_STATUS_META[status].label}
          </button>
        ))}
      </div>
    </div>
  );
}
