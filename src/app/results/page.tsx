import type { Metadata } from "next";
import Link from "next/link";
import { ImpressionCounter } from "@/components/marketing/impressions";
import { PageShell } from "@/components/marketing/page-shell";
import { Results } from "@/components/marketing/results";
import { getPublicStats } from "@/lib/public-stats";

const TITLE = "Results";
const SOCIAL_TITLE = "Results — Clip Catchers";
const DESCRIPTION =
  "Views we've actually delivered, read from live posts and logged per clip. Not a case study deck — the same reporting each client sees on their own campaign.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/results" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/results",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

/**
 * The numbers page.
 *
 * ── Why there is so little editorial here ───────────────────────────────
 * Because the Results component below is generated from live reporting and
 * this page's whole claim is that nobody wrote the figures by hand. Wrapping
 * it in three paragraphs of interpretation would be the thing it is arguing
 * against. The copy explains where the numbers come from and what is missing
 * from them, and then gets out of the way.
 *
 * What is deliberately absent: per-client CPM and spend. Those are reported to
 * the client they belong to and nowhere else, and with a small enough set of
 * campaigns a published average is reverse-engineerable back to one of them.
 */
export default async function ResultsPage() {
  const stats = await getPublicStats();

  return (
    <PageShell
      eyebrow="Results"
      title="Views we've actually delivered"
      intro={
        <>
          Every figure below is read off live posts and logged per clip. It is the same
          reporting each client sees on their own campaign, with the names removed.
        </>
      }
      compact
    >
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <ImpressionCounter stats={stats} size="lg" />
      </section>

      <Results />

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <div className="surface reveal rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="display text-xl">What isn&apos;t on this page</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">Client names, mostly.</span> A few have
              agreed to be named and have a case study. Most prefer not to be, and that is
              their call rather than ours — their campaigns are still counted in the
              figures above.
            </li>
            <li>
              <span className="text-foreground">Per-client cost.</span> What an individual
              client spent, and what their effective CPM came out at, goes to that client
              and no further. Across a small enough set of campaigns an average is just a
              slower way of publishing one of them.
            </li>
            <li>
              <span className="text-foreground">Our best campaign, framed as typical.</span>{" "}
              The totals are sums across everything we&apos;ve run, including the ones that
              underperformed. A page that only showed the wins would be a different page.
            </li>
          </ul>
          <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
            If you want to interrogate a specific campaign rather than a total, ask on a
            call — we&apos;ll walk you through one line by line.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-8 text-center">
        <p className="text-sm text-muted-foreground">
          How these numbers are collected:{" "}
          <Link
            href="/verification"
            className="text-primary-ink underline-offset-4 hover:underline"
          >
            verification
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
