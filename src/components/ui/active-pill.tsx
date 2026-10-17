"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The spring a selection travels on: quick, and settling without a bounce —
 * the feel of an iOS segmented control, Instagram's tabs or Whop's nav (owner,
 * 2026-10-17: "button switching animation like apple insta whop").
 */
export const SWITCH_SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } as const;

/**
 * The highlight behind whichever option of a switch is selected. Rendered in
 * the selected option only; because every option in a group shares one
 * `layoutId`, changing the selection moves this one pill across instead of
 * one option going dark and another lighting up.
 *
 * The option it sits in needs `relative isolate`: the pill is `-z-10` inside
 * that stacking context, so it paints behind the option's text and icon but
 * not behind the page. The selected look (fill, border, shadow) belongs on the
 * pill, not the option, or it would switch instantly underneath the pill.
 *
 * `layoutId` has to be unique per group on the page — take it from `useId()`
 * — or two switches would trade one pill between them.
 *
 * The corner radius is a prop, not a `rounded-*` class: framer moves the pill
 * by scaling it, and only a radius it was handed as a style can it keep round
 * while the pill stretches between two options of different widths. A class
 * radius gets squashed mid-move.
 */
export function ActivePill({
  layoutId,
  className,
  radius = PILL_RADIUS.full,
}: {
  layoutId: string;
  className?: string;
  radius?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden="true"
      className={cn("absolute inset-0 -z-10", className)}
      style={{ borderRadius: radius }}
      transition={reduceMotion ? { duration: 0 } : SWITCH_SPRING}
    />
  );
}

/** The theme's radii in px (--radius is 0.65rem), to match the option's own corners. */
export const PILL_RADIUS = { full: 9999, lg: 10.4, md: 8.4, none: 0 } as const;
