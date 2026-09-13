import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { clipperSignature } from "@/lib/share";

export const metadata: Metadata = {
  title: "Your clips",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Where signing in with Discord lands.
 *
 * ── Why this exists rather than a link to the dashboard ──────────────────
 * The dashboard is a client's view — campaigns, invoices, spend. A clipper
 * arriving there sees an empty page and a bill they have nothing to do with.
 * That mistake has been made here before: the /signup path was removed for
 * exactly this reason, and the note on it is still in app/page.tsx.
 *
 * ── Why a redirect rather than a second copy of the page ─────────────────
 * /clipper/<id>/<sig> already renders everything a clipper needs, and it is
 * reached from a link the bot DMs. Rebuilding that view here would mean two
 * pages showing one person's earnings, which drift. So this works out who
 * they are, mints the same signature the bot would, and hands them to the
 * page that already exists.
 *
 * The signature stays the credential either way — this route only saves them
 * needing the DM to find it.
 */
export default async function MePage() {
  const session = await auth();

  if (!session?.user) {
    // Straight to Discord rather than the login form: nobody reaches /me
    // except from a Discord sign-in, and offering an email box would be
    // asking a clipper for a password they never set.
    redirect("/login?discord=1&next=/me");
  }

  const discordId = session.user.discordId;

  if (!discordId) {
    // Signed in, but as a client — they came in by email or Google. Send them
    // where their own things are instead of showing an error.
    redirect("/dashboard");
  }

  const sig = clipperSignature(discordId);
  if (!sig) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-24 text-center">
        <h1 className="display text-2xl">Not set up yet</h1>
        <p className="mt-3 text-muted-foreground">
          Clipper pages aren&apos;t configured on this deployment. Run{" "}
          <code className="font-mono">/balance</code> in Discord instead, or ask an
          admin.
        </p>
        <Link href="/" className="mt-6 inline-block text-primary underline-offset-4 hover:underline">
          Back to the site
        </Link>
      </div>
    );
  }

  redirect(`/clipper/${encodeURIComponent(discordId)}/${sig}`);
}
