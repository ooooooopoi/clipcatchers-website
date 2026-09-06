import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

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
// Empty by choice. Silent Collision was named here and has been withdrawn —
// their campaigns still contribute every figure on the site, they're just
// anonymised like everyone else now.
//
// Removing a name from this list is all it takes: the Results rows relabel to
// "Undisclosed client", the case-study page stops resolving that slug, the
// sitemap stops advertising it, and the closing CTA drops its "see a real
// campaign's numbers" button rather than pointing at a page that would refuse
// to render. Nothing else needs editing — except the card in
// components/marketing/clients.tsx, which keeps its own list.
export const NAMED_CLIENTS: string[] = [];

const PUBLIC_CLIENTS = new Set(
  [...NAMED_CLIENTS, ...(process.env.PUBLIC_CLIENTS || "").split(",")]
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean),
);

/**
 * ── Why there is no spend or CPM on this type ────────────────────────────
 * There was, and it was on the homepage. The figure it showed was not what
 * the client paid. A campaign's reported spend falls back to the *clipper*
 * budget unless `client_budget` is set on it in the bot, and that column
 * defaults to 0 — so "their CPM" was our cost per 1,000 views, printed a few
 * sections above a Pricing block advertising $0.50. That makes the margin
 * public and, worse, arithmetic.
 *
 * Views are ours to publish. What delivery cost us is not, and it stays off
 * every type the marketing pages can reach, so it can't return by someone
 * rendering a field that happened to be sitting there. A client's own spend
 * is still on their own signed report and in their dashboard, which is where
 * it belongs.
 *
 * If `client_budget` is ever filled in per campaign, the reported figure
 * becomes what the client was actually invoiced and a real client-side CPM
 * can come back — deliberately, not by leftover.
 */
export type ClientRow = {
  /** Display label — the real brand name, or an anonymised stand-in. */
  label: string;
  named: boolean;
  views: number;
  clips: number;
  campaigns: number;
};

export type PublicStats = {
  totalViews: number;
  totalClips: number;
  creators: number;
  campaigns: number;
  clients: ClientRow[];
  /**
   * Delivery rate in views per second, measured over the last 30 days.
   *
   * CampaignMetric.views is a daily delta, not a running total — the bot
   * differences consecutive snapshots before it sends them ("Consecutive
   * snapshots differ by that day's delivery") — so summing a date range gives
   * real delivery for that range rather than double-counting a cumulative
   * figure.
   *
   * 0 when there is no delivery in the window, which is the signal to show a
   * still number rather than a counter ticking at a rate nothing supports.
   */
  viewsPerSecond: number;
  /**
   * Epoch ms at which `totalViews` was read.
   *
   * Captured inside the cached function, so it records when the database
   * actually answered rather than when a page happened to render. That gap is
   * up to the full hour of `revalidate`, and at ~69 views a second an hour is
   * a quarter of a million views — a counter anchored on the figure without
   * the timestamp starts a quarter-million short and stays there.
   */
  asOf: number;
  /** False when the database couldn't be reached, so callers can fall back. */
  live: boolean;
};

/** 30 days in seconds — the window the delivery rate is measured over. */
const RATE_WINDOW_DAYS = 30;
const RATE_WINDOW_SECONDS = RATE_WINDOW_DAYS * 24 * 60 * 60;

