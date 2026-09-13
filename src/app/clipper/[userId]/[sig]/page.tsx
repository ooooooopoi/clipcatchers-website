import type { Metadata } from "next";
import { CampaignCard } from "@/components/clipper/campaign-card";
import { CampaignFilter, type CampaignType } from "@/components/clipper/campaign-filter";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Campaigns" };

// The figures come from the bot and change as views are read; nothing here
// should be cached between visits.
export const dynamic = "force-dynamic";

export default async function CampaignsPage({
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

  const { campaigns, offline } = await loadClipper(userId, sig);
  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  const shown = campaigns
    .filter((c) =>
      filter === "all" ? true : filter === "active" ? c.active : !c.active,
    )
    // Live first, then most recently opened. A clipper browsing for something
    // to cut wants what is open; the ended ones are here to look back at.
    .sort((a, b) => Number(b.active) - Number(a.active) || b.id - a.id);

  const active = campaigns.filter((c) => c.active);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Campaigns"
          subtitle="Browse campaigns and submit clips to the ones that are live."
        />
        {!offline ? <CampaignFilter value={filter} base={base} /> : null}
      </div>

      {offline ? (
        <BotOffline />
      ) : shown.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
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
              <CampaignCard key={c.id} campaign={c} href={`${base}/clips`} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
