"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The background of the marketing pages: drifting points, joined by lines
 * where they come near each other.
 *
 * ── Why this is a canvas and not CSS ────────────────────────────────────
 * The previous version was pure CSS — absolutely positioned dots and one
 * keyframe, no JavaScript, a server component. Lines between points that are
 * currently close to each other can't be done that way: it needs every pair's
 * distance recomputed every frame, which is a loop. So this costs a client
 * component and a rAF loop where the old one cost nothing, and the rest of
 * this file is mostly about keeping that cost honest.
 *
 * ── What it costs, and what stops it ────────────────────────────────────
 * Pair checks are O(n²) — 64 points is 2,016 per frame. Cheap on a desktop,
 * not free on a phone, so:
 *   - the loop stops entirely when the field scrolls out of view, which on
 *     this page is most of the time, since it only covers the hero
 *   - rAF is already suspended by the browser in a background tab
 *   - reduced motion draws one static frame and never starts the loop
 * Without the first of those this would keep a phone's CPU busy drawing
 * something four screens above the fold.
 */

/**
 * One point per this many square pixels, rather than a fixed count.
 *
 * A fixed count is a density bug waiting for a phone. 64 points across a
 * 985px hero is comfortable; the same 64 in a 375px one is 2.6x the density,
 * and because lines depend on how close pairs happen to be, the line count
 * rises faster than that again — the field went from a scattering to a mesh
 * over the copy. Deriving the count from area keeps it looking the same
 * everywhere and, usefully, does the least work on the smallest device.
 */
const AREA_PER_POINT = 15_500;
const MIN_POINTS = 14;
const MAX_POINTS = 64;

/**
 * Below this gap a line is drawn, fading out as the pair drifts apart.
 *
 * Longer than it was, and paired with fewer points and a fainter stroke. The
 * three move together: reaching further on its own just thickens the mesh,
 * because the number of pairs inside the radius grows with its square. Spread
 * the points out at the same time and the web gets bigger without getting
 * busier — longer spans, fewer of them, each one lighter.
 */
const LINK_DISTANCE = 178;
/** Faint enough to read as a drawn line rather than a graph edge. */
const LINK_ALPHA = 0.17;

/**
 * The most lines any one point will accept.
 *
 * Joining every pair inside the radius is what a proximity graph does, and it
 * looks like one: wherever three or four points drift together they fill in
 * as a solid polygon, and the field reads as a mesh rather than as stars.
 *
 * Capping the degree changes the character completely. Links are taken
 * shortest-first, so each point keeps its nearest neighbour or two and
 * everything else goes unjoined — which also means a point on its own stays
 * on its own instead of being roped into whatever passes nearby.
 */
const MAX_LINKS = 2;

const SPEED = 0.16;

/**
 * The cursor's reach.
 *
 * Deliberately longer than the reach between points, and its lines are drawn
 * stronger. A field that only drifts is wallpaper — you look once and stop
 * seeing it. A field that answers the cursor is the difference between a
 * background and something worth moving the mouse over, and it costs one
 * more pass over the points.
 */
const CURSOR_REACH = 210;
const CURSOR_ALPHA = 0.42;

/**
 * How hard points shy away from the cursor, and how quickly that decays.
 *
 * Small on purpose. Enough that the field visibly opens up around the
 * pointer, not so much that it scatters — this sits behind a headline, and
 * anything that lurches pulls the eye off the words.
 */
const NUDGE = 0.55;
const NUDGE_DECAY = 0.92;

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Displacement from the cursor, decayed each frame back toward nothing. */
  ox: number;
  oy: number;
};

