import type { MetadataRoute } from "next";
import { NAMED_CLIENTS, slugify } from "@/lib/public-stats";
import { USE_CASES } from "@/lib/use-cases";
import { sortedPosts } from "@/lib/blog";

/**
 * There wasn't one, and the root layout defaults every route to noindex — so
 * the only two public pages opted back in individually and nothing told a
 * crawler they existed. Everything public is listed here; the dashboard, the
 * auth screens and the signed share reports are all correctly left out, since
 * they're private by design.
 *
 * ── A page listed here must also be in auth.config's allowlist ──────────
 * Otherwise this advertises a URL that answers with a 307 to /login, which is
 * worse than not listing it: the crawler indexes a sign-in page under your
 * pricing page's URL. The two lists are separate because auth.config is
 * bundled into edge middleware and can't import this module's dependencies —
 * see the note there.
 */
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://clipcatchers.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    // The two conversion pages, and the one that explains the product. These
    // carry the highest priority after the homepage because they are what a
    // search for the category should land on.
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/launch`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // Results changes as campaigns run; the rest of these are static copy.
    { url: `${BASE}/results`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/verification`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/use-cases`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/for-creators`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },

    // The category pages, from the same list that generates them — a slug
    // here that USE_CASES doesn't contain is a sitemap advertising a 404.
    ...USE_CASES.map((c) => ({
      url: `${BASE}/use-cases/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),

    // Case studies are generated per named client, so they're listed from the
    // same allowlist the pages themselves check.
    ...NAMED_CLIENTS.map((name) => ({
      url: `${BASE}/case-studies/${slugify(name)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // The blog index and every post, mapped from the same array the pages
    // render from — so a post that exists is listed, and a slug listed here
    // can't be one the route would 404 on.
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...sortedPosts().map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.published),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),

    { url: `${BASE}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
