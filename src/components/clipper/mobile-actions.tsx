"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, UserRoundPlus, Users, Wallet, type LucideIcon } from "lucide-react";
import {
  AddAccountForm,
  IssuedCode,
  type IssuedAccount,
} from "@/components/clipper/add-account-form";
import { ReferralLink } from "@/components/clipper/referral-link";
import { SubmitClipForm } from "@/components/clipper/submit-clip-form";
import { WithdrawPanel, zeroBalanceNote } from "@/components/clipper/withdraw-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { ClipperAccount } from "@/lib/bot";
import { dollars } from "@/lib/clipper-format";
import { cn } from "@/lib/utils";

/** The figures the Withdraw panel needs, picked out of the earnings on the server. */
export type MobileWallet = {
  withdrawable: number;
  /** What one withdrawal can take; under `withdrawable` when there's a per-withdrawal ceiling. */
  takeNow: number;
  minimum: number;
  method: string;
  masked: string;
  feePercent: number;
  gasFromClipper: boolean;
  awaitingRelease: number;
  running: number;
};

type Panel = "submit" | "withdraw" | "account" | "invite";

type Invite = { link: string | null; problem: string | null; share_percent: number; window_days: number };

/**
 * The top of every creator page on a phone: four buttons, each opening its
 * action in a panel from the bottom of the screen.
 *
 * The owner asked for buttons in place of the big written "Dashboard"
 * heading, on phones only (2026-10-03). So these show below the `lg`
 * breakpoint, where the shell is already the phone layout (tabs across the
 * top instead of the sidebar), and the page headings step aside there
 * (PageHeading). Desktop is unchanged.
 *
 * The panels are the site's own forms, not copies: the submit form from the
 * campaign cards, the Withdraw card from Earnings (WithdrawPanel), and the
 * add form and bio code from Accounts. So every rule they carry, such as
 * needing a Discord sign-in to add an account or move money, holds here too.
 */
