import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { DISCORD_INVITE, DISCORD_LINK_PROPS } from "@/lib/discord";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { USE_CASES } from "@/lib/use-cases";

/**
 * The footer, doing the job a one-line copyright wasn't.
 *
 * A brand buyer past a certain size has a procurement or legal step, and that
 * step looks for terms, a privacy policy and a route in. Finding none of them
 * is where a deal quietly stops. Everything here is cheap to provide and
 * expensive to be missing.
 *
 * No email address by choice — the quote form is the front door, and it
 * arrives with the context a cold email doesn't have.
 */

/**
 * ── These used to be anchors, and they are pages now ────────────────────
 * Every link in the Product and Proof columns pointed at a fragment on the
 * homepage — /#pricing, /#verification. Those sections still exist, but each
 * subject also has a page of its own, and a footer sending people to a
 * summary when a page exists is a footer working against its own site.
 *
 * The category list is derived from USE_CASES rather than retyped, so adding
 * a ninth category puts it in the footer without anyone remembering to.
 */
const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Verification", href: "/verification" },
      { label: "Results", href: "/results" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Use cases",
    // Four of eight, then the index. A footer column listing all eight is
    // taller than the rest of the footer and reads as a sitemap dump.
    links: [
      ...USE_CASES.slice(0, 4).map((c) => ({
        label: c.name,
        href: `/use-cases/${c.slug}`,
      })),
      { label: "All categories →", href: "/use-cases" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Start a campaign", href: "/launch" },
      { label: "Book a call", href: "/launch?mode=call" },
      { label: "For creators", href: "/for-creators" },
      // No "Client sign in", and no "create an account".
      //
      // Sign-in is gone from every public surface deliberately. A footer link
      // to /login serves people who already have an account and already know
      // where it is, while taking space in a column whose job is to catch the
      // ones who don't have one yet. The route still works; it just isn't
      // advertised.
      //
      // Signup was never here either: accounts are created when a campaign is
      // assigned to a client, so anyone following a public signup link arrives
      // in an empty dashboard — the enquiry form above is the real front door.
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8" />
              <span className="text-sm font-semibold tracking-tight">Clip Catchers</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Performance-based creator distribution for brands. Pay for views that
              actually landed — ${RATE_PER_THOUSAND.toFixed(2)} per 1,000, no retainer.
            </p>
            <Link
              href="/launch"
              className="mt-4 inline-block text-sm text-primary-ink underline-offset-4 hover:underline"
            >
              Start a campaign →
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                {column.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Clip Catchers. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* No longer conditional. It was guarded on an environment
                variable that was never set, so this link has never once
                rendered — the one route a creator had from the footer was
                invisible the whole time. */}
            <a
              href={DISCORD_INVITE}
              {...DISCORD_LINK_PROPS}
              className="transition-colors hover:text-foreground"
            >
              Creators — join on Discord
            </a>
            <Link href="/legal/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
