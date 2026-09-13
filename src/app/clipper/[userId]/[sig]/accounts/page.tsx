import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountManager } from "@/components/clipper/account-manager";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { loadClipper } from "@/lib/clipper-data";
import { PLATFORMS } from "@/lib/validations";

export const metadata: Metadata = { title: "Accounts" };
export const dynamic = "force-dynamic";

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  // The server decides whose account this is; the client is told only whether
  // it matches, never trusted to say so.
  const [{ accounts, offline }, session] = await Promise.all([
    loadClipper(userId, sig),
    auth(),
  ]);

  return (
    <>
      <PageHeading
        title="Accounts"
        subtitle="The profiles you post from. A clip only counts from an account registered here."
      />

      {offline ? (
        <BotOffline />
      ) : (
        <AccountManager
          userId={userId}
          sig={sig}
          accounts={accounts}
          platforms={[...PLATFORMS]}
          signedInAs={session?.user?.discordId ?? null}
        />
      )}

      <p className="mt-8 max-w-2xl text-xs text-muted-foreground/70">
        Adding an account gives you a code to put in your bio, so we can check the profile is
        yours. Run <code className="font-mono">/verify</code> in Discord once it&apos;s there —
        or <code className="font-mono">/my-accounts</code> to see the code again.
      </p>
    </>
  );
}
