import type { Metadata } from "next";
import Link from "next/link";
import { BotOffline, PageHeading, Stat } from "@/components/clipper/chrome";
import { formatNumber } from "@/lib/format";
import { dollars, groupByCampaign, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { earnings, offline } = await loadClipper(userId, sig);
  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  const clips = earnings?.breakdown ?? [];
  const groups = groupByCampaign(clips);

  // Earning clips only — the campaign totals below should add up to the money,
  // so a rejected or below-floor clip belongs in the count, not the sum.
  const earningClips = clips.filter((c) => c.worth > 0);
  const views = earningClips.reduce((sum, c) => sum + c.views, 0);

  return (
    <>
      <PageHeading
        title="Earnings"
        subtitle="What you've made, and which campaigns it came from."
      />

      {offline ? (
        <BotOffline />
      ) : (
        <>
          <div className="surface mt-8 grid grid-cols-2 divide-border rounded-2xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
            <Stat value={dollars(earnings?.owed ?? 0)} label="owed to you" />
            <Stat value={dollars(earnings?.already_paid ?? 0)} label="paid so far" />
            <Stat value={formatNumber(views)} label="paid views" />
            <Stat value={formatNumber(earnings?.clips ?? 0)} label="clips submitted" />
          </div>

          <p className="mt-3 text-xs text-muted-foreground/70">
            Views are read off each live post, so what a clip is worth moves as it does. Only
            approved clips above the campaign&apos;s view floor earn.
          </p>

          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              By campaign
            </h2>

            {groups.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Nothing yet. Submit a clip to a live campaign and it shows up here.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {groups.map((group) => {
                  const paid = group.clips
                    .filter((c) => c.paid)
                    .reduce((sum, c) => sum + c.worth, 0);
                  return (
                    <li
                      key={group.id}
                      className="surface flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-card px-4 py-3.5"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {group.clips.length} {group.clips.length === 1 ? "clip" : "clips"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dollars(paid)} paid
                      </span>
                      <span className="font-mono text-sm font-semibold text-primary-ink">
                        {dollars(group.earned)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="mt-8 text-sm text-muted-foreground">
            To take money out, see{" "}
            <Link
              href={`${base}/payouts`}
              className="text-primary-ink underline-offset-4 hover:underline"
            >
              Payouts
            </Link>
            .
          </p>
        </>
      )}
    </>
  );
}
