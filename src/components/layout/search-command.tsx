"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LifeBuoy, Megaphone, Receipt, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ALL_NAV } from "@/lib/nav";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  type: "campaign" | "file" | "invoice" | "ticket";
  title: string;
  subtitle: string;
  href: string;
};

const TYPE_ICON = {
  campaign: Megaphone,
  file: FileText,
  invoice: Receipt,
  ticket: LifeBuoy,
} as const;

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const debounced = useDebounce(query, 220);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setHighlighted(0);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((data) => {
        if (!cancelled) {
          setResults(data.results ?? []);
          setHighlighted(0);
        }
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const navMatches = query.trim()
    ? ALL_NAV.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
    : ALL_NAV.slice(0, 6);

  const items = [
    ...navMatches.map((n) => ({
      id: n.href,
      type: "nav" as const,
      title: n.title,
      subtitle: "Go to page",
      href: n.href,
      icon: n.icon,
    })),
    ...results.map((r) => ({ ...r, icon: TYPE_ICON[r.type] })),
  ];

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[15%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0" hideClose>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlighted((i) => Math.min(i + 1, items.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlighted((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && items[highlighted]) {
                  e.preventDefault();
                  go(items[highlighted].href);
                }
              }}
              placeholder="Search campaigns, files, invoices, tickets…"
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
            {loading && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches for “{query}”.
              </p>
            )}
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    index === highlighted ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↑↓</kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↵</kbd>{" "}
              open
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">esc</kbd>{" "}
              close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
