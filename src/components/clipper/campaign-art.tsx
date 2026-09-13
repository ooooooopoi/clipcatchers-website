"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A campaign's banner, with the type treatment as the real fallback.
 *
 * ── Why the fallback is not a placeholder ────────────────────────────────
 * Banners are stored as Discord attachment URLs, and those carry an expiring
 * `?ex=&is=&hm=` signature — they 404 once it lapses. At the time of writing
 * exactly one of twenty-three campaigns had a banner stored and that URL was
 * already dead, so the honest default for this grid is "no usable picture".
 *
 * That makes the no-image case the common one rather than the exception, so it
 * is designed rather than apologised for: the campaign name set large on a
 * tinted field, which reads fine and looks deliberate. An image, when one
 * actually loads, is an improvement on that — not a requirement for the grid
 * to look right.
 *
 * The error handler is why this is a client component. A server-rendered
 * <Image> has nowhere to catch a dead upstream, and would leave a blank or
 * broken box; here a failed load simply reveals the type underneath.
 */
export function CampaignArt({
  src,
  name,
  /** Varies the tint per campaign so a grid of fallbacks isn't one flat block. */
  seed,
}: {
  src: string;
  name: string;
  seed: number;
}) {
  const [failed, setFailed] = useState(false);
  const usable = src.trim().length > 0 && !failed;

  // Kept inside the blue family the dark theme already uses, just rotated a
  // little, so the grid stays on-brand rather than turning into confetti.
  const hue = 200 + ((seed * 37) % 45);

  return (
    <div
      className="relative aspect-[16/10] overflow-hidden"
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 45% 14%), hsl(${hue + 15} 55% 9%))`,
      }}
    >
      {usable ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-5">
          <span className="display text-center text-xl leading-tight text-foreground/80">
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
