"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Phone } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { NavMenu } from "@/components/marketing/nav-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_GROUPS, NAV_LINKS } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

/**
 * The marketing header.
 *
 * ── History, because this has swung twice ───────────────────────────────
 * It carried a four-link section nav with an animated underline. That was
 * removed on the grounds that the page had one job and five competing targets
 * in the bar was four ways to not do it — correct at the time, when every one
 * of those links was an anchor to a section of the same page. A table of
 * contents for a document you are already inside is furniture.
 *
 * It is back because the links are no longer anchors. The subjects are real
 * pages now, and a site with eleven pages and no visible way to reach them is
 * a worse failure than a busy bar: the pages exist, rank, and are unreachable
 * from the only page anyone lands on.
 *
 * What has not come back is the underline, or a link for every section. Four
 * top-level items, two of which open a menu, and the sheet still owns
 * everything secondary — sign-in, legal, the creator route.
 *
 * ── The CTA is white, and that is deliberate ────────────────────────────
 * The reference design this nav copies uses a filled black pill. Ours stays
 * white with a border and elevation, matching the `default` button variant,
 * because that was an explicit decision made after the filled version had
 * already been tried and rejected once. Don't flip it back without saying so.
 *
 * This pill is hand-built rather than a Button, so it does not inherit that
 * variant — if the primary treatment changes again, change it here too.
 */
export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // A floating capsule rather than a full-width band. The bar is the first
    // thing on the page and a hairline strip reads as chrome; at this size it
    // reads as the product's own furniture.
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center gap-3 rounded-[1.75rem] px-3 py-3 transition-[background-color,border-color,box-shadow] duration-200 sm:gap-4 sm:px-4",
          scrolled
            ? "border border-border bg-background/85 shadow-[0_8px_30px_-12px_hsl(var(--foreground)/0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75"
            : "border border-border/60 bg-card/70 backdrop-blur-md",
        )}
      >
        {/* The name on its own. The icon tile sat to its left and the two were
            saying the same thing twice in a bar with room for neither.
            Dropping it also freed the ~50px that made this bar overflow at
            320px. */}
        <Link href="/" className="flex shrink-0 items-center">
          <span className="wordmark whitespace-nowrap text-base min-[360px]:text-lg sm:text-2xl">
            Clip Catchers
          </span>
        </Link>

        {/* The nav proper. Hidden below lg, where the sheet carries the same
            links — four items plus two chevrons does not fit beside a wordmark
            and a CTA on a tablet, let alone a phone. */}
        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Main">
          {NAV_LINKS.slice(0, 1).map((link) => (
            <TopLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
          {NAV_GROUPS.map((group) => (
            <NavMenu key={group.label} group={group} />
          ))}
          {NAV_LINKS.slice(1).map((link) => (
            <TopLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Booking, at xl and up only. It lost its place at lg when the nav
              arrived; rather than shrink the nav it moves up a breakpoint,
              because it is also in the hero, the closing panel and the sheet,
              and the nav links are in none of those. */}
          {!signedIn && (
            <Button
              asChild
              variant="outline"
              className="hidden h-12 rounded-full px-5 text-[15px] xl:inline-flex"
            >
              <Link href="/launch?mode=call">
                <Phone />
                Book a call
              </Link>
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
                rounded parent. */}
            <div
              className={cn(
                "flex h-11 shrink-0 items-center overflow-hidden rounded-full sm:h-14",
                signedIn
                  ? "border border-border bg-background"
                  : "border border-[hsl(var(--border-strong))] bg-background text-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.06),0_4px_12px_-6px_hsl(var(--foreground)/0.18)]",
              )}
            >
              {!signedIn && (
                <>
                  <Link
                    href="/launch"
                    className="flex h-full items-center gap-2 whitespace-nowrap px-3 text-[15px] font-medium transition-colors hover:bg-accent min-[360px]:px-4 sm:px-7"
                  >
                    {/* Two labels, one per width. "Start a campaign" doesn't
                        fit a 375px bar once the wordmark is beside it, and
                        "Start" survives losing the rest of the sentence in a
                        way the old "Launch" — a verb with no object — didn't.
                        The full label returns at xl, not lg: at lg the nav is
                        already occupying the middle of the bar. */}
                    <span className="xl:hidden">Start</span>
                    <span className="hidden xl:inline">Start a campaign</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                  <span aria-hidden className="h-full w-px bg-border" />
                </>
              )}

              {/* Shown at every width. Below lg it is the only route to the
                  nav; at lg and up it still owns sign-in, legal and the
                  creator link, which are not in the bar. */}
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-accent sm:w-14"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
            </div>

            {/* SheetContent ships with no padding of its own — only a gap —
                and SheetHeader carries its own p-4. So the header looked
                indented while everything below sat flush against the edge.
                Padding goes on the container and comes back off the header, so
                one value governs the whole panel. */}
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

              {/* The same links as the bar, flattened. A nested accordion in a
                  panel this size is a second thing to open before you can read
                  the first — the groups become headings and every page is one
                  tap. */}
              <nav className="mt-8 flex flex-col" aria-label="All pages">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="border-b border-border/60 py-3.5 text-base font-medium transition-colors hover:text-cta-ink"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}

                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="mt-6">
                    <p className="eyebrow text-muted-foreground/70">{group.label}</p>
                    <div className="mt-2 flex flex-col">
                      {group.links.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            className="border-b border-border/60 py-3 text-[15px] transition-colors hover:text-cta-ink"
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-8 space-y-3">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/launch">
                      Start a campaign
                      <ArrowRight />
                    </Link>
                  </Button>
                </SheetClose>
                {!signedIn && (
                  <SheetClose asChild>
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <Link href="/launch?mode=call">
                        <Phone />
                        Book a call
                      </Link>
                    </Button>
                  </SheetClose>
                )}
                <SheetClose asChild>
                  <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href={signedIn ? "/dashboard" : "/login"}>
                      {signedIn ? "Dashboard" : "Client sign in"}
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/** A top-level nav item with no menu under it. */
function TopLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md py-2 text-[15px] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}
