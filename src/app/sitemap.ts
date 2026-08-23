import type { MetadataRoute } from "next";

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
  ];
}
