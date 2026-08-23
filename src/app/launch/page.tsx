import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { QuoteForm } from "@/components/quote-form";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { SITE_STATS } from "@/lib/site-stats";

// Two forms on purpose. The <title> goes through the root layout's
// "%s · Clip Catchers" template, so it must not carry the brand itself or it
// renders twice. Open Graph and Twitter have no template and are read
// standalone in a link preview, so those spell it out.
const TITLE = "Launch a campaign";
const SOCIAL_TITLE = "Launch a campaign — Clip Catchers";
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

export default function QuotePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-grid opacity-[0.25]" />
      <div className="pointer-events-none absolute left-1/2 top-[-140px] h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />

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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell us what you&apos;re promoting
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            We&apos;ll come back with what it would cost and what it should realistically
            deliver — based on campaigns we&apos;ve actually run, not a projection.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3 text-center">
          {REASSURANCE.map(([value, label]) => (
            <div key={label}>
              <p className="font-mono text-lg font-semibold text-primary-ink">{value}</p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <QuoteForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a client?{" "}
          <Link href="/login" className="text-primary-ink underline-offset-4 hover:underline">
            Sign in to your dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
