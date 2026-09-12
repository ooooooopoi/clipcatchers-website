import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth-helpers";
import { POSTS, getPost } from "@/lib/blog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://clipcatchers.net";

/** Static at build time. There are a handful of posts and they don't change per request. */
export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found", robots: { index: false, follow: false } };

  return {
    title: post.title,
    description: post.summary,
    robots: { index: true, follow: true },
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.published,
      url: `/blog/${post.slug}`,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const user = await getSessionUser();

  // Article markup, so a search result can carry a headline and a date rather
  // than guessing both from the page. Separate from the Organization block on
  // the homepage: that describes who publishes, this describes what was
  // published.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.published,
    dateModified: post.published,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
    author: { "@type": "Organization", name: "Clip Catchers", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "Clip Catchers",
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
    },
  };

  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <SiteHeader signedIn={Boolean(user)} />

      <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-14 sm:pt-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All posts
        </Link>

        <article className="mt-6">
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

          <h1 className="display mt-3 text-3xl sm:text-5xl">{post.title}</h1>

          {post.intro.map((para) => (
            <p key={para} className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}

          {post.sections.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="display-sm text-xl sm:text-2xl">{section.heading}</h2>
              {section.paragraphs.map((para) => (
                <p key={para} className="mt-4 leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </article>

        {/* The post argues that a buyer should audit whoever they fund. Ending
            on a "book a call" would undercut it; ending on the page that
            explains how the checks work here does not. */}
        <div className="mt-16 rounded-2xl border border-border bg-muted/40 p-7">
          <h2 className="display-sm text-lg">Run these checks on us</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Every figure we report is read off the live post and traces back to a single
            clip you can open. Here is exactly how that works.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/verification">How verification works</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/launch">Start a campaign</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
