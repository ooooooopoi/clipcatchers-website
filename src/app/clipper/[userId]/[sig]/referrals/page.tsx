import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotOffline, PageHeading, Stat } from "@/components/clipper/chrome";
import { ReferralLink } from "@/components/clipper/referral-link";
import { BotUnavailable, fetchClipperReferrals, type ClipperReferrals } from "@/lib/bot";
import { dollars } from "@/lib/clipper-data";
import { formatDate, formatNumber } from "@/lib/format";
import { clipperSignatureValid } from "@/lib/share";

export const metadata: Metadata = { title: "Referrals" };
export const dynamic = "force-dynamic";

/** The bot speaks in Unix seconds. */
function day(seconds: number) {
  return formatDate(new Date(seconds * 1000));
}

/**
 * A clipper's personal invite link and the creators it has brought in.
 *
 * The same link /referrals gives them in Discord: the bot makes it on first
 * ask, here or there, and hands back the same one after. Every figure and
 * term is the bot's (referrals.py), so this page can't promise something the
 * rule that pays doesn't do.
 */
export default async function ReferralsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  // Checked here as well as in the layout: a layout isn't a boundary.
  if (!clipperSignatureValid(userId, sig)) notFound();

  let data: ClipperReferrals | null = null;
  try {
    data = await fetchClipperReferrals(userId);
  } catch (error) {
    if (!(error instanceof BotUnavailable)) throw error;
  }

  if (!data) {
    return (
      <>
        <PageHeading title="Referrals" subtitle="Bring creators in with your link." />
        <BotOffline />
      </>
    );
  }

  const share = `${data.share_percent}%`;
  const days = `${data.window_days} days`;
  const active = data.referrals.filter((r) => r.active).length;

  return (
    <>
      <PageHeading
        title="Referrals"
        subtitle={`Bring creators in with your link. You get ${share} of what they earn for their first ${days}.`}
      />

      <div className="surface mt-8 max-w-2xl rounded-3xl bg-card p-7 sm:p-9">
        <p className="text-base text-muted-foreground">Your link</p>
        {data.link ? (
          <ReferralLink url={data.link} />
        ) : (
          <p className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Your link isn&apos;t available right now. {data.problem} Run{" "}
            <code className="font-mono">/referrals</code> in Discord to try again.
          </p>
        )}
        <p className="mt-5 text-sm text-muted-foreground">
          Send it to creators anywhere. Anyone who joins the Clip Catchers Discord through it
          counts as your referral.
        </p>
      </div>

      <div className="surface mt-10 grid max-w-2xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
        <Stat value={dollars(data.earned)} label="earned from referrals" hint="Added to your balance." />
        <Stat value={formatNumber(data.referrals.length)} label="creators brought in" />
        <Stat value={formatNumber(active)} label={`still in their ${days}`} />
      </div>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your referrals
        </h2>
        {data.referrals.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            Nobody yet. Creators who join through your link show up here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.referrals.map((r) => (
              <li
                key={r.id}
                className="surface rounded-2xl border border-border bg-card px-4 py-3.5"
              >
                {/* Name and amount share a line; the window sits under them, so
                    a phone doesn't squeeze the name down to one letter. */}
                <div className="flex items-center gap-4">
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {r.name ?? "A creator you brought in"}
                  </span>
                  <span className="font-mono text-sm font-semibold text-primary-ink">
                    {dollars(r.earned)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.active ? `${share} on clips posted by ${day(r.window_ends)}` : `${days} ended`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          How it works
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. Send your link.</span> A creator joins
            the Discord through it.
          </li>
          <li>
            <span className="font-medium text-foreground">2. They clip.</span> For {days} after
            they join, every clip they post that gets paid earns you {share} of what it paid.
          </li>
          <li>
            <span className="font-medium text-foreground">3. You get paid.</span> Your {share}{" "}
            lands in your balance when they&apos;re paid, and you withdraw it like the rest of
            your earnings.
          </li>
        </ol>
        <p className="mt-5 text-xs text-muted-foreground/70">
          Clip Catchers pays your {share} on top, so the creator still keeps everything they
          earn. Only joins through your own link count, from {day(data.program_start)} on.
          Rejected and unpaid clips don&apos;t earn a share.
        </p>
      </section>
    </>
  );
}
