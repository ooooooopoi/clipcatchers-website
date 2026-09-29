import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pricing, without a published rate.
 *
 * This was a calculator: a budget slider that worked out the views a budget
 * buys at $0.50 per 1,000 and set the paid-social equivalent beside it. On
 * 2026-09-30 the owner took the number off the site in favour of "pay per
 * view", with the rate set per campaign in the quote. Every figure the
 * calculator showed was that rate rearranged, so it went too.
 *
 * No heading of its own. The page's hero already says it, and the two used to
 * print "One rate. No retainer." one above the other.
 */
const TERMS = [
  "No retainer, no minimum term, no setup fee",
  "The rate is set for your campaign, in your quote",
  "Unspent budget is never charged",
];

const INCLUDED = [
  "Unlimited clips per campaign",
  "Views read from the live post, per clip",
  "Creator accounts verified before a clip counts",
  "Total budget and per-post view caps",
  "Live dashboard, plus a share link for anyone",
  "Full per-clip report, exportable",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-20 sm:pb-24"
    >
      <div className="surface mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="border-b border-border p-7 sm:p-9 lg:border-b-0 lg:border-r">
            {/* A plain heading, like the column beside it. A big "Pay per
                view" here repeated the page heading a few lines above. */}
            <p className="text-sm font-medium">How billing works</p>
            <p className="mt-4 text-lg leading-relaxed">
              You fund a budget and it draws down only as views land. If nothing
              delivers, you spend nothing.
            </p>

            <ul className="mt-7 space-y-3">
              {TERMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="mt-8 w-full">
              <Link href="/launch">
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="p-7 sm:p-9">
            <p className="text-sm font-medium">Every campaign includes</p>
            <ul className="mt-5 space-y-3.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" />
                  <span className="leading-relaxed text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-4 border-t border-border pt-6 text-sm">
              <div>
                <p className="font-medium">You can&apos;t overspend</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  The campaign closes itself the moment the budget is met. There is no
                  overage line on an invoice, because there is no invoice. You fund the
                  budget and it draws down.
                </p>
              </div>
              <div>
                <p className="font-medium">How the rate is set</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Every campaign is quoted.{" "}
                  <Link
                    href="/launch"
                    className="text-primary-ink underline-offset-4 hover:underline"
                  >
                    Book a 15-minute call
                  </Link>
                  , tell us what you&apos;re promoting and roughly what you&apos;d
                  spend, and we&apos;ll give you a rate and what it should deliver.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
