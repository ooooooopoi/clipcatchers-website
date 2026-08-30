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
 * It used to carry a four-link section nav across the desktop bar, with an
 * animated underline tracking where you were on the page. That was a nice
 * piece of work and it was solving the wrong problem: this page has one job,
 * and five competing targets in the bar is four ways to not do it. A brand
 * arriving here doesn't need a table of contents, they need the two decisions
 * — see how this works, or start.
 *
 * So the bar is the wordmark, those two actions, and a menu. Everything
 * secondary — the section links, sign-in, FAQ, the creator route — lives in
 * the sheet, at every width. One place for secondary navigation instead of a
 * desktop bar and a phone menu that disagree about what exists.
 *
 * "Sign in" is deliberately not in the bar signed-out. Someone who has an
 * account knows where the login is; someone who doesn't has no use for it, and
 * it was sitting next to the only button on the page that matters.
 */
const SECTIONS = [
  { id: "how-it-works", label: "How it works" },
  { id: "comparison", label: "Why us" },
  { id: "results", label: "Results" },
  { id: "pricing", label: "Pricing" },
  { id: "after-launch", label: "After you launch" },
  { id: "faq", label: "FAQ" },
] as const;

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // A floating capsule rather than a full-width band. The bar is the first
    // thing on the page and a hairline strip reads as chrome; at this size,
    // with the mark in its own tile, it reads as the product's own furniture.
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
          <BrandMark className="h-11 w-11 shrink-0 rounded-2xl sm:h-14 sm:w-14" />
          {/* Shown at every width. It used to hide below sm, which left a phone
              looking at an unlabelled icon — the one place a visitor is least
              likely to already know whose site they're on. */}
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight sm:text-base">
            Clip Catchers
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* The secondary action, desktop only. On a phone the split pill
              below is already two targets in the space this would need. */}
          {!signedIn && (
            <Button
              asChild
              variant="ctaOutline"
              className="hidden h-14 rounded-full px-6 text-[15px] lg:inline-flex"
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          )}

          {signedIn && (
            <Button asChild className="h-12 rounded-full px-6 text-[15px] sm:h-14 sm:px-7">
              <Link href="/dashboard">
                Dashboard
                <ArrowRight />
              </Link>
            </Button>
          )}

          <Sheet>
            {/* One control, two halves. The CTA and the menu were two separate
                pills with a gap between them; as a single shape with a seam
                down the middle they read as one thing. `overflow-hidden` is
                what lets two square-cornered children sit inside one fully
                rounded parent.
                Orange, because it's the primary call to action — see the
                token note in globals.css for why that's a separate variable
                from the site's accent ink. */}
            <div
              className={cn(
                "flex h-11 shrink-0 items-center overflow-hidden rounded-full sm:h-14",
                signedIn
                  ? "border border-border bg-background"
                  : "bg-cta text-cta-foreground shadow-[0_1px_2px_hsl(var(--cta)/0.24),0_6px_16px_-6px_hsl(var(--cta)/0.45)]",
              )}
            >
              {!signedIn && (
                <>
                  <Link
                    href="/launch"
                    className="flex h-full items-center gap-2 whitespace-nowrap px-4 text-[15px] font-medium transition-colors hover:bg-black/10 sm:px-7"
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
                  {/* The seam. Darkened against the fill rather than a border
                      token, which would be invisible on orange. */}
                  <span aria-hidden className="h-full w-px bg-black/20" />
                </>
              )}

              {/* Shown at every width now, not just below lg — it's the only
                  route to the section links, sign-in and the creator page. */}
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-full w-11 items-center justify-center transition-colors sm:w-14",
                    signedIn ? "text-foreground hover:bg-accent" : "hover:bg-black/10",
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
            </div>

            {/* SheetContent ships with no padding of its own — only a gap —
                and SheetHeader carries its own p-4. So the header looked
                indented while everything below it sat flush against the edge,
                dividers running right off the side. Padding goes on the
                container and comes back off the header, so one value governs
                the whole panel. */}
            <SheetContent
              side="right"
              className="flex w-[85vw] max-w-sm flex-col gap-0 overflow-y-auto p-6"
            >
              <SheetHeader className="p-0">
                <SheetTitle className="flex items-center gap-2.5">
                  <BrandMark className="h-8 w-8" />
                  Clip Catchers
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-8 flex flex-col">
                {SECTIONS.map((section) => (
                  <SheetClose asChild key={section.id}>
                    <Link
                      href={`#${section.id}`}
                      className="border-b border-border/60 py-3.5 text-base font-medium transition-colors hover:text-cta-ink"
                    >
                      {section.label}
                    </Link>
                  </SheetClose>
                ))}
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
