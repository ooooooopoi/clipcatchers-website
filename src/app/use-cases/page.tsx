import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/marketing/page-shell";
import { USE_CASES } from "@/lib/use-cases";

const TITLE = "Use cases";
const SOCIAL_TITLE = "Use cases — Clip Catchers";
const DESCRIPTION =
  "What a clipping campaign actually looks like in your category — music, gaming, apps, crypto, iGaming, podcasts, consumer brands and SaaS.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/use-cases" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/use-cases",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

/**
 * The index over the eight category pages.
 *
 * Exists as its own page and not only as a menu because the menu assumes you
 * already know which of eight you are. A founder who describes themselves as
 * "a marketplace" doesn't, and the menu gives them eight labels and no way to
 * choose between them; this gives them the sentence under each.
 */
export default function UseCasesPage() {
  return (
    <PageShell
      eyebrow="Use cases"
      title="What this looks like in your category"
      intro={
        <>
          The mechanism is identical everywhere — a budget, a brief and a network. What
          changes is the footage you hand over, how creators cut it, and what the brief
          has to lock down.
        </>
      }
    >
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((c) => (
            <Link
              key={c.slug}
              href={`/use-cases/${c.slug}`}
              className="surface lift reveal group flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-[hsl(var(--border-strong))]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                <c.icon className="h-4 w-4 text-primary-ink" />
              </span>
              <h2 className="display-sm mt-4 text-base">{c.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {c.intro.split(". ")[0]}.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-ink">
                How it runs here
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Not on the list?{" "}
          <Link href="/launch" className="text-primary-ink underline-offset-4 hover:underline">
            Tell us what you&apos;re promoting
          </Link>{" "}
          — the model doesn&apos;t care what the category is.
        </p>
      </section>
    </PageShell>
  );
}
