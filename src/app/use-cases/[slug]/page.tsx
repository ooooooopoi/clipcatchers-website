import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { ImpressionCounter } from "@/components/marketing/impressions";
import { PageShell } from "@/components/marketing/page-shell";
import { getPublicStats } from "@/lib/public-stats";
import { USE_CASES, useCaseBySlug } from "@/lib/use-cases";

/**
 * One category, in enough depth to answer "what would creators post about us?"
 *
 * Statically known, so the eight paths are generated rather than rendered on
 * demand — and an unknown slug 404s instead of rendering an empty page under a
 * heading made from the URL, which is how these templates usually leak.
 */
export function generateStaticParams() {
  return USE_CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = useCaseBySlug(slug);
  if (!c) return {};

  const social = `${c.name} — Clip Catchers`;
  return {
    title: c.name,
    description: c.intro,
    robots: { index: true, follow: true },
    alternates: { canonical: `/use-cases/${c.slug}` },
    openGraph: {
      title: social,
      description: c.intro,
      type: "website",
      url: `/use-cases/${c.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
    },
    twitter: { card: "summary_large_image", title: social, description: c.intro },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = useCaseBySlug(slug);
  if (!c) notFound();

  const stats = await getPublicStats();
  const others = USE_CASES.filter((x) => x.slug !== c.slug).slice(0, 3);

  return (
    <PageShell eyebrow={c.name} title={c.headline} intro={c.intro}>
      {/* What you hand over — answered first, because it is the question that
          decides whether this is a project or a purchase. */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface reveal rounded-2xl border border-border bg-card p-6">
            <h2 className="display text-xl">What you hand over</h2>
            <ul className="mt-4 space-y-2.5">
              {c.assets.map((a) => (
                <li key={a} className="flex gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface reveal rounded-2xl border border-border bg-card p-6">
            <h2 className="display text-xl">What the brief locks down</h2>
            <ul className="mt-4 space-y-2.5">
              {c.rules.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-foreground/30"
                  />
                  <span className="text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground/80">
              Clips that break these are rejected and earn nothing — the creator carries
              that cost, not you.
            </p>
          </div>
        </div>
      </section>

      {/* The angles. The part a competitor's homepage won't give them. */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-primary-ink">The cuts</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">How creators actually cut it</h2>
          <p className="mt-4 text-muted-foreground">
            You don&apos;t have to pick one. A campaign usually runs several at once,
            and the mix is what tells you which angle your audience responds to.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {c.angles.map((a, i) => (
            <div
              key={a.title}
              className="surface reveal rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-mono text-xs text-muted-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display-sm mt-3 text-base">{a.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The caveat. One per category and it has to be a real one — see the
          note in lib/use-cases.ts. */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <div className="surface reveal rounded-2xl border border-warning/30 bg-warning/[0.06] p-6">
          <div className="flex gap-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <h2 className="display-sm text-sm">Worth knowing before you brief it</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.caveat}</p>
            </div>
          </div>
        </div>
      </section>

      {/* The measured figure, in the same place on every category page. It is
          the whole network's delivery, not this category's — see the note in
          lib/use-cases.ts on why there is no per-category number. */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <ImpressionCounter
          stats={stats}
          label="impressions delivered across every category"
        />
      </section>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-8">
        <p className="eyebrow text-center text-muted-foreground/70">Other categories</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/use-cases/${o.slug}`}
              className="surface lift group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 hover:border-[hsl(var(--border-strong))]"
            >
              <span className="display-sm text-sm">{o.name}</span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
        <p className="mt-5 text-center text-sm">
          <Link
            href="/use-cases"
            className="text-primary-ink underline-offset-4 hover:underline"
          >
            See all eight →
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
