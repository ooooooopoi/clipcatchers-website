"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PAID_SOCIAL_CPM,
  RATE_PER_THOUSAND,
  estimateViews,
  paidSocialEquivalent,
} from "@/lib/pricing";

/**
 * Pricing, with the arithmetic done for you.
 *
 * The old block stated the rate and left two worked examples underneath, which
 * answers the question only for the two people whose budget happens to be
 * $500 or $2,500. A slider answers it for everyone, and — more useful — it
 * puts the paid-social equivalent next to the number while the reader is
 * already thinking about their own budget rather than a hypothetical one.
 *
 * Every figure here comes from lib/pricing.ts. Nothing on this page knows the
 * rate; it asks.
 */
const STOPS = [250, 500, 1000, 2500, 5000, 10000];

const INCLUDED = [
  "Unlimited clips per campaign",
  "Views read from the live post, per clip",
  "Creator accounts verified before a clip counts",
  "Total budget and per-post view caps",
  "Live dashboard, plus a share link for anyone",
  "Full per-clip report, exportable",
];

export function Pricing() {
  const [budget, setBudget] = useState(1000);

  const views = estimateViews(budget);
  const paidSocial = paidSocialEquivalent(views);
  const saved = Math.max(paidSocial - budget, 0);

  return (
    <section
      id="pricing"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold-ink">Pricing</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          One rate. No retainer.
        </h2>
        <p className="mt-4 text-muted-foreground">
          You set the budget, we bill against views that actually landed. If nothing
          delivers, you spend nothing.
        </p>
      </div>

      <div className="surface reveal mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-gold/25 bg-card">
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          {/* Calculator */}
          <div className="border-b border-border p-7 sm:p-9 lg:border-b-0 lg:border-r">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-5xl font-semibold tracking-tight text-gold-ink">
                ${RATE_PER_THOUSAND.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">per 1,000 delivered views</span>
            </div>

            <div className="mt-9">
              <div className="flex items-baseline justify-between">
                <label htmlFor="budget" className="text-sm font-medium">
                  Your budget
                </label>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  ${budget.toLocaleString()}
                </span>
              </div>

              <input
                id="budget"
                type="range"
                min={250}
                max={10000}
                step={250}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                aria-label="Campaign budget in dollars"
                className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[hsl(var(--primary))] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />

              {/* Preset stops. The slider is the fine control; these are for
                  the reader who already knows roughly what they'd spend. */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {STOPS.map((stop) => (
                  <button
                    key={stop}
                    type="button"
                    onClick={() => setBudget(stop)}
                    aria-pressed={budget === stop}
                    className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                      budget === stop
                        ? "border-primary/40 bg-primary/10 text-primary-ink"
                        : "border-border text-muted-foreground hover:border-primary/25 hover:text-foreground"
                    }`}
                  >
                    ${stop >= 1000 ? `${stop / 1000}k` : stop}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-border bg-background/60 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Should deliver about
              </p>
              <p className="mt-1.5 font-mono text-4xl font-semibold tracking-tight text-primary-ink tabular-nums">
                {views.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">views</p>

              {saved > 0 && (
                <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  The same reach bought as Meta ads at a{" "}
                  <span className="font-mono text-foreground">
                    ${PAID_SOCIAL_CPM.meta.toFixed(2)}
                  </span>{" "}
                  CPM would cost about{" "}
                  <span className="font-mono text-foreground">
                    ${Math.round(paidSocial).toLocaleString()}
                  </span>
                  {" — and the posts wouldn't stay up afterwards."}
                </p>
              )}
            </div>

            <Button asChild size="lg" className="mt-7 w-full">
              <Link href="/launch">
                Start a campaign
                <ArrowRight />
              </Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              No obligation · No card required · Reply within a day
            </p>
          </div>

          {/* Included */}
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
                  overage line on an invoice, because there is no invoice — you fund the
                  budget and it draws down.
                </p>
              </div>
              <div>
                <p className="font-medium">Running larger?</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Campaigns above 10M views are quoted individually.{" "}
                  <Link
                    href="/launch"
                    className="text-primary-ink underline-offset-4 hover:underline"
                  >
                    Tell us the number
                  </Link>{" "}
                  and we&apos;ll come back with a rate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
