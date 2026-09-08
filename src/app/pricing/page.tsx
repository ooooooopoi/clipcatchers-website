import type { Metadata } from "next";
import Link from "next/link";
import { Comparison } from "@/components/marketing/comparison";
import { Control } from "@/components/marketing/control";
import { PageShell } from "@/components/marketing/page-shell";
import { Pricing } from "@/components/marketing/pricing";
import { RATE_PER_THOUSAND } from "@/lib/pricing";

const TITLE = "Pricing";
const SOCIAL_TITLE = "Pricing — Clip Catchers";
const DESCRIPTION = `$${RATE_PER_THOUSAND.toFixed(2)} per 1,000 delivered views. No retainer, no minimum term, no setup fee — you set a budget and the campaign closes itself when it's met.`;

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
 * What a budget buys, as arithmetic.
 *
 * Deliberately computed from RATE_PER_THOUSAND rather than typed, so it can
 * never disagree with the rate quoted three sections above it on the same
 * page — which is exactly the kind of drift that makes a pricing page
 * unusable in a procurement conversation.
 *
 * These are ceilings, not forecasts, and the caption says so. Views ÷ rate is
 * the most a budget can deliver; what it actually delivers depends on the
 * assets, and promising the ceiling as an expectation is how a pricing page
 * turns into a complaint.
 */
const BUDGETS = [500, 1_000, 2_500, 5_000, 10_000];

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing"
      title="One rate. No retainer."
      intro={
        <>
          ${RATE_PER_THOUSAND.toFixed(2)} per 1,000 delivered views, billed against what
          actually landed. No setup fee, no minimum term, and nothing charged for budget
          you don&apos;t spend.
        </>
      }
    >
      <Pricing />

      {/* The arithmetic, spelled out. */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20">
        <div className="text-center">
          <p className="eyebrow text-primary-ink">Worked through</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">What a budget buys</h2>
          <p className="mt-4 text-muted-foreground">
            One division, done for you. These are ceilings — the most a budget can
            deliver at our rate, not a forecast of what yours will.
          </p>
        </div>

        <div className="surface reveal mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="eyebrow px-5 py-3.5 text-muted-foreground/70">
                  Budget
                </th>
                <th scope="col" className="eyebrow px-5 py-3.5 text-muted-foreground/70">
                  Views at our rate
                </th>
                <th
                  scope="col"
                  className="eyebrow hidden px-5 py-3.5 text-muted-foreground/70 sm:table-cell"
                >
                  Effective CPM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {BUDGETS.map((b) => (
                <tr key={b}>
                  <td className="px-5 py-3.5 font-mono font-semibold text-primary-ink">
                    ${b.toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-3.5 font-mono tabular-nums text-foreground">
                    {Math.round((b / RATE_PER_THOUSAND) * 1000).toLocaleString("en-US")}
                  </td>
                  <td className="hidden px-5 py-3.5 font-mono text-muted-foreground sm:table-cell">
                    ${RATE_PER_THOUSAND.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/70">
          The CPM column doesn&apos;t move, and that is the point: you are buying views
          at a fixed rate, so there is no volume tier to negotiate and no rate that
          quietly worsens as the campaign runs.
        </p>
      </section>

      {/* The ceiling, and why it can't be breached. */}
      <Control />

      <Comparison />

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-8 text-center">
        <p className="text-sm text-muted-foreground">
          Every figure here is the same one your report shows —{" "}
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
