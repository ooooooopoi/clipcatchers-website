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
const AREA_PER_POINT = 11_700;
const MIN_POINTS = 16;
const MAX_POINTS = 80;

/** Below this gap a line is drawn, fading out as the pair drifts apart. */
const LINK_DISTANCE = 132;
const SPEED = 0.16;

type P = { x: number; y: number; vx: number; vy: number; r: number };

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

    // The ink colour is a token, so it has to be read rather than hardcoded —
    // that's what lets the field invert on the dark theme instead of drawing
    // near-black points on a near-black page.
    let ink = "12, 14, 11";
    const readInk = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim();
      if (!raw) return;
      // The token is "H S% L%", which canvas won't take directly. Bounce it
      // through an element and let the browser convert to rgb for us.
      const probe = document.createElement("div");
      probe.style.color = `hsl(${raw})`;
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color.match(/[\d.]+/g);
      probe.remove();
      if (rgb) ink = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
    };

    const seed = () => {
      const rand = seeded(20260906);
      const count = Math.round(
        Math.min(MAX_POINTS, Math.max(MIN_POINTS, (width * height) / AREA_PER_POINT)),
      );
      points = Array.from({ length: count }, () => ({
        x: rand() * width,
        y: rand() * height,
        // Angle rather than independent vx/vy, so every point moves at the
        // same speed in a different direction. Independent components make
        // diagonal movers noticeably faster than axis-aligned ones.
        vx: Math.cos(rand() * Math.PI * 2) * SPEED,
        vy: Math.sin(rand() * Math.PI * 2) * SPEED,
        r: rand() > 0.9 ? 1.9 : rand() > 0.65 ? 1.4 : 1,
      }));
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
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

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Lines first so the points sit on top of the joins rather than being
      // cut through by them.
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          // Compared squared to skip a sqrt on every pair; the real distance
          // is only needed for the pairs that actually get a line.
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DISTANCE * LINK_DISTANCE) continue;
          const d = Math.sqrt(d2);
          ctx.strokeStyle = `rgba(${ink}, ${0.3 * (1 - d / LINK_DISTANCE)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }

      for (const p of points) {
        ctx.fillStyle = `rgba(${ink}, ${p.r > 1.5 ? 0.75 : p.r > 1.2 ? 0.6 : 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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

      return () => {
        stop();
        io.disconnect();
        ro.disconnect();
        mo.disconnect();
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
