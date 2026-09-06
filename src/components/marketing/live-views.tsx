"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The views figure, ticking at the rate we actually deliver.
 *
 * ── What this number is, exactly ────────────────────────────────────────
 * `initial` is read from the database and is true at the moment the page was
 * rendered. `perSecond` is real delivery over the last 30 days divided by the
 * seconds in 30 days. Everything after the first paint is those two
 * multiplied out — a projection, not a reading.
 *
 * That is a deliberate trade and it needs defending, because this site's whole
 * argument is that its figures are logged rather than invented. The defence:
 * views genuinely do accrue every second out on TikTok and Instagram. The
 * database only learns about it when the bot's loop comes round, every 15
 * minutes at best and hourly per clip in practice, and the page then caches
 * that for an hour. So the honest choice isn't between a true number and an
 * estimated one — it's between an estimate that moves and a figure that is on
 * average half an hour stale and pretending otherwise.
 *
 * What keeps it honest is that the caption under the band says so, and the
 * rate is measured rather than picked to look good. If the delivery rate is
 * ever hardcoded to make the counter livelier, this stops being defensible.
 *
 * ── Why full precision ──────────────────────────────────────────────────
 * The tile used to read "136.2M". At that rounding a tick of a few views a
 * second is invisible for hours — it would take about 100,000 views to move
 * the first decimal. A counter nobody can see counting is just a slower way
 * of being static, so this renders every digit.
 */
export function LiveViews({
  initial,
  perSecond,
}: {
  initial: number;
  perSecond: number;
}) {
  const [views, setViews] = useState(initial);

  // The server-rendered value and the moment it was true. Kept in a ref so a
  // re-render can't restart the clock and make the number jump backwards.
  const anchor = useRef({ value: initial, at: Date.now() });

  // A new `initial` means a real refresh landed. Re-anchor on it: the counter
  // snaps back to a read figure rather than drifting away from one forever.
  useEffect(() => {
    anchor.current = { value: initial, at: Date.now() };
    setViews(initial);
  }, [initial]);

  useEffect(() => {
    if (perSecond <= 0) return;

    // Reduced motion gets the anchor figure and no movement. Someone who has
    // asked the OS to stop things moving should not be handed a counter.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still.matches) return;

    // Recomputed from elapsed wall-clock rather than incremented, so a
    // backgrounded tab that stops firing timers catches up on return instead
    // of showing a number that silently fell behind.
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - anchor.current.at) / 1000;
      setViews(anchor.current.value + Math.floor(elapsed * perSecond));
    }, 1000);

    return () => window.clearInterval(id);
  }, [perSecond]);

  return (
    // tabular-nums so the digits don't shuffle sideways on every tick.
    // aria-live is deliberately off: a figure that changes every second would
    // make a screen reader unusable. The number is decorative movement over a
    // value that is announced correctly on load.
    <span className="tabular-nums" aria-live="off">
      {/* Locale pinned. A bare toLocaleString() formats with the ambient
          locale, which is Node's on the server and the visitor's in the
          browser — 136,240,182 against 136.240.182 — and React would flag the
          difference as a hydration mismatch on the first paint. */}
      {views.toLocaleString("en-US")}
    </span>
  );
}
