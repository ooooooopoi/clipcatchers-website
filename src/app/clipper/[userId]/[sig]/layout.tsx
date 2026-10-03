import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand";
import { ClipperNav } from "@/components/clipper/clipper-nav";
import { MobileActions } from "@/components/clipper/mobile-actions";
import { ClipperNotifications } from "@/components/clipper/notifications";
import { isPaidAds, loadClipper } from "@/lib/clipper-data";
import { buildNotices } from "@/lib/clipper-notifications";
import { clipperSignatureValid } from "@/lib/share";
import { PLATFORMS } from "@/lib/validations";

// Private to whoever holds the link, and not something to leave in an index.
export const metadata: Metadata = {
  title: { default: "Your dashboard", template: "%s · Clip Catchers" },
  robots: { index: false, follow: false },
};

/**
 * The clipper dashboard shell.
 *
 * ── Why this subtree is dark and the rest of the site is not ─────────────
 * The public site is white by design and stays that way. This is the tool a
 * clipper works in rather than a page that sells anything, and it is only
 * reachable with a signed link, so nobody crosses between the two mid-scroll
 * and sees the theme flip under them.
 *
 * Tailwind's dark mode is class-based, so the `dark` class here re-points the
 * CSS variables for everything inside and nothing outside. The body sits
 * outside this element and would stay white behind an overscroll, which is
 * what the `:has()` rule in globals.css is for.
 */
export default async function ClipperLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;

  // Checked here so no shell is ever drawn around a bad link. Each page checks
  // again — a layout is not a security boundary, since pages can be requested
  // on their own — and 404 rather than 401 so the response doesn't confirm
  // which clippers exist.
  if (!clipperSignatureValid(userId, sig)) notFound();

  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  // The same request-memoised load the page inside this shell performs, so the
  // bell costs no extra calls to the bot. When the bot is down this returns
  // offline with null earnings and the panel simply has nothing to show, which
  // is the right outcome — the page itself is already saying the bot is down.
  const [data, session] = await Promise.all([loadClipper(userId, sig), auth()]);
  const notices = buildNotices(data);
  const earnings = data.earnings;

  // What a clip can be submitted to from the phone's Submit button: live
  // campaigns, the organic ones first as on Explore, newest first.
  const live = data.campaigns
    .filter((c) => c.active)
    .sort((a, b) => Number(isPaidAds(a)) - Number(isPaidAds(b)) || b.id - a.id)
    .map((c) => ({ id: c.id, name: c.name }));
  const withdrawable = earnings?.withdrawable ?? 0;

  return (
    <div className="clipper-shell dark min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-border lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 px-4 pt-5 lg:px-5">
            <Link href={base} className="flex items-center gap-2.5">
              <BrandMark className="h-7 w-7" />
              <span className="wordmark text-sm">Clip Catchers</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground lg:hidden">
                Creator
              </span>
              <ClipperNotifications base={base} userId={userId} notices={notices} />
            </div>
          </div>
          <ClipperNav base={base} />
        </aside>

        <main className="min-w-0 flex-1 px-5 pb-8 pt-5 sm:px-8 lg:py-10">
          {/* Phones only; see MobileActions. Not while the bot is down: every
              panel would open on empty figures (a $0.00 balance, no
              campaigns), and the page below already says what's wrong. */}
          {!data.offline ? (
            <MobileActions
              userId={userId}
              sig={sig}
              base={base}
              accounts={data.accounts}
              campaigns={live}
              platforms={[...PLATFORMS]}
              signedInAs={session?.user?.discordId ?? null}
              wallet={{
                withdrawable,
                takeNow: earnings?.withdrawable_now ?? withdrawable,
                minimum: earnings?.payout_minimum ?? 12,
                method: earnings?.payout_method ?? "",
                masked: earnings?.payout_address ?? "",
                feePercent: earnings?.payout_fee_percent ?? 0,
                gasFromClipper: earnings?.payout_gas_from_clipper ?? false,
                awaitingRelease: earnings?.awaiting_release ?? 0,
                running: earnings?.running ?? 0,
              }}
            />
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
