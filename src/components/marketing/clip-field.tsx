import { cn } from "@/lib/utils";

/**
 * The background of the marketing pages.
 *
 * It was a 56px square grid — graph paper, the same one behind the auth
 * screens, and it said nothing about what this company does. This is the same
 * restraint pointed at the subject instead: a field of 9:16 cells, the shape
 * of every clip the business is paid for, with a handful of them filling and
 * fading as if being read off their live post.
 *
 * That last part is the only claim the decoration makes, and it happens to be
 * a true one — views are polled hourly per clip. If that ever stops being how
 * the product works, this should go, because then it would just be movement.
 *
 * No JavaScript: the grid is two repeating gradients and the reads are CSS
 * keyframes, so this stays a server component and costs nothing to hydrate.
 */

/**
 * Positions are cell indices, not pixels — multiplied up against the same
 * 36x64 the background uses so each read lands inside a cell rather than
 * straddling a rule. Both this and the gradient are anchored to the
 * container's top-left, which is what keeps them aligned as the page resizes.
 *
 * Columns stay low enough that three are still on screen at 375px. The delays
 * are deliberately not evenly spaced: an even stagger reads as a loading
 * animation, and this is meant to read as weather.
 *
 * Rows avoid 2-5 on purpose. That band is where the headline sits, and a cell
 * brightening directly behind display type reads as a rendering fault rather
 * than as atmosphere. These sit above it, around the eyebrow, and below it,
 * around the buttons and the proof strip.
 */
const READS = [
  { col: 4, row: 1, delay: "5.5s" },
  { col: 15, row: 0, delay: "2.6s" },
  { col: 28, row: 1, delay: "14.4s" },
  { col: 1, row: 6, delay: "0s" },
  { col: 9, row: 7, delay: "11.2s" },
  { col: 21, row: 6, delay: "8.1s" },
] as const;

export function ClipField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-clipfield" />
      {READS.map((r) => (
        <span
          key={`${r.col}-${r.row}`}
          className="clip-read"
          style={{
            // +1px clears the rule itself, so the fill sits in the cell
            // rather than on top of its own left border.
            left: `calc(${r.col} * 36px + 1px)`,
            top: `calc(${r.row} * 64px + 1px)`,
            animationDelay: r.delay,
          }}
        />
      ))}
    </div>
  );
}
