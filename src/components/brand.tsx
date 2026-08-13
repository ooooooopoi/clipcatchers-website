import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Clip Catchers"
      width={64}
      height={64}
      priority
      className={cn(
        "h-8 w-8 rounded-lg object-cover ring-1 ring-inset ring-primary/25",
        className,
      )}
    />
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
