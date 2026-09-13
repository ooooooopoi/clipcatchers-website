import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { ClipperActions } from "@/components/clipper/clipper-actions";
import { SubmitClipForm } from "@/components/clipper/submit-clip-form";
import {
  BotUnavailable,
  fetchCampaigns,
  fetchClipperAccounts,
  fetchClipperEarnings,
  type BotCampaign,
  type ClipperAccount,
  type ClipperClip,
  type ClipperEarnings,
} from "@/lib/bot";
import { formatNumber } from "@/lib/format";
import { clipperSignatureValid } from "@/lib/share";

// Private to whoever holds the link, and not something to leave in an index.
export const metadata: Metadata = {
  title: "Your clips",
  robots: { index: false, follow: false },
};

// The figures come from the bot and change as views are read; nothing here
// should be cached between visits.
export const dynamic = "force-dynamic";

/** Money from the bot arrives as dollars, not cents — formatCurrency takes cents. */
function dollars(n: number) {
  return `$${n.toFixed(2)}`;
}

/** 10000 -> "10K". Rates read as "$1 / 10K views", which is how they're quoted. */
function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return String(n);
}

const STATUS_TONE: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  pending: "border-warning/30 bg-warning/10 text-warning",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  withdrawn: "border-border text-muted-foreground",
};

/** A run of clips from one campaign, so 56 rows read as a few groups. */
type ClipGroup = { id: number; name: string; clips: ClipperClip[]; earned: number };

function groupByCampaign(clips: ClipperClip[]): ClipGroup[] {
  const groups = new Map<number, ClipGroup>();
  for (const clip of clips) {
    let group = groups.get(clip.campaign_id);
    if (!group) {
      group = { id: clip.campaign_id, name: clip.campaign, clips: [], earned: 0 };
      groups.set(clip.campaign_id, group);
    }
    group.clips.push(clip);
    group.earned += clip.worth;
  }
  // Biggest earner first: the campaign holding the most money is the one
  // they opened this page to look at.
  return [...groups.values()].sort((a, b) => b.earned - a.earned);
}

