import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { formatCompact } from "@/lib/format";
import { PAID_SOCIAL_CPM, RATE_PER_THOUSAND } from "@/lib/pricing";
import { getCaseStudy } from "@/lib/public-stats";

/**
 * One client's campaigns, every figure read from the database.
 *
 * The homepage can only ever say "40.7M views" — true, and impossible to
 * check. This is the page a brand opens to see whether the claim survives
 * being taken apart: campaign by campaign, what it cost, what it returned,
 * and what the same reach would have cost as paid social.
 *
 * Nothing here is written by hand, which is the point. A case study assembled
 * in a doc is a snapshot of the best week; this can't flatter itself, and it
 * can't go stale.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const study = await getCaseStudy((await params).slug);
  if (!study) return { title: "Case study", robots: { index: false } };

  const title = `${study.brand} — ${formatCompact(study.totalViews)} views`;
  const description =
    `${study.campaigns.length} campaign${study.campaigns.length === 1 ? "" : "s"}, ` +
    `${formatCompact(study.totalViews)} views delivered by ${study.creators} creators ` +
    `across ${study.totalClips.toLocaleString()} clips. Every figure read from live reporting.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: { title: `${title} · Clip Catchers`, description, type: "article" },
    twitter: { card: "summary_large_image", title: `${title} · Clip Catchers`, description },
  };
}

export default async function CaseStudyPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const study = await getCaseStudy((await params).slug);
  // Also the path for a brand that isn't on the allowlist — a URL shouldn't
  // be a way to read out a client who never agreed to be named.
  if (!study) notFound();

  // What this delivery would have cost bought as ads, against our list rate.
  // Deliberately not against what this client actually spent: reported spend
  // is our clipper cost until client_budget is set on a campaign, so printing
  // it here would publish the margin. See the note on ClientRow in
  // lib/public-stats.ts.
  const paidSocial = (study.totalViews / 1000) * PAID_SOCIAL_CPM.meta;
  const atListRate = (study.totalViews / 1000) * RATE_PER_THOUSAND;
  const saved = Math.max(paidSocial - atListRate, 0);

  return (
    <div className="relative min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-tight">Clip Catchers</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 py-14">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
          Case study
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {study.brand}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          {study.campaigns.length} campaign{study.campaigns.length === 1 ? "" : "s"} run
          with us. Every figure below is read from the same reporting the client sees —
          not written up afterwards.
        </p>

        <div className="surface mt-10 grid grid-cols-2 divide-x divide-y divide-border rounded-2xl border border-border bg-card sm:grid-cols-4 sm:divide-y-0">
          {[
            { value: formatCompact(study.totalViews), label: "views delivered" },
            { value: study.totalClips.toLocaleString(), label: "clips published" },
            { value: study.creators.toLocaleString(), label: "creators" },
            {
              value: study.campaigns.length.toLocaleString(),
              label: `campaign${study.campaigns.length === 1 ? "" : "s"}`,
            },
          ].map((s) => (
            <div key={s.label} className="px-5 py-7 text-center">
              <p className="font-mono text-2xl font-semibold tracking-tight text-primary-ink sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-semibold tracking-tight">Campaign by campaign</h2>
        <div className="surface mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-6 border-b border-border px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground/70 sm:grid">
            <span>Campaign</span>
            <span className="text-right">Views</span>
            <span className="text-right">Clips</span>
          </div>
          <ul className="divide-y divide-border">
            {study.campaigns.map((c) => (
              <li
                key={c.name}
                className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 px-6 py-4 sm:grid-cols-[1fr_auto_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.platforms.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.platforms.join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-right font-mono text-sm font-semibold tabular-nums">
                  {formatCompact(c.views)}
                </span>
                <span className="hidden text-right font-mono text-sm text-muted-foreground tabular-nums sm:block">
                  {c.clips.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {saved > 0 && (
          <div className="surface mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">
              What the same reach costs as paid social
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {formatCompact(study.totalViews)} views bought as Meta ads at a conservative $
              {PAID_SOCIAL_CPM.meta.toFixed(2)} CPM would have cost about{" "}
              <span className="font-mono text-foreground">
                ${Math.round(paidSocial).toLocaleString()}
              </span>
              . At our rate of ${RATE_PER_THOUSAND.toFixed(2)} per 1,000, the same
              delivery comes to{" "}
              <span className="font-mono text-foreground">
                ${Math.round(atListRate).toLocaleString()}
              </span>
              .
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              And the posts are still up. Paid impressions stop the moment the spend
              does; these clips keep earning views nobody paid for — so the real cost
              per thousand falls over time rather than holding.
            </p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/launch">
              Start a campaign
              <ArrowRight />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No retainer · No minimum term · You only pay for delivered views
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
