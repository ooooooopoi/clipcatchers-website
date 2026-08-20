"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Clock, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The clip list, made searchable.
 *
 * A client campaign runs to several hundred clips — Club 97 reached 495 — and
 * the report printed every one in a single unsorted column. That's not a list
 * anybody reads; it's a wall you scroll past. The questions a client actually
 * has are "which ones worked", "who posted them" and "is Instagram pulling
 * its weight", so those are the controls.
 *
 * Filtering happens here rather than on the server: the clips are already
 * loaded to draw the totals, and a round trip per keystroke would make it
 * feel worse, not better.
 */
export type ExplorerClip = {
  id: string;
  url: string;
  handle: string;
  platform: string;
  views: number;
  createdAt: string;
};

const PAGE = 25;

export function ClipsExplorer({ clips }: { clips: ExplorerClip[] }) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [sort, setSort] = useState<"views" | "recent">("views");
  const [shown, setShown] = useState(PAGE);

  const platforms = useMemo(
    () => Array.from(new Set(clips.map((c) => c.platform).filter(Boolean))).sort(),
    [clips],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = clips.filter(
      (c) =>
        (platform === "all" || c.platform === platform) &&
        (!q || c.handle.toLowerCase().includes(q)),
    );
    return rows.sort((a, b) =>
      sort === "views"
        ? b.views - a.views
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [clips, query, platform, sort]);

  const total = filtered.reduce((sum, c) => sum + c.views, 0);
  const visible = filtered.slice(0, shown);

  function reset(next: () => void) {
    next();
    setShown(PAGE);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => reset(() => setQuery(e.target.value))}
            placeholder="Search creators"
            aria-label="Search creators"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {platforms.length > 1 && (
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            {["all", ...platforms].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => reset(() => setPlatform(p))}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  platform === p
                    ? "bg-primary/10 text-primary-ink"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(
            [
              ["views", "Top", ArrowDownWideNarrow],
              ["recent", "Newest", Clock],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => reset(() => setSort(key))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sort === key
                  ? "bg-primary/10 text-primary-ink"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* The count reflects the filter, so a client can read "Instagram did
          1.8M across 69 clips" straight off the control rather than working
          it out. */}
      <p className="mt-3 text-xs text-muted-foreground">
        {filtered.length === clips.length
          ? `${formatNumber(clips.length)} clips · ${formatNumber(total)} views`
          : `${formatNumber(filtered.length)} of ${formatNumber(clips.length)} clips · ${formatNumber(total)} views`}
      </p>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No clips match that.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {visible.map((clip) => (
            <li
              key={clip.id}
              className="flex items-center justify-between gap-4 py-2.5 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {clip.handle ? `@${clip.handle}` : "Creator"}
                </p>
                {clip.platform && (
                  <p className="text-xs text-muted-foreground">{clip.platform}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-sm tabular-nums">
                  {formatNumber(clip.views)}
                  <span className="ml-1 text-xs text-muted-foreground">views</span>
                </span>
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-primary/30 hover:bg-accent"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {shown < filtered.length && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setShown((n) => n + PAGE)}
        >
          Show {Math.min(PAGE, filtered.length - shown)} more
        </Button>
      )}
    </div>
  );
}
