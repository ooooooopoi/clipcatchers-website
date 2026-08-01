"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "12 months" },
];

export function RangePicker({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex rounded-lg border border-border bg-card/60 p-1">
      {RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("range", range.value);
            router.replace(`${pathname}?${params.toString()}`);
          }}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            active === range.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
