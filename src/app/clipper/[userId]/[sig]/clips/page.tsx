import type { Metadata } from "next";
import { ClipperActions } from "@/components/clipper/clipper-actions";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { SubmitClipForm } from "@/components/clipper/submit-clip-form";
import { formatNumber } from "@/lib/format";
import { dollars, groupByCampaign, loadClipper, STATUS_TONE } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Clips" };
export const dynamic = "force-dynamic";

export default async function ClipsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { earnings, accounts, campaigns, offline } = await loadClipper(userId, sig);

  // `breakdown`, not `rows`: the bot has never sent a `rows` key, and reading
  // the wrong one left this list empty for every clipper regardless of what
  // they had submitted.
  const groups = groupByCampaign(earnings?.breakdown ?? []);
  const active = campaigns.filter((c) => c.active);

  return (
    <>
      <PageHeading
        title="Clips"
        subtitle="Submit a new clip, and track what everything you've posted is worth."
      />

      {offline ? (
        <BotOffline />
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Submit a clip
            </h2>
            <SubmitClipForm userId={userId} sig={sig} accounts={accounts} campaigns={active} />
          </section>

          <section className="mt-12">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Your clips
            </h2>

            {groups.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Nothing submitted yet.
              </p>
            ) : (
              <div className="mt-4 space-y-8">
                {groups.map((group) => (
                  <div key={group.id}>
                    {/* Outstanding, not lifetime. The total made a fully paid
                        campaign look like one still owing the same amount. */}
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {group.clips.length} {group.clips.length === 1 ? "clip" : "clips"} ·{" "}
                        {group.active ? (
                          <>
                            <span className="font-mono">{dollars(group.running)}</span> so far
                            · still running
                          </>
                        ) : group.owed > 0 ? (
                          <>
                            <span className="font-mono">{dollars(group.owed)}</span> to come
                          </>
                        ) : group.paid > 0 ? (
                          <>
                            <span className="font-mono">{dollars(group.paid)}</span> paid out
                          </>
                        ) : (
                          "nothing earned yet"
                        )}
                      </p>
                    </div>

                    <ul className="mt-3 space-y-3">
                      {group.clips.map((clip) => (
                        <li
                          key={clip.id}
                          className="surface flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                        >
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              STATUS_TONE[clip.status] ?? "border-border text-muted-foreground"
                            }`}
                          >
                            {clip.status}
                          </span>

                          <a
                            href={clip.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-sm underline-offset-4 hover:underline"
                          >
                            {clip.url}
                          </a>

                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {formatNumber(clip.views)} views
                          </span>
                          {/* A paid clip's worth is history, not a sum owed.
                              Same number either way, so the weight has to say
                              which it is — otherwise a settled clip sitting in
                              the list reads as money still coming. */}
                          <span
                            className={`shrink-0 font-mono text-sm ${
                              clip.paid
                                ? "font-normal text-muted-foreground line-through decoration-muted-foreground/40"
                                : "font-semibold"
                            }`}
                            title={clip.paid ? "Already paid out" : undefined}
                          >
                            {dollars(clip.worth)}
                          </span>

                          <ClipperActions
                            userId={userId}
                            sig={sig}
                            clipId={clip.id}
                            status={clip.status}
                            paid={clip.paid}
                            locked={clip.locked}
                          />

                          {/* Why it is worth nothing, rather than leaving $0.00
                              to look like a mistake. */}
                          {clip.below_min && clip.status === "approved" ? (
                            <p className="w-full text-xs text-muted-foreground">
                              Under the campaign&apos;s view floor — earns once it passes.
                            </p>
                          ) : null}
                          {clip.flag_reason ? (
                            <p className="w-full text-xs text-warning">{clip.flag_reason}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
