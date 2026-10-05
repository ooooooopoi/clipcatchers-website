"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { DiscordButton } from "@/components/discord-button";
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
 * ── The CTA is filled blue, matching the public palette ─────────────────
 * The header pill is hand-built rather than a Button, so it needs to mirror
 * the `default` button variant directly.
 *
 * If the primary treatment changes again, change it here too.
 */
export function SiteHeader({
  signedIn = false,
  isClipper = false,
  discordEnabled = false,
}: {
  signedIn?: boolean;
  /**
   * Signed in with Discord, so a clipper rather than a client.
   *
   * Changes where the signed-in button points. /dashboard scopes everything to
   * campaigns the account owns and a clipper owns none, so it renders a
   * perfectly working page of zeros — which reads as broken rather than as the
   * wrong door. /me forwards them to their own clips and earnings instead.
   */
  isClipper?: boolean;
  /** Offering a sign-in that bounces off a missing provider is worse than none. */
  discordEnabled?: boolean;
}) {
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
          "mx-auto flex w-full max-w-6xl items-center gap-3 rounded-[1.75rem] px-3 py-3 transition-[background-color,border-color,box-shadow] duration-200 sm:gap-4 sm:px-4 xl:max-w-7xl",
          scrolled
            ? "border border-border bg-background shadow-[0_8px_30px_-12px_hsl(var(--shadow)/0.18)]"
            : "border border-border bg-background",
        )}
      >
        {/* Mark and name together, sized to what the row holds. On a phone
            the row is the name, a 12px gap and the Get started / menu pill
            (151px), and the bar has its width less 58. Measured, that gives:
              below 360   name at 14px   (the pill appears from 340)
              360-374     name at 16px
              375 and up  name at 18px
              420 and up  the logo tile as well
            With "Start" instead of "Get started" the tile fitted from 390;
            the longer label cost it the 390-419 phones.

            And if the row still runs out of room (a phone zoomed for
            accessibility, larger text), the name is what gives way: it
            truncates, while the buttons on the right can't shrink. Before,
            the buttons were pushed out instead and the menu button was cut
            in half by the edge of the screen. */}
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          {/* Phones show the logo alone: with Sign in in the bar (2026-10-05)
              the name no longer fitted and was cut to "CLIP C…". */}
          <BrandMark onDark className="h-9 w-9 shrink-0" />
          <span className="wordmark hidden truncate sm:inline sm:text-2xl">
            Clip Catchers
          </span>
        </Link>

        {/* The nav proper, on one line or not at all. At lg it squeezed in by
            wrapping: "How it works" stacked three words high at 1440 in
            production. Measured there, the bar needs 1171px (logo 239, nav
            425, creator sign-in 178, CTA and menu 261, gaps). The capsule
            gives 1246 once it reaches its 1280 cap, and it only reaches the
            cap from 1328 of page width — so the nav waits for 1360, which is
            1343 of page once a Windows scrollbar takes its 17px. Below it the
            sheet carries the same links, as it always has on tablets. */}
        <nav className="ml-6 hidden items-center gap-5 min-[1360px]:flex" aria-label="Main">
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

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Creators, at lg and up. A clipper arriving here is the one visitor
              who definitely wants to sign in — it is the route to their own
              money — which is why this is offered where "Client sign in"
              deliberately is not. Two labels so it survives the narrower bar at
              lg, matching the CTA beside it. */}
          {/* "Sign in", not "Creator sign in": since 2026-10-05 clients and the
              team sign in with Discord too, and /me sends each to their own
              place (team and clients to the dashboard, creators to their
              clips). The owner couldn't find a login on the site at all. On a
              phone it's a short text pill; below 350px there isn't room beside
              the logo and Get started, and it stays in the menu. */}
          {!signedIn && discordEnabled && (
            <>
              <DiscordButton
                label="Sign in"
                className="hidden h-12 rounded-full px-5 text-[15px] lg:inline-flex"
              />
              <Link
                href="/login?discord=1&next=/me"
                className="hidden h-11 items-center rounded-full border border-[hsl(var(--border-strong))] px-3.5 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary min-[350px]:inline-flex lg:hidden"
              >
                Sign in
              </Link>
            </>
          )}

          {signedIn && (
            <Button asChild className="h-12 rounded-full px-6 text-[15px] sm:h-14 sm:px-7">
              <Link href={isClipper ? "/me" : "/dashboard"}>
                {isClipper ? "My clips" : "Dashboard"}
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

                The menu half is filled (bg-secondary), not page-coloured. On
                the black site a black half disappeared into the black bar,
                and the menu button read as half a button. */}
            <div
              className={cn(
                "flex h-11 shrink-0 items-center overflow-hidden rounded-full sm:h-14",
                signedIn
                  ? "border border-border bg-secondary"
                  : "border border-[hsl(var(--border-strong))] bg-secondary text-foreground shadow-[0_1px_2px_hsl(var(--shadow)/0.06),0_4px_12px_-6px_hsl(var(--shadow)/0.18)]",
              )}
            >
              {!signedIn && (
                <>
                  <Link
                    href="/launch"
                    className="hidden h-full items-center gap-2 whitespace-nowrap bg-cta px-3 text-[15px] font-medium text-cta-foreground transition-colors hover:bg-cta/90 min-[340px]:flex sm:px-7"
                  >
                    {/* "Get started", the site's one call to action, at every
                        width (it replaced "Start" on phones and "Start a
                        campaign" from lg). It's 80px of text; the arrow waits
                        for 640, where there's room for it. Below 340px of page
                        width (a phone zoomed for accessibility) the whole half
                        goes and the name keeps its room: the menu leads with
                        "Get started" anyway. */}
                    Get started
                    <ArrowRight className="hidden size-4 shrink-0 sm:block" />
                  </Link>
                  <span aria-hidden className="hidden h-full w-px bg-border min-[340px]:block" />
                </>
              )}

              {/* Shown at every width. Below 1360 it is the only route to the
                  nav; above it, it still owns legal and the creator
                  link, which are not in the bar. */}
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
            {/* theme-black again: the sheet is portalled to <body>, outside
                the page wrapper that sets the theme for everything else. */}
            <SheetContent
              side="right"
              className="theme-black flex w-[85vw] max-w-sm flex-col gap-0 overflow-y-auto bg-background p-5 text-foreground"
            >
              <SheetHeader className="p-0">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <BrandMark onDark className="h-7 w-7" />
                  Clip Catchers
                </SheetTitle>
              </SheetHeader>

              {/* The same links as the bar, flattened. A nested accordion in a
                  panel this size is a second thing to open before you can read
                  the first — the groups become headings and every page is one
                  tap.

                  Compact, because it was a scroll: 16px rows with 14px of
                  padding and a rule under every one ran the panel to about
                  1,050px, so on a phone the buttons at the bottom were a
                  scroll away. The groups sit two to a row, since every label
                  in them is two or three short words. */}
              <nav className="mt-5 flex flex-col" aria-label="All pages">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="py-2 text-[15px] font-medium transition-colors hover:text-cta-ink"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}

                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="mt-4 border-t border-border/60 pt-4">
                    <p className="eyebrow text-muted-foreground/70">{group.label}</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-3">
                      {group.links.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            className="py-1.5 text-sm transition-colors hover:text-cta-ink"
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-5 space-y-2">
                <SheetClose asChild>
                  <Button asChild className="h-10 w-full">
                    <Link href="/launch">
                      Get started
                      <ArrowRight />
                    </Link>
                  </Button>
                </SheetClose>
                {/* Only for people already signed in. The signed-out half of
                    this was "Client sign in", and it has gone from every
                    public surface: it is the wrong ask for someone who has
                    just read a page about what we do and hasn't bought yet,
                    and it was competing with the two buttons above it that
                    are the actual point of the panel.
                    /login still exists and still works — it just isn't
                    advertised to strangers. Someone with an account has it
                    bookmarked or in an email. */}
                {signedIn && (
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="h-10 w-full">
                      <Link href={isClipper ? "/me" : "/dashboard"}>
                        {isClipper ? "My clips" : "Dashboard"}
                      </Link>
                    </Button>
                  </SheetClose>
                )}

                {/* The creator half of sign-in, which does belong on a public
                    surface even though the client half doesn't. Somebody who
                    already clips for us and wants their earnings is not being
                    sold to — they are being kept from their own page. Below
                    lg this panel is the only place it appears. No 12px line
                    under it explaining who it is for: the label says so. */}
                {!signedIn && discordEnabled && (
                  <DiscordButton label="Sign in" className="h-10 w-full" />
                )}
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
        "whitespace-nowrap rounded-md py-2 text-[15px] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}