export default async function ClipperPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;

  // 404 rather than a 401 page. A wrong signature and a made-up id should be
  // indistinguishable from outside, or the response itself tells someone
  // whether a given clipper exists.
  if (!clipperSignatureValid(userId, sig)) notFound();

  let earnings: ClipperEarnings | null = null;
  let accounts: ClipperAccount[] = [];
  let campaigns: BotCampaign[] = [];
  let offline = false;

  try {
    // In parallel: three independent reads, and the page is worthless without
    // the first of them anyway.
    const [e, a, c] = await Promise.all([
      fetchClipperEarnings(userId),
      fetchClipperAccounts(userId),
      fetchCampaigns(),
    ]);
    earnings = e;
    accounts = a.accounts ?? [];
    campaigns = (c.campaigns ?? []).filter((x) => x.active);
  } catch (error) {
    // The bot being down is not the same as the link being wrong, and telling
    // someone their link is invalid when it isn't sends them to support.
    if (!(error instanceof BotUnavailable)) throw error;
    offline = true;
  }

  // `breakdown`, not `rows`: the bot has never sent a `rows` key, so the old
  // name meant this list was empty for everyone regardless of their clips.
  const clips = earnings?.breakdown ?? [];
  const groups = groupByCampaign(clips);

  const withdrawable = earnings?.withdrawable ?? 0;
  const awaiting = earnings?.awaiting_release ?? 0;
  const hasPayout = Boolean(earnings?.payout_method);

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-5 py-6">
        <span className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="wordmark text-base">Clip Catchers</span>
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Creator
        </span>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 pb-24">
        {offline ? (
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Can&apos;t reach the bot right now, so your clips aren&apos;t loading. Your link is
            fine — try again in a minute.
          </p>
        ) : (
          <>
            {/* ── Payout ──────────────────────────────────────────────────
                First, because it is the number people open this page for.
                The split matters: money from a campaign an admin hasn't
                released yet is earned but not reachable, and showing one
                total would read as "you have it" when /withdraw would
                refuse. */}
            <section>
              <h2 className="display text-xl sm:text-2xl">Payout</h2>

              <div className="surface mt-4 rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-5 py-6 sm:px-7 sm:py-7">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Ready to withdraw
                  </p>
                  <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight text-primary-ink sm:text-4xl">
                    {dollars(withdrawable)}
                  </p>

                  {withdrawable > 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Run{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary-ink">
                        /withdraw
                      </code>{" "}
                      in Discord to be paid out
                      {hasPayout ? "" : " — you'll need a payout method set first"}.
                    </p>
                  ) : awaiting > 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nothing to withdraw yet. Your earnings are still with campaigns that
                      haven&apos;t been released for payout.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nothing to withdraw yet. Approved clips above the view floor build this
                      up.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-3">
                  {[
                    {
                      value: dollars(awaiting),
                      label: "earned, awaiting release",
                      hint: "Released by an admin once a campaign is settled.",
                    },
                    { value: dollars(earnings?.already_paid ?? 0), label: "paid to you so far" },
                    { value: formatNumber(earnings?.clips ?? 0), label: "clips submitted" },
                  ].map((m) => (
                    <div key={m.label} className="px-4 py-5 text-center">
                      <p className="font-mono text-lg font-semibold tracking-tight text-primary-ink sm:text-xl">
                        {m.value}
                      </p>
                      <p className="mt-1 text-xs leading-tight text-muted-foreground">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3.5 text-xs sm:px-7">
                  <span className="text-muted-foreground">Paid to</span>
                  {hasPayout ? (
                    <span className="font-mono text-primary-ink">
                      {earnings?.payout_method} · {earnings?.payout_address}
                    </span>
                  ) : (
                    <span className="text-warning">
                      Not set — run{" "}
                      <code className="font-mono">/set-payout</code> in Discord
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground/70">
                Views are read off each live post, so what a clip is worth moves as it does.
                Only approved clips above the campaign&apos;s view floor earn. Network fees on
                a withdrawal come out of the amount sent.
              </p>
            </section>

            {/* ── Active campaigns ────────────────────────────────────────
                What's open and what it pays. A name alone is not a reason
                to go and cut something. */}
            <section className="mt-12">
              <h2 className="display text-xl sm:text-2xl">Active campaigns</h2>
              {campaigns.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                  Nothing open right now. Your existing clips keep earning.
                </p>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {campaigns.map((c) => (
                    <li
                      key={c.id}
                      className="surface rounded-xl border border-border bg-card px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-primary-ink">{c.name}</p>
                          {c.artist ? (
                            <p className="truncate text-xs text-muted-foreground">{c.artist}</p>
                          ) : null}
                        </div>
                        {c.platform ? (
                          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            {c.platform}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 font-mono text-lg font-semibold tracking-tight text-primary-ink">
                        ${c.rate_amount} <span className="text-sm font-normal text-muted-foreground">
                          / {compact(c.rate_per_views)} views
                        </span>
                      </p>

                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {c.min_views > 0 ? `${compact(c.min_views)} views to qualify` : "No view floor"}
                        {c.max_views > 0 ? ` · counts up to ${compact(c.max_views)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-12">
              <h2 className="display text-xl sm:text-2xl">Submit a clip</h2>
              <SubmitClipForm
                userId={userId}
                sig={sig}
                accounts={accounts}
                campaigns={campaigns}
              />
            </section>

            {/* ── Your clips ──────────────────────────────────────────────
                Grouped by campaign: a flat list of everything someone has
                ever posted buries the campaign they're actually asking
                about. */}
            <section className="mt-12">
              <h2 className="display text-xl sm:text-2xl">Your clips</h2>
              {groups.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                  Nothing submitted yet.
                </p>
              ) : (
                <div className="mt-4 space-y-8">
                  {groups.map((group) => (
                    <div key={group.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                        <h3 className="font-medium text-primary-ink">{group.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {group.clips.length} {group.clips.length === 1 ? "clip" : "clips"} ·{" "}
                          <span className="font-mono">{dollars(group.earned)}</span>
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
                              className="min-w-0 flex-1 truncate text-sm text-primary-ink underline-offset-4 hover:underline"
                            >
                              {clip.url}
                            </a>

                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                              {formatNumber(clip.views)} views
                            </span>
                            <span className="shrink-0 font-mono text-sm font-semibold">
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

                            {/* Why it is worth nothing, rather than leaving
                                $0.00 to look like a mistake. */}
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
      </main>
    </div>
  );
}
