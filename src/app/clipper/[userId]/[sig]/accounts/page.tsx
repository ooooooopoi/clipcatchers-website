import type { Metadata } from "next";
import { BotOffline, PageHeading } from "@/components/clipper/chrome";
import { loadClipper } from "@/lib/clipper-data";

export const metadata: Metadata = { title: "Accounts" };
export const dynamic = "force-dynamic";

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  const { accounts, offline } = await loadClipper(userId, sig);

  return (
    <>
      <PageHeading
        title="Accounts"
        subtitle="The profiles you post from. A clip only counts from an account registered here."
      />

      {offline ? (
        <BotOffline />
      ) : accounts.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No accounts registered yet.
        </p>
      ) : (
        <ul className="mt-8 max-w-2xl space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="surface flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
            >
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {a.platform}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">@{a.handle}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Registering runs through Discord because it involves a verification
          code that proves the account is theirs. That code deliberately never
          reaches this page — anyone holding the signed link can open it, and a
          visible code would let them claim someone else's profile. */}
      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        To add or remove an account, run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
          /register
        </code>{" "}
        in Discord. It gives you a code to put in your bio so we can check the profile is
        yours — which is why it happens there and not here.
      </p>
    </>
  );
}
