import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-inset ring-primary/25",
        className,
      )}
    >
      <Zap className="h-4 w-4 fill-current" />
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="text-sm font-semibold tracking-tight">
        Clip Catchers
        <span className="ml-1.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Client
        </span>
      </span>
    </span>
  );
}
