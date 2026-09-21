import type { MetadataRoute } from "next";

/**
 * Crawlers get the two marketing pages and nothing else.
 *
 * `/c/` matters most here: those are signed share links to live client
 * reports. They already carry noindex, but a report is only private because
 * the URL is unguessable, and there's no reason to let a crawler that somehow
 * sees one go and fetch it.
 */
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://clipcatchers.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /brief/ is on the list for the same reason /c/ is: a brief carries a
      // rate and a budget, which is a commercial position rather than
      // something to be indexed.
      disallow: [
        "/api/",
        "/dashboard",
        "/campaigns",
        "/analytics",
        "/billing",
        "/settings",
        "/c/",
        "/team/",
        "/brief/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