/** Same mulberry32 as before: a fixed sky rather than a new one per load. */
function seeded(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function StarField({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let points: P[] = [];
    let frame = 0;
    let running = false;

    // Both reused between frames rather than reallocated 60 times a second.
    // `candidates` is emptied with .length = 0 and refilled; `degree` counts
    // how many lines each point has taken this frame.
    let degree = new Uint8Array(0);
    const candidates: { i: number; j: number; d: number }[] = [];

    // Pointer position in the field's own coordinates, and where the field
    // sits on the page so that can be worked out without asking the layout
    // engine on every move event.
    const cursor = { x: 0, y: 0, on: false };
    let hostLeft = 0;
    let hostTop = 0;

    // The ink colour is a token, so it has to be read rather than hardcoded —
    // that's what lets the field invert on the dark theme instead of drawing
    // near-black points on a near-black page.
    let ink = "12, 14, 11";
    const readInk = () => {
      // Read off the host, not the document. The token is scoped, so a
      // section that sets `dark` on itself flips the field's ink with it —
      // which is what lets this sit on a dark band inside an otherwise white
      // page without knowing anything about that band.
      const raw = getComputedStyle(host).getPropertyValue("--foreground").trim();
      if (!raw) return;
      // The token is "H S% L%", which canvas won't take directly. Bounce it
      // through an element and let the browser convert to rgb for us.
      const probe = document.createElement("div");
      probe.style.color = `hsl(${raw})`;
      // Mounted inside the host, not on body — appending to body would
      // resolve against the document's tokens and undo the scoping above.
      host.appendChild(probe);
      const rgb = getComputedStyle(probe).color.match(/[\d.]+/g);
      probe.remove();
      if (rgb) ink = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
    };

    const seed = () => {
      const rand = seeded(20260906);
      const count = Math.round(
        Math.min(MAX_POINTS, Math.max(MIN_POINTS, (width * height) / AREA_PER_POINT)),
      );

      // Stratified, not uniform. Scattering points with two random numbers
      // each gives clumps and voids — that is what uniform random looks like,
      // and at these counts it is obvious: the first version put 26.6% of the
      // ink in the leftmost sixth of the canvas and 8.2% in the rightmost.
      //
      // So the area is divided into a grid of roughly `count` cells and one
      // point is dropped somewhere inside each. Coverage is even, and the
      // jitter within each cell keeps it from reading as a lattice.
      const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
      const rows = Math.max(1, Math.ceil(count / cols));
      const cellW = width / cols;
      const cellH = height / rows;

      points = [];
      for (let i = 0; i < count; i++) {
        const cx = i % cols;
        const cy = Math.floor(i / cols);
        // One rand() per value, in a fixed order. The size used to be picked
        // with a conditional that consumed one or two numbers depending on
        // the first, so how much of the sequence each point ate varied —
        // harmless, but it makes the field impossible to reason about.
        const jx = rand();
        const jy = rand();
        const angle = rand() * Math.PI * 2;
        const roll = rand();
        points.push({
          x: (cx + jx) * cellW,
          y: (cy + jy) * cellH,
          // Angle rather than independent vx/vy, so every point moves at the
          // same speed in a different direction. Independent components make
          // diagonal movers noticeably faster than axis-aligned ones.
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
          r: roll > 0.9 ? 1.9 : roll > 0.65 ? 1.4 : 1,
          ox: 0,
          oy: 0,
        });
      }

      degree = new Uint8Array(points.length);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      // Page coordinates, cached here so pointermove can convert with
      // arithmetic instead of a getBoundingClientRect per event. The field is
      // anchored to the top of the document, so these only move on resize.
      hostLeft = rect.left + window.scrollX;
      hostTop = rect.top + window.scrollY;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Draw in CSS pixels and let the transform handle density, or every
      // radius and distance below would need scaling by hand.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-seed when the area has changed enough to want a different number
      // of points — a phone rotated to landscape, or a window dragged wider.
      // Only when the count actually differs, or every resize event would
      // rebuild the field and make it visibly jump while being dragged.
      const wanted = Math.round(
        Math.min(MAX_POINTS, Math.max(MIN_POINTS, (width * height) / AREA_PER_POINT)),
      );
      if (points.length !== wanted) seed();
    };

    // Drawn position, which is the drift plus whatever the cursor has pushed
    // it to. Kept separate from x/y so the nudge can decay back to nothing
    // without having to remember where the point was supposed to be.
    const px = (p: P) => p.x + p.ox;
    const py = (p: P) => p.y + p.oy;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Every pair inside the radius, gathered first rather than drawn as
      // found — the shortest ones have to win the degree cap, and that can't
      // be decided until they've all been seen.
      candidates.length = 0;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = px(points[i]) - px(points[j]);
          const dy = py(points[i]) - py(points[j]);
          // Compared squared to skip a sqrt on every pair; the real distance
          // is only needed for the few that survive.
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DISTANCE * LINK_DISTANCE) continue;
          candidates.push({ i, j, d: Math.sqrt(d2) });
        }
      }
      // Only the in-range pairs get sorted, which is a small fraction of the
      // n² checked above — a few dozen, not a few thousand.
      candidates.sort((a, b) => a.d - b.d);

      degree.fill(0);

      // Lines before points, so the dots sit on top of the joins rather than
      // being cut through by them.
      ctx.lineWidth = 0.6;
      for (const c of candidates) {
        if (degree[c.i] >= MAX_LINKS || degree[c.j] >= MAX_LINKS) continue;
        degree[c.i]++;
        degree[c.j]++;
        ctx.strokeStyle = `rgba(${ink}, ${LINK_ALPHA * (1 - c.d / LINK_DISTANCE)})`;
        ctx.beginPath();
        ctx.moveTo(px(points[c.i]), py(points[c.i]));
        ctx.lineTo(px(points[c.j]), py(points[c.j]));
        ctx.stroke();
      }

      // The cursor's own lines, drawn stronger and reaching further than the
      // ones between points, and exempt from the degree cap — the whole point
      // is that the pointer gathers a fan rather than picking up two strays.
      if (cursor.on) {
        ctx.lineWidth = 0.8;
        for (const p of points) {
          const dx = px(p) - cursor.x;
          const dy = py(p) - cursor.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > CURSOR_REACH * CURSOR_REACH) continue;
          const d = Math.sqrt(d2);
          ctx.strokeStyle = `rgba(${ink}, ${CURSOR_ALPHA * (1 - d / CURSOR_REACH)})`;
          ctx.beginPath();
          ctx.moveTo(cursor.x, cursor.y);
          ctx.lineTo(px(p), py(p));
          ctx.stroke();
        }
      }

      for (const p of points) {
        ctx.fillStyle = `rgba(${ink}, ${p.r > 1.5 ? 0.75 : p.r > 1.2 ? 0.6 : 0.45})`;
        ctx.beginPath();
        ctx.arc(px(p), py(p), p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        // Wrap rather than bounce. Bouncing makes the edges visible as walls
        // and drifts the whole field into corners over time.
        if (p.x < -2) p.x = width + 2;
        if (p.x > width + 2) p.x = -2;
        if (p.y < -2) p.y = height + 2;
        if (p.y > height + 2) p.y = -2;

        // Shy away from the pointer, strongest right under it and fading to
        // nothing at the edge of its reach. Accumulated into an offset rather
        // than into velocity: velocity would keep whatever the cursor gave it
        // forever, and the field would slowly blow apart over a long visit.
        if (cursor.on) {
          const dx = px(p) - cursor.x;
          const dy = py(p) - cursor.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01 && d < CURSOR_REACH) {
            const push = (1 - d / CURSOR_REACH) * NUDGE;
            p.ox += (dx / d) * push;
            p.oy += (dy / d) * push;
          }
        }

        // Always decaying home, so the field closes back up behind the
        // pointer instead of keeping a permanent hole where it has been.
        p.ox *= NUDGE_DECAY;
        p.oy *= NUDGE_DECAY;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    readInk();
    resize();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still.matches) {
      // One frame, then nothing. The field is still there and still joined
      // up; it just doesn't drift.
      draw();
    } else {
      // Only run while the hero is actually on screen. This field is 760px of
      // a page several screens long, so for most of a visit there is nothing
      // to look at and no reason to be drawing it.
      const io = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? start() : stop()),
        { threshold: 0 },
      );
      io.observe(host);

      const ro = new ResizeObserver(() => {
        resize();
        if (!running) draw();
      });
      ro.observe(host);

      // The ink token changes when the theme does, and nothing else would
      // tell us — the canvas has already been painted in the old colour.
      const mo = new MutationObserver(() => {
        readInk();
        if (!running) draw();
      });
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // Listened for on the window, not the host: the host is
      // pointer-events-none so that the field never intercepts a click meant
      // for the buttons sitting on top of it, which also means it never
      // receives a pointer event of its own.
      const onMove = (e: PointerEvent) => {
        // Mouse only, and checked here rather than by turning the fan off on
        // pointerdown. That was the original attempt and it doesn't work: on
        // touch, pointerdown fires *before* pointermove, so the move that
        // follows immediately switched the fan back on and a tap left it
        // stranded with nothing to move it away — exactly what the check was
        // written to prevent. Filtering by pointerType is the version that
        // actually holds, and it also spares the device least able to afford
        // the extra pass.
        if (e.pointerType !== "mouse") return;
        const x = e.clientX + window.scrollX - hostLeft;
        const y = e.clientY + window.scrollY - hostTop;
        cursor.x = x;
        cursor.y = y;
        // A margin of one reach outside the box, so the fan fades as the
        // pointer leaves rather than snapping off at the edge.
        cursor.on =
          x > -CURSOR_REACH &&
          y > -CURSOR_REACH &&
          x < width + CURSOR_REACH &&
          y < height + CURSOR_REACH;
      };
      const onGone = () => {
        cursor.on = false;
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      // There was a `pointerdown -> onGone` here to keep touch out. It has
      // gone with the pointerType check above, which does the job properly —
      // and on a mouse it was a bug of its own, snuffing the whole fan on
      // every click until the pointer happened to move again.
      document.addEventListener("pointerleave", onGone);
      window.addEventListener("blur", onGone);

      return () => {
        stop();
        io.disconnect();
        ro.disconnect();
        mo.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onGone);
        window.removeEventListener("blur", onGone);
      };
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        "starfield pointer-events-none absolute inset-x-0 top-0 overflow-hidden",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
