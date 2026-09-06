import { cn } from "@/lib/utils";

/**
 * The background of the marketing pages.
 *
 * Points of light, thinning out down the page so the hero carries the most of
 * it and the argument below is left alone. Drawn in --foreground, so it is
 * dark specks on the white theme and an actual starfield on the dark one.
 *
 * No JavaScript and no images: absolutely positioned dots and one keyframe,
 * so this stays a server component and costs nothing to hydrate.
 */

/**
 * Positions come from a seeded generator rather than Math.random.
 *
 * Two reasons. A random field would be different on every render, so a page
 * that re-renders would visibly reshuffle its own sky. And the same call on
 * the server and the client would disagree, which React reports as a
 * hydration mismatch — this is a server component today, but the moment
 * anyone adds "use client" above it that would start biting, and a bug that
 * only appears after an unrelated edit is the worst kind.
 *
 * mulberry32: small, fast, and good enough that the output doesn't visibly
 * clump or band, which a naive LCG does.
 */
function seeded(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_COUNT = 90;

const STARS = (() => {
  const rand = seeded(20260906);
  return Array.from({ length: STAR_COUNT }, () => {
    // Weighted small. An even spread of sizes reads as a polka dot pattern;
    // mostly-tiny with a few larger ones reads as depth.
    const roll = rand();
    const size = roll > 0.94 ? 2.5 : roll > 0.78 ? 1.75 : 1;

    // Bigger points sit brighter, which is the whole of the depth trick.
    const dim = size === 2.5 ? 0.4 : size === 1.75 ? 0.3 : 0.22;

    return {
      // Percentages, so the field stretches with the viewport instead of
      // clustering at the left edge on a wide screen.
      left: +(rand() * 100).toFixed(3),
      top: +(rand() * 100).toFixed(3),
      size,
      dim,
      lit: +(dim * 2.4).toFixed(3),
      // Long and uneven. On one shared duration the entire sky pulses in
      // time, which is the moment it stops looking like a sky.
      dur: +(7 + rand() * 9).toFixed(2),
      delay: +(rand() * 12).toFixed(2),
    };
  });
})();

export function StarField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 overflow-hidden starfield",
        className,
      )}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            // Read by the twinkle keyframes. Set per star so each one breathes
            // between its own two points rather than every star sharing one
            // range, which flattens the depth the sizes are there to create.
            ["--star-dim" as string]: s.dim,
            ["--star-lit" as string]: s.lit,
            // Reduced motion never runs the animation, so without this the
            // stars would sit at the browser default of fully opaque.
            opacity: s.dim,
          }}
        />
      ))}
    </div>
  );
}
