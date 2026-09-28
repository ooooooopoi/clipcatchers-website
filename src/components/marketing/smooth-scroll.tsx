"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Weighted smooth scrolling for the marketing pages.
 *
 * Lenis is what the award-winning sites run on for the "one continuous
 * surface" feel: the wheel sets a target and the page eases toward it, rather
 * than jumping in wheel-notch steps. It still scrolls the real window, so
 * position: sticky, anchors and the browser's own scroll restoration keep
 * working — nothing is faked with transforms.
 *
 * Deliberately limited:
 *   - off under prefers-reduced-motion, where eased scrolling is exactly the
 *     kind of motion someone has asked not to get
 *   - touch left native (syncTouch off, the default): a phone's own momentum
 *     scroll is already smooth, and replacing it costs frames on the mid-range
 *     Android the site has to hold 60fps on
 *   - marketing pages only; the dashboard is a work surface
 *
 * globals.css turns the page's CSS `scroll-behavior: smooth` off while Lenis
 * is running. Both at once double-ease every step and feel like lag.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      // In-page links (#faq, #creators) land below the sticky header rather
      // than under it — the same offset their scroll-mt-24 gives them natively.
      anchors: { offset: -96 },
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
