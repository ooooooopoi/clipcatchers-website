import { USE_CASES } from "@/lib/use-cases";

/**
 * The public site's navigation, in one place.
 *
 * ── Why the name ────────────────────────────────────────────────────────
 * lib/nav.ts already exists and is the signed-in dashboard's sidebar —
 * MAIN_NAV, SECONDARY_NAV, isActive, consumed by sidebar-nav, search-command
 * and keyboard-shortcuts. Two navigations for two audiences that should never
 * import each other, so this one carries the qualifier.
 *
 * It was three places: a SECTIONS list in the header for the on-page anchors,
 * a separate hand-written column in the footer, and whatever each page linked
 * to inline. They disagreed — the footer offered links the header didn't and
 * neither knew about /case-studies. With the site split into real pages that
 * drift becomes a dead link rather than a missing menu item, so both the
 * header and the footer read from here.
 *
 * ── If you add a page ────────────────────────────────────────────────────
 * Add it here AND to the public allowlist in auth.config.ts. Everything under
 * / is behind a session by default; a marketing page that isn't allowlisted
 * doesn't 404, it 307s to /login, which looks like the page is broken rather
 * than missing. Add it to sitemap.ts too, or the page exists and nothing
 * tells a crawler so.
 */
export type NavLink = { href: string; label: string; blurb?: string };
export type NavGroup = { label: string; href: string; links: NavLink[] };

/** Top-level items with a menu under them. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Use cases",
    // The label is a link in its own right, not just a menu opener — someone
    // who doesn't know which category they are lands on the index.
    href: "/use-cases",
    links: USE_CASES.map((c) => ({
      href: `/use-cases/${c.slug}`,
      label: c.name,
      blurb: c.goal,
    })),
  },
  {
    label: "Why us",
    href: "/how-it-works",
    links: [
      {
        href: "/pricing",
        label: "Pricing",
        blurb: "One rate, no retainer, and a ceiling you set",
      },
      {
        href: "/verification",
        label: "Verification",
        blurb: "How a view becomes a billed view",
      },
      {
        href: "/results",
        label: "Results",
        blurb: "Views we've actually delivered",
      },
    ],
  },
];

/** Top-level items that are just a link. */
export const NAV_LINKS: NavLink[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-creators", label: "For creators" },
];

/**
 * Every marketing URL, for the sitemap and for the auth allowlist to be
 * checked against. Flattened rather than maintained separately, because a
 * page missing from here is a page Google never sees.
 */
export function allMarketingPaths(): string[] {
  return [
    "/",
    "/launch",
    ...NAV_LINKS.map((l) => l.href),
    ...NAV_GROUPS.flatMap((g) => [g.href, ...g.links.map((l) => l.href)]),
  ].filter((v, i, a) => a.indexOf(v) === i);
}
