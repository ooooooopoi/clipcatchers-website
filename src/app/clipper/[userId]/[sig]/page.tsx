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
  type ClipperAccount,
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

const STATUS_TONE: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  pending: "border-warning/30 bg-warning/10 text-warning",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  withdrawn: "border-border text-muted-foreground",
};

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
  let campaigns: { id: number; name: string; active: number }[] = [];
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

  const rows = earnings?.rows ?? [];

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
            <div className="surface grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
              {[
                { value: dollars(earnings?.owed ?? 0), label: "owed to you" },
                { value: dollars(earnings?.already_paid ?? 0), label: "paid so far" },
                { value: formatNumber(earnings?.clips ?? 0), label: "clips submitted" },
              ].map((m) => (
                <div key={m.label} className="px-4 py-7 text-center">
                  <p className="font-mono text-xl font-semibold tracking-tight text-primary-ink sm:text-2xl">
                    {m.value}
                  </p>
                  <p className="mt-1.5 text-xs leading-tight text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground/70">
              Views are read off each live post, so what a clip is worth moves as it does. Only
              approved clips earn.
            </p>

            <section className="mt-12">
              <h2 className="display text-xl sm:text-2xl">Submit a clip</h2>
              <SubmitClipForm
                userId={userId}
                sig={sig}
                accounts={accounts}
                campaigns={campaigns}
              />
            </section>

            <section className="mt-12">
              <h2 className="display text-xl sm:text-2xl">Your clips</h2>
              {rows.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                  Nothing submitted yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {rows.map((clip) => (
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
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
