import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { CampaignCard } from "@/components/clipper/campaign-card";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { isPaidAds, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Ads" };

// Live figures from the bot; nothing here should survive between visits.
export const dynamic = "force-dynamic";

/**
 * Campaigns that pay for boosted placement, kept off the organic board.
 *
 * ── Why this is its own page and not a filter ───────────────────────────
 * The two kinds ask for different work. An organic rate is set on the
 * assumption that a clip earns its own views; a paid-ads rate is set knowing
 * spend goes behind it. Put them in one list and someone cuts organically for
 * a rate that assumed ad spend and is underpaid for the effort — or runs paid
 * traffic at an organic rate and is out of pocket. The separation is the
 * warning, which is why it is a board rather than a chip on a card.
 *
 * The rules block is shown inline rather than behind the card, because on
 * these campaigns what you are required to spend is half the offer, and a
 * rate quoted without it is not enough to decide on.
 */
export default async function AdsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { campaigns, offline } = await loadClipper(userId, sig);
  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  const ads = campaigns
    .filter(isPaidAds)
    // Live first, then newest. Someone browsing for work wants what is open.
    .sort((a, b) => Number(b.active) - Number(a.active) || b.id - a.id);

  const live = ads.filter((c) => c.active);
  const ended = ads.filter((c) => !c.active);

  return (
    <>
      <PageHeading
        title="Ads"
        subtitle="Campaigns that pay for boosted placement. Run paid traffic to the clip, get paid on the rate below."
      />

      {offline ? (
        <BotOffline />
      ) : ads.length === 0 ? (
        // Not the generic "nothing here" box. This board is empty most of the
        // time, and an empty state that reads as a fault gets reported as one
        // — so it says what would fill it and where to go meanwhile.
        <div className="mt-8 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <Megaphone className="mx-auto h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No paid-ad campaigns right now</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            These run less often than organic ones. When a brand funds paid placement it
            shows up here with its own rate and spend rules.
          </p>
          <a
            href={base}
            className="mt-5 inline-block text-sm text-primary-ink underline-offset-4 hover:underline"
          >
            Browse organic campaigns →
          </a>
        </div>
      ) : (
        <>
          <p className="mt-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
            <strong className="font-medium">Read the rules before you spend.</strong>{" "}
            These rates assume you are putting money behind the clip. Ad spend is yours
            unless a campaign says otherwise — check each one.
          </p>

          {/* Two lists, not one grid under one heading. "Open now" sat above
              every ad including the closed ones, so a finished campaign read
              as available — and on this board that means spending real money
              on a clip nobody will pay for. */}
          {live.length > 0 ? (
            <>
              <h2 className="mt-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Open now
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {live.map((c) => (
                  <CampaignCard key={c.id} campaign={c} href={`${base}/clips`} showRules />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              None open right now. The finished ones are below.
            </p>
          )}

          {ended.length > 0 ? (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Finished
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ended.map((c) => (
                  <CampaignCard key={c.id} campaign={c} href={`${base}/clips`} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </>
  );
}
