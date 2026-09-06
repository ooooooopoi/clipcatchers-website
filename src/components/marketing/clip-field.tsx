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
 * Rows avoid 3-5 on purpose. That band is where the headline sits, and a cell
 * brightening directly behind display type reads as a rendering fault rather
 * than as atmosphere. These sit above it, around the eyebrow, and below it,
 * around the buttons and the proof strip.
 *
 * ── On the number of them ───────────────────────────────────────────────
 * Six was too quiet. On a 19s loop that is one visible read every three
 * seconds across the whole width, which at a glance is a still page with an
 * occasional flicker rather than a page with something going on.
 *
 * Sixteen is closer to honest as well as livelier: there are 4,640 clips
 * being polled, so several being read at once is what actually happens.
 *
 * Each one keeps its own duration rather than sharing a single 19s cycle.
 * With one duration the whole field silently repeats every 19 seconds, and
 * once a viewer catches that it stops reading as activity and starts reading
 * as a loop. Durations that don't divide into each other take a very long
 * time to line up again.
 */
const READS = [
  { col: 2, row: 0, delay: "3.1s", dur: "17s" },
  { col: 4, row: 1, delay: "5.5s", dur: "21s" },
  { col: 7, row: 2, delay: "12.8s", dur: "14s" },
  { col: 11, row: 0, delay: "1.4s", dur: "23s" },
  { col: 15, row: 1, delay: "2.6s", dur: "19s" },
  { col: 19, row: 2, delay: "9.7s", dur: "16s" },
  { col: 24, row: 0, delay: "15.2s", dur: "22s" },
  { col: 28, row: 1, delay: "14.4s", dur: "18s" },
  { col: 33, row: 2, delay: "6.3s", dur: "25s" },
  { col: 1, row: 6, delay: "0s", dur: "20s" },
  { col: 5, row: 8, delay: "8.9s", dur: "15s" },
  { col: 9, row: 7, delay: "11.2s", dur: "24s" },
  { col: 14, row: 9, delay: "4.7s", dur: "18s" },
  { col: 21, row: 6, delay: "8.1s", dur: "26s" },
  { col: 26, row: 8, delay: "13.6s", dur: "13s" },
  { col: 31, row: 7, delay: "7.2s", dur: "21s" },
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
            // Overrides the 19s in the stylesheet. Set here rather than there
            // because the point is that no two are the same — a shared
            // duration makes the whole field repeat on one visible cycle.
            animationDuration: r.dur,
          }}
        />
      ))}
    </div>
  );
}
