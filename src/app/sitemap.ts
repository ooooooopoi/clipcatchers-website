import type { MetadataRoute } from "next";
import { NAMED_CLIENTS, slugify } from "@/lib/public-stats";

/**
 * There wasn't one, and the root layout defaults every route to noindex — so
 * the only two public pages opted back in individually and nothing told a
 * crawler they existed. Both are listed here explicitly; the dashboard, the
 * auth screens and the signed share reports are all correctly left out, since
 * they're private by design.
 */
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://clipcatchers.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/launch`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    // Case studies are generated per named client, so they're listed from the
    // same allowlist the pages themselves check — a slug here that the page
    // would refuse is a sitemap advertising a 404.
    ...NAMED_CLIENTS.map((name) => ({
      url: `${BASE}/case-studies/${slugify(name)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
