import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand";
import { AppSignIn } from "@/components/clipper/app-sign-in";

export const metadata: Metadata = {
  title: "Clip Catchers App",
  // The marketing site is what should rank; the app door shouldn't compete
  // with it for its own brand name.
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * The front door at app.clipcatchers.net — the middleware rewrites that
 * host's `/` here.
 *
 * ── Why it exists at all ─────────────────────────────────────────────────
 * The clipper app lives at /clipper/<id>/<sig>, which nobody can type. The
 * routes into it were a DM'd link or finding the sign-in on the marketing
 * site. An app needs an address a clipper can say out loud — "go to
 * app.clipcatchers.net" — and everything after that address is worked out
 * from who they are, not from what they typed.
 *
 * Signed in, it is nothing but a redirect: the door shouldn't be a room.
 */
export default async function AppLauncherPage() {
  const session = await auth();

  // Straight through for anyone the server already knows. A clipper goes to
  // their own pages; a client who wandered here goes to theirs — a working
  // dashboard beats an explanation of why this door wasn't for them.
  if (session?.user?.discordId) redirect("/me");
  if (session?.user) redirect("/dashboard");

  const discordEnabled = Boolean(
    process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
  );

  return (
    // clipper-shell: the same class the dashboard uses, so this page gets the
    // dark theme and the body:has() overscroll fix without a second mechanism.
    <div className="clipper-shell dark flex min-h-screen flex-col items-center justify-center bg-background px-5 text-center text-foreground">
      <BrandMark className="h-14 w-14" />
      <h1 className="wordmark mt-5 text-2xl">Clip Catchers</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Campaigns, your clips, your earnings, and a withdraw button. Sign in with the
        Discord account you clip with.
      </p>

      <div className="mt-8 flex w-full justify-center">
        {discordEnabled ? (
          <AppSignIn />
        ) : (
          <p className="max-w-sm text-sm text-muted-foreground">
            Sign-in isn&apos;t configured on this deployment. Run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              /my-clips
            </code>{" "}
            in Discord for your private link instead.
          </p>
        )}
      </div>

      <p className="mt-10 text-xs text-muted-foreground/70">
        New here? Join at{" "}
        <a
          href="https://clipcatchers.net/for-creators"
          className="text-primary-ink underline-offset-4 hover:underline"
        >
          clipcatchers.net/for-creators
        </a>
      </p>
    </div>
  );
}
