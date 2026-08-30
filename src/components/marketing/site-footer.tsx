import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { RATE_PER_THOUSAND } from "@/lib/pricing";

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
const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || "";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Why brands switch", href: "/#comparison" },
      { label: "Verification", href: "/#verification" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Proof",
    links: [
      { label: "Results", href: "/#results" },
      { label: "Campaign examples", href: "/#industries" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Launch a Campaign", href: "/launch" },
      { label: "Client sign in", href: "/login" },
      // No "create an account". Accounts are set up when a campaign is
      // assigned to a client, so anyone following a public signup link arrives
      // in an empty dashboard — the enquiry form above is the real front door.
    ],
  },
] as const;

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
              Launch a campaign →
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
            {DISCORD_INVITE && (
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Creators — join on Discord
              </a>
            )}
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
