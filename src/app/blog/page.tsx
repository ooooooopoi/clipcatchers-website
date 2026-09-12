import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSessionUser } from "@/lib/auth-helpers";
import { sortedPosts } from "@/lib/blog";

const TITLE = "Blog";
const DESCRIPTION =
  "Notes on running creator campaigns — verification, pricing, and what the numbers on a campaign report actually mean.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Public, unlike the app. The root layout sets noindex for everything, so
  // every public page has to opt back in for itself.
  robots: { index: true, follow: true },
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${TITLE} · Clip Catchers`,
    description: DESCRIPTION,
    type: "website",
    url: "/blog",
  },
};

export default async function BlogIndex() {
  const user = await getSessionUser();
  const posts = sortedPosts();

  return (
    <div className="relative min-h-screen">
      <SiteHeader signedIn={Boolean(user)} />

      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-14 sm:pt-20">
        <p className="eyebrow text-primary-ink">Blog</p>
        <h1 className="display mt-3 text-4xl sm:text-6xl">
          NOTES FROM RUNNING CAMPAIGNS
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          What we have learned paying for delivery rather than promises — how views get
          checked, where budgets leak, and what to ask anyone who sends you a campaign
          report.
        </p>

        <ul className="mt-12 divide-y divide-border border-t border-border">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block py-7 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <time dateTime={post.published}>
                    {new Date(post.published).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <h2 className="display-sm mt-2 text-xl sm:text-2xl">{post.title}</h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                  {post.summary}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read it
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </div>
  );
}
