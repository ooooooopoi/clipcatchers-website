import type { Metadata } from "next";
import Link from "next/link";
import { Comparison } from "@/components/marketing/comparison";
import { Control } from "@/components/marketing/control";
import { PageShell } from "@/components/marketing/page-shell";
import { Pricing } from "@/components/marketing/pricing";
import { PUBLIC_VIEWPORT } from "@/lib/public-theme";

export const viewport = PUBLIC_VIEWPORT;

const TITLE = "Pricing";
const SOCIAL_TITLE = "Pricing — Clip Catchers";
const DESCRIPTION =
  "Pay per view: billed against views that actually landed, at the rate in your quote. No retainer, no minimum term, no setup fee. You set a budget and the campaign closes itself when it's met.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/pricing",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

/**
 * Pricing without a published rate (since 2026-09-30, at the owner's request):
 * pay per view, with the rate set per campaign in the quote. A "What a budget
 * buys" table stood here, budget divided by the rate. It published the rate
 * by arithmetic, so it went with the number.
 */
export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing"
      title="Pay per view. No retainer."
      intro={
        <>
          Billed against views that actually landed, at the rate in your quote. No setup
          fee, no minimum term, and nothing charged for budget you don&apos;t spend.
        </>
      }
    >
      <Pricing />

      {/* The ceiling, and why it can't be breached. */}
      <Control />

      <Comparison />

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-8 text-center">
        <p className="text-sm text-muted-foreground">
          Every figure here is the same one your report shows. See{" "}
          <Link
            href="/verification"
            className="text-primary-ink underline-offset-4 hover:underline"
          >
            how a view becomes a billed view
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
