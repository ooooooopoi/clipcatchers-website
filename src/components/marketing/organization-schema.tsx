/**
 * Organization structured data, so search engines have something to attach the
 * name and the mark to.
 *
 * ── Two different "logo in Google" things, often confused ────────────────
 * The small icon beside a search result is the **favicon**, and it comes from
 * src/app/icon.png — nothing here affects it. This block feeds the other one:
 * the logo a knowledge panel or a brand result can show. Both were missing, so
 * both are being added, but they are separate mechanisms and fixing one does
 * not fix the other.
 *
 * ── What this cannot promise ─────────────────────────────────────────────
 * Google decides whether to show either, and only after it next crawls. Valid
 * markup is necessary and not sufficient; a brand result in particular usually
 * wants corroborating signals the site cannot supply about itself. So this is
 * "we have stopped giving them a reason not to", not "the logo will appear".
 *
 * Rendered on the homepage only. It describes the organisation, and repeating
 * the same entity on twelve pages tells a crawler nothing extra.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://clipcatchers.net";

export function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Clip Catchers",
    url: SITE,
    // Absolute, and a real file: a crawler fetches this from the open web, so
    // a relative path or anything behind auth is the same as no logo at all.
    // 256x256 square, comfortably over the 112px minimum.
    logo: `${SITE}/logo.png`,
    description:
      "Performance-based creator distribution. Brands fund a budget, verified " +
      "creators cut and post clips, and delivery is billed per 1,000 views read " +
      "from the live post.",
    sameAs: ["https://discord.gg/7NYnJK7eqq"],
  };

  return (
    <script
      type="application/ld+json"
      // The content is a literal built above, not anything a visitor supplies,
      // so there is no injection surface here. JSON.stringify also escapes the
      // one character that would matter.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
