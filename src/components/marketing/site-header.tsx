"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * The marketing header.
 *
 * Three things it has to do that the previous one didn't:
 *
 * 1. Say where you are. The homepage is long and every section looks like the
 *    last one from ten thousand feet, so the nav underlines the section you're
 *    actually in. That's what makes "how it works" findable again after you've
 *    scrolled past it — you can see it in the bar rather than hunting.
 * 2. Survive mobile. The old bar hid three of its four links below `md`,
 *    leaving a phone with one nav item. Everything now lives in a sheet.
 * 3. Get out of the way at the top and firm up once you scroll. A border and
 *    shadow over the hero is noise; over scrolling content it's the thing that
 *    keeps the bar readable.
 */
const SECTIONS = [
  { id: "how-it-works", label: "How it works" },
  { id: "comparison", label: "Why us" },
  { id: "results", label: "Results" },
  { id: "pricing", label: "Pricing" },
] as const;

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // The band is the top third of the viewport: a section counts as "current"
    // once its heading has reached the upper part of the screen, which is
    // where you'd say you were reading it. Watching the whole viewport instead
    // makes the indicator flicker between two sections at every boundary.
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    // A floating capsule rather than a full-width band. The bar is the first
    // thing on the page and a hairline strip reads as chrome; at this size,
    // with the mark in its own tile, it reads as the product's own furniture.
    // The outer element stays full-width and transparent so the capsule can
    // sit inside it with air on every side.
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center gap-3 rounded-[1.75rem] px-3 py-3 transition-[background-color,border-color,box-shadow] duration-200 sm:gap-4 sm:px-4",
          scrolled
            ? "border border-border bg-background/85 shadow-[0_8px_30px_-12px_hsl(var(--foreground)/0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75"
            : "border border-border/60 bg-card/70 backdrop-blur-md",
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {/* The mark in its own tile, the way the reference does it — a 14px
              favicon beside 14px text is what made the old bar read as small
              no matter how much padding it had. */}
          <BrandMark className="h-11 w-11 shrink-0 rounded-2xl sm:h-14 sm:w-14" />
          {/* Shown at every width. It used to hide below sm, which left a phone
              looking at an unlabelled icon — the one place a visitor is least
              likely to already know whose site they're on. The mark drops a
              notch and the CTA shortens to "Start" to buy the room. */}
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight sm:text-base">
            Clip Catchers
          </span>
        </Link>

        {/* Desktop nav. Hairline dividers between items, as in the reference —
            they're what stops five links reading as one run-on line. The
            underline is the position indicator: it animates in rather than
            appearing, so moving between sections reads as movement rather
            than a redraw. */}
        <nav className="mx-auto hidden items-center lg:flex">
          {SECTIONS.map((section, i) => (
            <div key={section.id} className="flex items-center">
              {i > 0 && <span aria-hidden className="h-5 w-px bg-border" />}
              <Link
                href={`#${section.id}`}
                className={cn(
                  "relative mx-1 rounded-full px-4 py-2.5 text-[15px] transition-colors",
                  active === section.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section.label}
                <span
                  className={cn(
                    "absolute inset-x-4 bottom-1 h-0.5 origin-left rounded-full bg-primary transition-transform duration-200",
                    active === section.id ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {signedIn ? (
            <Button asChild className="h-12 rounded-full px-6 text-[15px] sm:h-14 sm:px-7">
              <Link href="/dashboard">
                Dashboard
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="hidden h-12 rounded-full px-5 text-[15px] lg:inline-flex"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <Sheet>
            {/* One control, two halves. The CTA and the menu were two separate
                pills with a gap between them; as a single shape with a seam
                down the middle they read as one thing.
                `overflow-hidden` is what lets two square-cornered children sit
                inside one fully-rounded parent.

                White, with a hairline and a soft shadow, matching the primary
                button everywhere else. A white fill on a near-white bar has no
                edge of its own, so the border is what makes it a button and
                the shadow is what lifts it off the page. */}
            <div
              className={cn(
                "flex h-11 shrink-0 items-center overflow-hidden rounded-full sm:h-14",
                signedIn
                  ? "lg:hidden"
                  : "border border-[hsl(var(--border-strong))] bg-background text-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.06),0_4px_12px_-6px_hsl(var(--foreground)/0.18)]",
              )}
            >
              {!signedIn && (
                <>
                  <Link
                    href="/launch"
                    className="flex h-full items-center gap-2 whitespace-nowrap px-4 text-[15px] font-medium transition-colors hover:bg-accent sm:px-7"
                  >
                    {/* Three labels, one per width. "Launch a Campaign" doesn't
                        fit a 375px bar once the wordmark is beside it, and
                        "Launch" alone reads as a verb with no object — "Start"
                        is shorter and survives losing the rest of the sentence. */}
                    <span className="sm:hidden">Start</span>
                    <span className="hidden sm:inline lg:hidden">Launch</span>
                    <span className="hidden lg:inline">Launch a Campaign</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                  {/* The seam. Darkened rather than a border token: it has to
                      read against a solid fill, not against the page. */}
                  <span aria-hidden className="h-full w-px bg-border lg:hidden" />
                </>
              )}

              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-full w-11 items-center justify-center transition-colors sm:w-14 lg:hidden",
                    signedIn
                      ? "rounded-full border border-border bg-background text-foreground hover:bg-accent"
                      : "hover:bg-white/10",
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
            </div>
            <SheetContent side="right" className="w-[85vw] max-w-sm">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <BrandMark className="h-7 w-7" />
                  Clip Catchers
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-8 flex flex-col">
                {SECTIONS.map((section) => (
                  <SheetClose asChild key={section.id}>
                    <Link
                      href={`#${section.id}`}
                      className="border-b border-border/60 py-3.5 text-base font-medium transition-colors hover:text-primary-ink"
                    >
                      {section.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="#faq"
                    className="border-b border-border/60 py-3.5 text-base font-medium transition-colors hover:text-primary-ink"
                  >
                    FAQ
                  </Link>
                </SheetClose>
              </nav>

              <div className="mt-8 space-y-3">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/launch">
                      Launch a Campaign
                      <ArrowRight />
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href={signedIn ? "/dashboard" : "/login"}>
                      {signedIn ? "Dashboard" : "Client sign in"}
                    </Link>
                  </Button>
                </SheetClose>
              </div>

              {/* Creators get a link, not a button. They're the supply side —
                  the bar belongs to the people with a budget. */}
              <SheetClose asChild>
                <Link
                  href="#creators"
                  className="mt-6 block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Want to get paid to clip? →
                </Link>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