export function MobileActions({
  userId,
  sig,
  base,
  accounts,
  campaigns,
  platforms,
  wallet,
  signedInAs,
}: {
  userId: string;
  sig: string;
  base: string;
  accounts: ClipperAccount[];
  /** Live campaigns, the ones a clip can be submitted to. */
  campaigns: { id: number; name: string }[];
  platforms: string[];
  wallet: MobileWallet;
  /** The signed-in Discord id, or null. Money and new accounts need it, not just the link. */
  signedInAs: string | null;
}) {
  const [open, setOpen] = useState(false);
  // Kept when the panel closes, so it doesn't go blank while sliding away.
  const [panel, setPanel] = useState<Panel>("submit");
  // The referral link, once fetched: opening Invite again shouldn't ask twice.
  const [invite, setInvite] = useState<Invite | null>(null);

  function show(next: Panel) {
    setPanel(next);
    setOpen(true);
  }
  const close = () => setOpen(false);

  const moneyReady = wallet.withdrawable >= wallet.minimum && wallet.withdrawable > 0;

  return (
    <div className="mb-2 lg:hidden">
      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon={Send} primary onClick={() => show("submit")}>
          Submit a clip
        </ActionButton>
        <ActionButton icon={Wallet} onClick={() => show("withdraw")} dot={moneyReady}>
          Withdraw
        </ActionButton>
        <ActionButton icon={UserRoundPlus} onClick={() => show("account")}>
          Add account
        </ActionButton>
        <ActionButton icon={Users} onClick={() => show("invite")}>
          Invite friends
        </ActionButton>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* `dark` because the sheet portals to document.body, outside the
            .clipper-shell wrapper that scopes this subtree's variables. */}
        <SheetContent
          side="bottom"
          className="dark max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 text-foreground lg:hidden"
        >
          {panel === "submit" ? (
            <>
              <SheetTitle className="pr-8 text-lg">Submit a clip</SheetTitle>
              <SheetDescription className="sr-only">
                Paste your clip&apos;s link and pick its campaign.
              </SheetDescription>
              <div className="mt-5">
                <SubmitClipForm
                  userId={userId}
                  sig={sig}
                  accounts={accounts}
                  campaigns={campaigns}
                  // One live campaign is the answer already; asking would be a formality.
                  initialCampaignId={campaigns.length === 1 ? String(campaigns[0].id) : ""}
                  onSubmitted={close}
                  bare
                />
              </div>
            </>
          ) : panel === "withdraw" ? (
            <>
              <SheetTitle className="pr-8 text-lg">Withdraw</SheetTitle>
              <SheetDescription className="sr-only">
                What you can take out, and where it goes.
              </SheetDescription>
              <div className="surface mt-5 rounded-2xl bg-card p-5">
                <p className="text-sm text-muted-foreground">Ready to withdraw</p>
                <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-foreground">
                  {dollars(wallet.withdrawable)}
                </p>
                {wallet.withdrawable === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {zeroBalanceNote(wallet.awaitingRelease, wallet.running)}
                  </p>
                ) : null}
              </div>
              <WithdrawPanel
                userId={userId}
                sig={sig}
                signedInAs={signedInAs}
                withdrawable={wallet.withdrawable}
                takeNow={wallet.takeNow}
                minimum={wallet.minimum}
                method={wallet.method}
                masked={wallet.masked}
                feePercent={wallet.feePercent}
                gasFromClipper={wallet.gasFromClipper}
              />
              <Link
                href={`${base}/earnings`}
                onClick={close}
                className="mt-6 block text-center text-sm text-primary-ink underline-offset-4 hover:underline"
              >
                See all your earnings
              </Link>
            </>
          ) : panel === "account" ? (
            <>
              <SheetTitle className="pr-8 text-lg">Add an account</SheetTitle>
              <SheetDescription className="mt-1.5 text-sm text-muted-foreground">
                The profile you post from. Clips only count from accounts added here.
              </SheetDescription>
              <div className="mt-5">
                <AddAccount
                  userId={userId}
                  sig={sig}
                  platforms={platforms}
                  signedInAs={signedInAs}
                  onDone={close}
                />
              </div>
            </>
          ) : (
            <>
              <SheetTitle className="pr-8 text-lg">Invite friends</SheetTitle>
              <InvitePanel
                userId={userId}
                sig={sig}
                base={base}
                invite={invite}
                onLoaded={setInvite}
                onNavigate={close}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  primary = false,
  dot = false,
  onClick,
  children,
}: {
  icon: LucideIcon;
  primary?: boolean;
  /** A small blue dot: there's money ready to take out. */
  dot?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
        primary
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "surface border border-border bg-card text-foreground hover:bg-accent/40",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
      {dot ? (
        <>
          <span aria-hidden className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">, money ready</span>
        </>
      ) : null}
    </button>
  );
}

/**
 * Add, then the bio code with Check my bio, all in the panel: the code is
 * shown once (no endpoint returns it again), so it has to appear where they
 * added the account.
 */
function AddAccount({
  userId,
  sig,
  platforms,
  signedInAs,
  onDone,
}: {
  userId: string;
  sig: string;
  platforms: string[];
  signedInAs: string | null;
  onDone: () => void;
}) {
  const [issued, setIssued] = useState<IssuedAccount | null>(null);
  const router = useRouter();

  if (issued) {
    return <IssuedCode account={issued} userId={userId} sig={sig} onVerified={onDone} />;
  }
  return (
    <AddAccountForm
      userId={userId}
      sig={sig}
      platforms={platforms}
      signedInAs={signedInAs}
      onAdded={(account) => {
        setIssued(account);
        // So the new account is already in the submit form and on Accounts.
        router.refresh();
      }}
      onCancel={onDone}
    />
  );
}

/**
 * Their personal invite link, fetched when the panel first opens rather than
 * with every page: the bot makes the link on the first ask.
 */
function InvitePanel({
  userId,
  sig,
  base,
  invite,
  onLoaded,
  onNavigate,
}: {
  userId: string;
  sig: string;
  base: string;
  invite: Invite | null;
  onLoaded: (invite: Invite) => void;
  onNavigate: () => void;
}) {
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (invite?.link) return;
    let cancelled = false;
    setProblem(null);
    fetch(`/api/clipper/${userId}/${sig}/referrals`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setProblem(body.error ?? "Couldn't get your link right now.");
          return;
        }
        onLoaded(body as Invite);
        if (!body.link) setProblem(body.problem ?? "Your link isn't available right now.");
      })
      .catch(() => {
        if (!cancelled) setProblem("Couldn't reach the server.");
      });
    return () => {
      cancelled = true;
    };
    // `invite` is left out on purpose: loading it is what this effect does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sig, attempt]);

  const terms = invite
    ? `You get ${invite.share_percent}% of what they earn for their first ${invite.window_days} days.`
    : "Getting your link…";

  return (
    <>
      <SheetDescription className="mt-1.5 text-sm text-muted-foreground">{terms}</SheetDescription>

      {invite?.link ? (
        <ReferralLink url={invite.link} />
      ) : problem ? (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-warning">{problem}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="mt-4 h-12 animate-pulse rounded-2xl bg-card" aria-hidden />
      )}

      <p className="mt-5 text-sm text-muted-foreground">
        Anyone who joins the Clip Catchers Discord through your link counts as your referral.
      </p>
      <Link
        href={`${base}/referrals`}
        onClick={onNavigate}
        className="mt-5 block text-center text-sm text-primary-ink underline-offset-4 hover:underline"
      >
        See who you&apos;ve brought in
      </Link>
    </>
  );
}
