import type { Metadata } from "next";
import { BadgeDollarSign } from "lucide-react";
import { CampaignCard } from "@/components/clipper/campaign-card";
import { CampaignFilter, type CampaignType } from "@/components/clipper/campaign-filter";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { isPaidAds, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Explore" };

// The figures come from the bot and change as views are read; nothing here
// should be cached between visits.
export const dynamic = "force-dynamic";

/**
 * Browse what's open and submit to it — the campaigns grid, moved off the
 * landing page.
 *
 * The landing used to be this grid, which made the site read as a catalogue:
 * fine on the first visit, wrong on every visit after, because a returning
 * clipper is coming back for their own numbers. Now the landing is theirs and
 * the catalogue is here.
 */
export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; sig: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { userId, sig } = await params;
  const { type } = await searchParams;

  const filter: CampaignType =
    type === "active" || type === "ended" ? type : "all";

  const { campaigns, accounts, offline } = await loadClipper(userId, sig);
  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  // Paid-ad campaigns live on their own board. Excluded here rather than
  // merely sorted lower, because their rates assume money is going behind the
  // clip — listed beside organic ones, the higher number reads as the better
  // deal to someone who has no intention of spending, and they are underpaid
  // for the work they actually do.
  const organic = campaigns.filter((c) => !isPaidAds(c));

  const shown = organic
    .filter((c) =>
      filter === "all" ? true : filter === "active" ? c.active : !c.active,
    )
    // Live first, then most recently opened. A clipper browsing for something
    // to cut wants what is open; the ended ones are here to look back at.
    .sort((a, b) => Number(b.active) - Number(a.active) || b.id - a.id);

  const active = organic.filter((c) => c.active);
  const liveAds = campaigns.filter((c) => isPaidAds(c) && c.active).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Explore"
          subtitle="Browse campaigns and submit clips to the ones that are live."
        />
        {/* The filter links carry ?type= on this page's own path. */}
        {!offline ? <CampaignFilter value={filter} base={`${base}/explore`} /> : null}
      </div>

      {/* Moving these onto their own board hides them from this page, so it
          has to point at them — otherwise the separation costs the campaigns
          their audience. Only when some are live; a line advertising an empty
          board is worse than no line. */}
      {!offline && liveAds > 0 ? (
        <a
          href={`${base}/ads`}
          className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-[hsl(var(--border-strong))]"
        >
          <BadgeDollarSign className="h-4 w-4 shrink-0 text-primary-ink" aria-hidden="true" />
          <span>
            <strong className="font-medium">{liveAds}</strong> paid-ad{" "}
            {liveAds === 1 ? "campaign is" : "campaigns are"} open — these pay for boosted
            placement.
          </span>
          <span className="ml-auto shrink-0 text-primary-ink">View →</span>
        </a>
      ) : null}

      {offline ? (
        <BotOffline />
      ) : shown.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {filter === "active"
            ? "Nothing is open right now. Your existing clips keep earning."
            : filter === "ended"
              ? "No campaigns have ended yet."
              : "No campaigns yet."}
        </p>
      ) : (
        <>
          {filter === "all" && active.length > 0 ? (
            <h2 className="mt-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Active campaigns
            </h2>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <CampaignCard key={c.id} campaign={c} userId={userId} sig={sig} accounts={accounts} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
