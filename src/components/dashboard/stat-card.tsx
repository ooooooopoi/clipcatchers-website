"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Formatting is selected by name rather than by passing a function, and the
 * icon arrives as rendered JSX — neither functions nor component types can
 * cross the server/client boundary.
 */
export type StatFormat = "number" | "compact" | "currency";

const FORMATTERS: Record<StatFormat, (n: number) => string> = {
  number: formatNumber,
  compact: formatCompact,
  currency: (n) => formatCurrency(n),
};

function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

export function StatCard({
  label,
  value,
  format = "number",
  icon,
  trend,
  hint,
  note,
  index = 0,
}: {
  label: string;
  value: number;
  format?: StatFormat;
  icon: React.ReactNode;
  trend?: number;
  hint?: string;
  /** How the figure was arrived at, for anything that isn't a direct reading. */
  note?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const animated = useCountUp(value, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
    >
      <Card className="group relative overflow-hidden p-5 transition-colors hover:border-border/80">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 md:opacity-0" />
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {label}
            {note && (
              <Tooltip>
                {/* A button, not a bare icon: a figure that needs explaining
                    has to be reachable by keyboard, and on touch there's no
                    hover to reveal it. */}
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`How ${label} is calculated`}
                    className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[16rem] text-xs leading-relaxed">
                  {note}
                </TooltipContent>
              </Tooltip>
            )}
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/60 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        </div>

        <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">
          {FORMATTERS[format](Math.round(animated))}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {typeof trend === "number" && Number.isFinite(trend) && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                trend >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
        </div>
      </Card>
    </motion.div>
  );
}
