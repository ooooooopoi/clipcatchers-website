import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The logo tile. `onDark` is for the black public site: the same mark cut out
 * of its white square (logo-mark.png) on a near-black tile, because a white
 * square on black reads as a sticker. Everywhere else keeps the original
 * opaque file — with a transparent one, the inset ring that the opaque image
 * has always covered would start showing on the white dashboard.
 */
export function BrandMark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Image
      src={onDark ? "/logo-mark.png" : "/logo.png"}
      alt="Clip Catchers"
      width={64}
      height={64}
      priority
      className={cn(
        "h-8 w-8 rounded-lg object-cover ring-1 ring-inset",
        onDark ? "bg-card ring-border" : "ring-primary/25",
        className,
      )}
    />
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="wordmark text-base">
        Clip Catchers
        {/* The badge keeps its own smaller size and normal tracking. It labels
            the wordmark, it isn't part of it, and letting it inherit made the
            name and its qualifier read as one string. */}
        <span className="ml-1.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Client
        </span>
      </span>
    </span>
  );
}