async function query(): Promise<PublicStats> {
  // Grouped in the database rather than pulled and reduced here: a brand with
  // several campaigns is one client, and the row count is small either way.
  const grouped = await prisma.campaign.groupBy({
    by: ["brandName"],
    _sum: { totalViews: true, clipCount: true },
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

  // Delivery over the rate window, for the ticking counter on the homepage.
  // Excludes PENDING for the same reason the totals do: work that may never
  // happen shouldn't set the rate at which the page claims work is happening.
  //
  // ── Why the first row of each campaign is thrown away ──────────────────
  // The bot differences consecutive snapshots to get a daily delta, and it
  // starts each campaign from zero:
  //
  //     metrics, prev_views, prev_spend = [], 0, 0
  //     for row in await database.snapshots_for(camp["id"]):
  //         d_views = max(0, row["views"] - prev_views)
  //
  // So a campaign's earliest row isn't a day's delivery — it's that
  // campaign's entire history to that point, recorded as one day. Summing the
  // window naively meant every campaign that started inside it dumped its
  // whole lifetime into the rate. Measured on production that put 30-day
  // delivery at 184.8M against a lifetime total of 188.5M: 98% of everything
  // ever delivered, supposedly in one month.
  //
  // Cheap to drop: 19 campaigns over 30 days is a few hundred rows, so the
  // filtering happens here rather than as a second round trip.
  const since = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000);
  const [windowRows, firstDates] = await Promise.all([
    prisma.campaignMetric.findMany({
      where: { date: { gte: since }, campaign: { status: { not: "PENDING" } } },
      select: { campaignId: true, date: true, views: true },
    }),
    prisma.campaignMetric.groupBy({
      by: ["campaignId"],
      _min: { date: true },
    }),
  ]);

  const seedRow = new Map(
    firstDates.map((r) => [r.campaignId, r._min.date?.getTime() ?? -1]),
  );
  const viewsInWindow = windowRows.reduce(
    (sum, r) => (r.date.getTime() === seedRow.get(r.campaignId) ? sum : sum + r.views),
    0,
  );

  const clients: ClientRow[] = grouped.map((row) => {
    const named = PUBLIC_CLIENTS.has(row.brandName.trim().toLowerCase());
    return {
      label: named ? row.brandName : "Undisclosed client",
      named,
      views: row._sum.totalViews ?? 0,
      clips: row._sum.clipCount ?? 0,
      campaigns: row._count._all,
    };
  });

  const totalViews = clients.reduce((sum, c) => sum + c.views, 0);

  // A month cannot have delivered more than everything ever delivered. If it
  // reads that way the deltas are wrong again in some new way, and a counter
  // racing on bad arithmetic is worse than one that sits still — so this
  // stops rather than guesses. Seed rows were one cause; this catches the
  // next one without needing to know what it is.
  const rateIsCredible = viewsInWindow > 0 && viewsInWindow <= totalViews;

  return {
    totalViews,
    totalClips: clients.reduce((sum, c) => sum + c.clips, 0),
    creators: handles.length,
    campaigns: clients.reduce((sum, c) => sum + c.campaigns, 0),
    clients,
    viewsPerSecond: rateIsCredible ? viewsInWindow / RATE_WINDOW_SECONDS : 0,
    asOf: Date.now(),
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

/** Same rule as ClientRow above: delivery is public, cost is not. */
export type CaseStudyCampaign = {
  name: string;
  views: number;
  clips: number;
  platforms: string[];
  startedAt: string | null;
};

export type CaseStudy = {
  brand: string;
  campaigns: CaseStudyCampaign[];
  totalViews: number;
  totalClips: number;
  creators: number;
};

/**
 * One named client's campaigns, for their case-study page.
 *
 * Only ever returns a client on the allowlist. A slug that happens to match
 * an unlisted brand gets nothing rather than a page — otherwise the URL
 * becomes a way to read out clients who never agreed to be named, which is
 * the one thing the allowlist exists to prevent.
 */
export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const wanted = [...PUBLIC_CLIENTS];
  const match = wanted.find((name) => slugify(name) === slug);
  if (!match) return null;

  try {
    const rows = await prisma.campaign.findMany({
      where: {
        brandName: { equals: match, mode: "insensitive" },
        status: { not: "PENDING" },
      },
      orderBy: { createdAt: "asc" },
      select: {
        name: true, totalViews: true, clipCount: true,
        platforms: true, startDate: true, createdAt: true, brandName: true,
      },
    });
    if (rows.length === 0) return null;

    const handles = await prisma.campaignClip.findMany({
      where: { campaign: { brandName: { equals: match, mode: "insensitive" } },
               handle: { not: "" } },
      distinct: ["handle"],
      select: { handle: true },
    });

    const campaigns = rows.map((r) => ({
      name: r.name,
      views: r.totalViews,
      clips: r.clipCount,
      platforms: r.platforms,
      startedAt: (r.startDate ?? r.createdAt)?.toISOString() ?? null,
    }));

    return {
      brand: rows[0].brandName,
      campaigns,
      totalViews: campaigns.reduce((s, c) => s + c.views, 0),
      totalClips: campaigns.reduce((s, c) => s + c.clips, 0),
      creators: handles.length,
    };
  } catch (error) {
    console.error("case-study: couldn't read", slug, error);
    return null;
  }
}

/** URL form of a brand name. Kept here so the page and the link agree. */
export function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}

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
      // Nothing was read, so there is no measured rate to tick at. The
      // fallback path shows the hand-recorded totals, which don't move.
      viewsPerSecond: 0,
      asOf: Date.now(),
      live: false,
    };
  }
}
