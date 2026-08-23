import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { effectiveCpm } from "@/lib/pricing";

/**
 * The figures on the public homepage, read from the database.
 *
 * They used to be typed into the page by hand — 40.7M in one place, 40M+ on
 * the quote page — which means they were wrong the day after they were
 * written and nobody could tell by looking. These come from the same rows the
 * client dashboards render, so the marketing claim and the client's own report
 * can't disagree.
 *
 * ── On naming clients ────────────────────────────────────────────────────
 * A brand appearing in our marketing is a thing they agree to, not a thing
 * they get. A client is named only if they're on this list, and everyone else
 * is anonymised — they still contribute to the totals and still show their
 * real numbers, just without a name attached.
 *
 * Add a name by putting it in NAMED_CLIENTS below, or without a deploy via the
 * PUBLIC_CLIENTS env var (comma-separated), using the brand name exactly as it
 * appears in the dashboard:
 *
 *   PUBLIC_CLIENTS="Northwind Records,Acme Games"
 *
 * Keep this in step with the logo strip in components/marketing/clients.tsx —
 * a client named in one place and anonymised in the other looks like a leak.
 */
const NAMED_CLIENTS = ["Silent Collision"];

const PUBLIC_CLIENTS = new Set(
  [...NAMED_CLIENTS, ...(process.env.PUBLIC_CLIENTS || "").split(",")]
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean),
);

export type ClientRow = {
  /** Display label — the real brand name, or an anonymised stand-in. */
  label: string;
  named: boolean;
  views: number;
  clips: number;
  campaigns: number;
  spentCents: number;
  /**
   * What this client actually paid per 1,000 views — their own number, from
   * their own spend and their own delivery. Not the list rate and not an
   * average across everyone: a campaign that closed early, got trimmed to
   * budget or overdelivered lands somewhere different, and that difference is
   * the whole point of showing it.
   */
  cpm: number;
};

export type PublicStats = {
  totalViews: number;
  totalClips: number;
  creators: number;
  campaigns: number;
  clients: ClientRow[];
  /** False when the database couldn't be reached, so callers can fall back. */
  live: boolean;
};

async function query(): Promise<PublicStats> {
  // Grouped in the database rather than pulled and reduced here: a brand with
  // several campaigns is one client, and the row count is small either way.
  const grouped = await prisma.campaign.groupBy({
    by: ["brandName"],
    _sum: { totalViews: true, clipCount: true, spentCents: true },
    _count: { _all: true },
    // PENDING campaigns haven't been approved and may never run; counting them
    // would inflate the totals with work that hasn't happened.
    where: { status: { not: "PENDING" } },
    orderBy: { _sum: { totalViews: "desc" } },
  });

  // Distinct creator handles across every clip. `handle` is empty on clips
  // that predate handle capture, so those are excluded rather than counted as
  // one shared anonymous creator.
  const handles = await prisma.campaignClip.findMany({
    where: { handle: { not: "" } },
    distinct: ["handle"],
    select: { handle: true },
  });

  const clients: ClientRow[] = grouped.map((row) => {
    const named = PUBLIC_CLIENTS.has(row.brandName.trim().toLowerCase());
    const views = row._sum.totalViews ?? 0;
    const spentCents = row._sum.spentCents ?? 0;
    return {
      label: named ? row.brandName : "Undisclosed client",
      named,
      views,
      clips: row._sum.clipCount ?? 0,
      campaigns: row._count._all,
      spentCents,
      cpm: effectiveCpm(spentCents, views),
    };
  });

  return {
    totalViews: clients.reduce((sum, c) => sum + c.views, 0),
    totalClips: clients.reduce((sum, c) => sum + c.clips, 0),
    creators: handles.length,
    campaigns: clients.reduce((sum, c) => sum + c.campaigns, 0),
    clients,
    live: true,
  };
}

/**
 * Cached for an hour. The homepage is the most-hit route on the site and these
 * numbers move slowly — an hour old is well inside the accuracy anyone reading
 * a marketing page needs, and it keeps a traffic spike off the database.
 */
const cached = unstable_cache(query, ["public-stats"], {
  revalidate: 3600,
  tags: ["public-stats"],
});

export async function getPublicStats(): Promise<PublicStats> {
  try {
    return await cached();
  } catch (error) {
    // A homepage that 500s because the database is briefly unreachable is a
    // far worse outcome than one showing no figures, so the caller gets an
    // empty result and renders the page without the numbers.
    console.error("public-stats: couldn't read the totals", error);
    return {
      totalViews: 0,
      totalClips: 0,
      creators: 0,
      campaigns: 0,
      clients: [],
      live: false,
    };
  }
}
