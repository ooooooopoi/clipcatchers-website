import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { ClipperActions } from "@/components/clipper/clipper-actions";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { compact, dollars, loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Dashboard" };

// The figures come from the bot and change as views are read; nothing here
// should be cached between visits.
export const dynamic = "force-dynamic";

/**
 * The landing page: your money, then every clip you've submitted.
 *
 * ── Why this is personal and Explore is not ──────────────────────────────
 * This page used to be the campaigns grid, which made the site a catalogue —
 * right on the first visit, wrong on every one after, because a returning
 * clipper comes back for their own numbers: did I get paid, what happened to
 * the clip I posted last night. The catalogue moved to Explore; what's left
 * here is exactly the two things a return visit is for.
 *
 * The clip list is complete rather than recent. Cutting it off would mean
 * choosing which clips someone doesn't need to see, and the one they came to
 * check is always the one the cut-off hides.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { earnings, offline } = await loadClipper(userId, sig);
  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  const withdrawable = earnings?.withdrawable ?? 0;
  const running = earnings?.running ?? 0;
  const advance = earnings?.advance ?? 0;
  const totalSent = earnings?.total_sent ?? (earnings?.already_paid ?? 0) + advance;

  // Newest first: the clip someone comes back to check is almost always the
  // one they posted last.
  const clips = [...(earnings?.breakdown ?? [])].sort((a, b) => b.id - a.id);

  // The audit's own thresholds, straight from the bot. Null when an older bot
  // doesn't send them, which switches the engagement guidance off rather than
  // letting the page invent a bar of its own.
  const floorPct = earnings?.engagement_floor_pct ?? null;
  const floorFrom = earnings?.engagement_min_views ?? null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Dashboard"
          subtitle="Where your money stands, and every clip you've submitted."
        />
        <Link
          href={`${base}/explore`}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          Explore campaigns
        </Link>
      </div>

      {offline ? (
        <BotOffline />
      ) : (
        <>
          {/* ── The money ───────────────────────────────────────────────────
              The same figures Earnings leads with, read from the request's
              already-memoised load. The whole strip is a link: it is a
              summary, and summaries that can't be opened get poked at. */}
          {earnings ? (
            <Link
              href={`${base}/earnings`}
              className="surface group mt-8 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card transition-colors hover:border-[hsl(var(--border-strong))]"
            >
              <div className="px-5 py-5">
                <p className="text-xs text-muted-foreground">Ready to withdraw</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-foreground">
                  {dollars(withdrawable)}
                </p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs text-muted-foreground">Still running</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-muted-foreground">
                  {dollars(running)}
                </p>
              </div>
              <div className="relative px-5 py-5">
                <p className="text-xs text-muted-foreground">Paid so far</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-muted-foreground">
                  {dollars(totalSent)}
                </p>
                <ArrowRight
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-hover:text-foreground"
                />
              </div>
            </Link>
          ) : null}

          {/* ── Every clip ─────────────────────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Your clips{clips.length > 0 ? ` — ${clips.length}` : ""}
            </h2>

            {clips.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                <p className="text-sm font-medium">Nothing submitted yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Pick a live campaign, cut a clip, and it shows up here with what
                  it&apos;s earning.
                </p>
                <Link
                  href={`${base}/explore`}
                  className="mt-5 inline-block text-sm text-primary-ink underline-offset-4 hover:underline"
                >
                  Explore campaigns →
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {clips.map((clip) => (
                  <li
                    key={clip.id}
                    className="surface rounded-2xl border border-border bg-card px-4 py-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <StatusDot status={clip.status} paid={clip.paid} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {clip.campaign}
                      </span>
                      <a
                        href={clip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden text-xs text-muted-foreground underline-offset-2 hover:underline sm:inline"
                      >
                        open post ↗
                      </a>
                      <span className="font-mono text-xs text-muted-foreground">
                        {compact(clip.views)} views
                      </span>
                      <Engagement
                        pct={clip.engagement_pct}
                        views={clip.views}
                        floor={floorPct}
                        minViews={floorFrom}
                      />
                      {/* Worth is provisional while the campaign runs; muted
                          until it's a settled figure, so a moving number
                          doesn't dress as a promise. */}
                      <span
                        className={`font-mono text-sm ${
                          clip.paid
                            ? "text-muted-foreground"
                            : clip.worth > 0 && !clip.campaign_active
                              ? "font-semibold text-primary-ink"
                              : "text-muted-foreground"
                        }`}
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
                    </div>

                    {/* The reason is the actionable part of a rejection —
                        "rejected" alone tells them nothing they can fix. */}
                    {clip.status === "rejected" && (clip.flag_reason || "").trim() ? (
                      <p className="mt-1.5 pl-5 text-xs text-warning">
                        {clip.flag_reason}
                      </p>
                    ) : clip.below_min ? (
                      <p className="mt-1.5 pl-5 text-xs text-muted-foreground">
                        Under the campaign&apos;s view floor — earns nothing until it
                        passes it.
                      </p>
                    ) : atRisk(clip, floorPct, floorFrom) ? (
                      // Said only while it can still be acted on. Once the
                      // campaign closes the audit has already run, and telling
                      // someone their engagement is low about a clip they can
                      // no longer affect is just a poke.
                      <p className="mt-1.5 pl-5 text-xs text-warning">
                        Engagement is under {floorPct}% — clips below that can be
                        rejected when the campaign closes.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}

/**
 * Whether a clip is heading for rejection on engagement, and can still be
 * helped.
 *
 * All four conditions matter. Unread clips have no percentage and must not be
 * accused on a number nobody measured; below the view floor the ratio is noise
 * on a handful of interactions; a clip already rejected has its real reason
 * printed above this; and once the campaign has closed the audit has run, so
 * the warning is advice about a decision already taken.
 */
function atRisk(
  clip: { engagement_pct?: number | null; views: number; status: string; campaign_active: boolean },
  floor: number | null,
  minViews: number | null,
): boolean {
  if (floor === null || minViews === null) return false;
  if (clip.engagement_pct == null) return false;
  return (
    clip.views >= minViews &&
    clip.engagement_pct < floor &&
    clip.status === "approved" &&
    clip.campaign_active
  );
}

/**
 * A clip's engagement, or nothing.
 *
 * Renders only when there is a real reading. Most clips are never scraped, and
 * a dash in the column reads as "zero engagement" to the person whose clip it
 * is — worse than leaving the space empty, because it is an accusation made out
 * of missing data.
 */
function Engagement({
  pct,
  views,
  floor,
  minViews,
}: {
  pct?: number | null;
  views: number;
  floor: number | null;
  minViews: number | null;
}) {
  if (pct == null) return null;

  // Only coloured once the ratio means something. Under the view floor a
  // couple of likes swing it by whole percent, and red on that is a scare
  // about arithmetic rather than about the clip.
  const judged = floor !== null && minViews !== null && views >= minViews;
  const low = judged && pct < floor;

  return (
    <span
      className={`font-mono text-xs ${low ? "text-warning" : "text-muted-foreground"}`}
      title={
        judged
          ? `Likes, comments, shares and saves as a share of views. The close audit expects above ${floor}%.`
          : `Likes, comments, shares and saves as a share of views. Only judged above ${minViews?.toLocaleString()} views.`
      }
    >
      {pct.toFixed(1)}% eng
    </span>
  );
}

/**
 * One dot and one word for a clip's state.
 *
 * Paid beats approved: once money has gone out, "approved" is history rather
 * than status.
 */
function StatusDot({ status, paid }: { status: string; paid: boolean }) {
  const [colour, label] = paid
    ? ["bg-success", "Paid"]
    : status === "approved"
      ? ["bg-success/70", "Approved"]
      : status === "pending"
        ? ["bg-warning/80", "Pending"]
        : status === "rejected"
          ? ["bg-destructive/80", "Rejected"]
          : ["bg-muted-foreground/50", "Taken down"];

  return (
    <span className="flex w-24 shrink-0 items-center gap-2">
      <span aria-hidden className={`h-2 w-2 rounded-full ${colour}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
