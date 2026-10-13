import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The logo tile.
 *
 * Since the 2026-10-13 icon there is one artwork for every background. The
 * new icon is a self-contained blue tile with its own transparent rounded
 * corners, so it reads the same on the black public site and on the white
 * dashboard. The old mark was a white square, which on black looked like a
 * sticker; that is why `onDark` used to swap in a cut-out copy on a near-black
 * tile with an inset ring, and none of that workaround is needed any more.
 *
 * `onDark` is still accepted so the public pages that pass it keep compiling,
 * but it is deliberately not read. The rounding stays as a guard, so that if
 * the file is ever swapped for a square-cornered export it still sits in the
 * header as a tile rather than a hard-edged block.
 */
export function BrandMark({ className }: { className?: string; onDark?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="Clip Catchers"
      width={64}
      height={64}
      priority
      className={cn("h-8 w-8 rounded-lg object-cover", className)}
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
