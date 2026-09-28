"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";

gsap.registerPlugin(SplitText);

// Layout effect in the browser, plain effect on the server, where layout
// effects cannot run and React warns about them.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The page's one entrance: the headline rises into place a line at a time.
 *
 * ── Why this and nothing else on load ────────────────────────────────────
 * Award juries describe the winners' motion as having a director — a few
 * choreographed moments, never motion on everything. This is the moment. The
 * cards further down do not fade in; that pattern is the template tell this
 * site already removed.
 *
 * ── Never leaves the headline hidden ─────────────────────────────────────
 * The heading is invisible until GSAP reveals it, or it would paint once,
 * jump down and slide back up. Five things make sure invisible is never
 * where it stays:
 *   - no JavaScript: the <noscript> style shows it immediately
 *   - JavaScript that fails to hydrate: a CSS animation shows it at 1.5 s
 *     (see [data-reveal] in globals.css)
 *   - JavaScript that hydrates after that: the headline is already showing,
 *     so it is left alone rather than hidden again to play an entrance
 *   - no animation frames (a prerendered page, a headless renderer): the
 *     reveal is jumped to its end after a few seconds, because GSAP only
 *     advances on requestAnimationFrame
 *   - reduced motion: shown at once, no animation
 *
 * SplitText splits on *rendered* lines, so the reveal follows wherever the
 * responsive headline actually breaks. autoSplit re-splits when the display
 * font finishes loading or the width changes, and because onSplit returns the
 * tween, GSAP carries its progress across a re-split instead of restarting.
 * aria: "auto" keeps screen readers on the original sentence rather than the
 * fragments.
 */
export function RevealHeading({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already visible means the CSS safety fired first: hydration was slow.
    if (reducedMotion() || getComputedStyle(el).visibility === "visible") {
      el.style.visibility = "visible";
      return;
    }
    let reveal: gsap.core.Tween | undefined;
    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      aria: "auto",
      onSplit(self) {
        gsap.set(el, { visibility: "visible" });
        reveal = gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.09,
        });
        return reveal;
      },
    });
    // The whole reveal takes 1.3 s; well past that, stop waiting for frames.
    const settle = window.setTimeout(() => reveal?.progress(1), 4000);
    return () => {
      window.clearTimeout(settle);
      split.revert();
    };
  }, []);

  return (
    <>
      <noscript
        dangerouslySetInnerHTML={{ __html: "<style>[data-reveal]{visibility:visible!important}</style>" }}
      />
      <h1 ref={ref} className={className} data-reveal>
        {children}
      </h1>
    </>
  );
}

/**
 * The results figure rises into place as it scrolls into view — once.
 *
 * Only when it starts below the fold. A figure the reader can already see at
 * load is left alone: hiding it after first paint to animate it back would be
 * the flash this is built to avoid. So on a tall desktop screen it is simply
 * there, and on a phone, where it sits under the hero, it arrives as you
 * reach it.
 *
 * Moves a wrapper, never the text, because the figure inside is a live
 * counter that React re-renders every second; splitting or tweening that node
 * would fight the re-render.
 */
export function Rise({ className, children }: { className?: string; children: React.ReactNode }) {
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const box = outer.current;
    const target = inner.current;
    if (!box || !target || reducedMotion()) return;
    if (box.getBoundingClientRect().top < window.innerHeight) return;

    gsap.set(target, { yPercent: 105 });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.to(target, { yPercent: 0, duration: 1.2, ease: "expo.out" });
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      gsap.killTweensOf(target);
    };
  }, []);

  return (
    // pb keeps the mask from shaving the bottom of the digits.
    <span ref={outer} className={cn("block overflow-hidden pb-[0.06em]", className)}>
      <span ref={inner} className="block will-change-transform">
        {children}
      </span>
    </span>
  );
}
