import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { LaunchPanel } from "@/components/launch-panel";
import { StarField } from "@/components/marketing/star-field";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { SITE_STATS } from "@/lib/site-stats";

// Two forms on purpose. The <title> goes through the root layout's
// "%s · Clip Catchers" template, so it must not carry the brand itself or it
// renders twice. Open Graph and Twitter have no template and are read
// standalone in a link preview, so those spell it out.
const TITLE = "Start a campaign";
const SOCIAL_TITLE = "Start a campaign — Clip Catchers";
const DESCRIPTION =
  "Tell us what you're promoting and we'll come back with what it would cost and what it should deliver. No retainer, no minimum term, pay only for views that landed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/launch" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/launch",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

// Read from the same modules the homepage uses. These were typed in by hand
// and had already drifted — the homepage said 40.7M here and 40M+ there.
const REASSURANCE = [
  [`$${RATE_PER_THOUSAND.toFixed(2)}`, "per 1,000 delivered views"],
  ["1 day", "typical reply time"],
  [SITE_STATS.viewsDelivered, "views delivered so far"],
];

/**
 * `?mode=call` opens straight on the booking tab.
 *
 * It exists so "Book a call" can be its own link — in the header, in the
 * footer, in a DM — rather than a thing you can only reach by landing here and
 * then noticing a switch. Anything other than "call" falls through to the
 * brief, so a mangled or truncated URL shows the form rather than an error.
 *
 * searchParams is a promise in Next 15, and reading it opts this page into
 * dynamic rendering. That's the cost of the deep link and it's a fair one:
 * this page has a form on it and nothing worth caching.
 */
export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = mode === "call" ? "call" : "brief";

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Same starfield as the homepage — this is the page that button leads to,
          and the two surfaces reading differently made the handoff feel like
          leaving the site.

          The tinted glow that sat here is gone for the reason the homepage
          dropped its own: --primary is near-black in the light theme, so
          `bg-primary/10 blur-[150px]` isn't warmth, it's a grey smudge across
          the top of a white page. That decision was made on the homepage and
          never carried over here. */}
      <StarField className="h-[600px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight">Clip Catchers</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-6">
        <div className="text-center">
          {/* Neutral between the two tabs on purpose. The heading used to be
              "Tell us what you're promoting", which is only one of the two
              things this page now offers and would read as a wrong label the
              moment someone opened the call tab. */}
          <h1 className="display text-4xl sm:text-6xl">Start a campaign</h1>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Send a brief or book fifteen minutes — either way you get what it would cost
            and what it should realistically deliver, drawn from campaigns we&apos;ve
            actually run rather than a projection.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-lg grid-cols-3 gap-3 text-center">
          {REASSURANCE.map(([value, label]) => (
            <div key={label}>
              <p className="font-mono text-lg font-semibold text-primary-ink">{value}</p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <LaunchPanel initialMode={initialMode} />
        </div>

        {/* "Already a client? Sign in to your dashboard" was here and has gone
            with the rest of the sign-in links. This is the page someone lands
            on to become a client; offering an existing one a way out of it was
            the single worst placement of that link on the site. */}
      </main>
    </div>
  );
}
