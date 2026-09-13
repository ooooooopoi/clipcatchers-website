import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Send, Wallet } from "lucide-react";
import { DiscordButton } from "@/components/discord-button";
import { PageShell } from "@/components/marketing/page-shell";
import { Button } from "@/components/ui/button";
import { CREATOR_HREF, DISCORD_LINK_PROPS } from "@/lib/discord";
import { RATE_PER_THOUSAND } from "@/lib/pricing";

const TITLE = "For creators";
const SOCIAL_TITLE = "Get paid to clip — Clip Catchers";
const DESCRIPTION =
  "Clip content you'd post anyway and earn per 1,000 views. Verify your account, pick a live campaign, submit the link. No follower minimum, no exclusivity.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/for-creators" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/for-creators",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

// Creators join through Discord — see lib/discord.ts.

const STEPS = [
  {
    icon: BadgeCheck,
    title: "Verify an account",
    body: "Run /add-account in Discord. You put a code we give you in your bio, we read it off your live profile, and that account is yours. This is what stops somebody else submitting your videos.",
  },
  {
    icon: Send,
    title: "Pick a campaign and post",
    body: "Live campaigns list what to make and what the rules are. Cut it your way, post it from a verified account, and submit the link — in Discord, or on your own page on this site.",
  },
  {
    icon: Wallet,
    title: "Get paid on views",
    body: "Your clip lands as pending while we check the post is yours and follows the brief. Once approved, views are read off the live post every hour and your balance moves with them. Paid out by PayPal or USDT.",
  },
] as const;

/**
 * The supply side, on its own page.
 *
 * It was one panel near the bottom of the homepage, which was the right
 * weight when the homepage was the whole site — the top of that page belongs
 * to people with a budget. But creators are the reason the model works, they
 * arrive from Discord and TikTok rather than from the hero, and a link sent to
 * a prospective clipper should open on something written for them.
 *
 * Deliberately blunt about the parts that cost a creator money: rejection
 * earns nothing, and bought views are rejected. A page that hides that
 * recruits people who will be angry later.
 */
export default function ForCreatorsPage() {
  // Read on the server: the browser can't see whether the provider is set up,
  // and a sign-in button that bounces off a missing provider is worse than
  // none — the /my-clips route still works, so that is what shows instead.
  const discordEnabled = Boolean(
    process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
  );

  return (
    <PageShell
      eyebrow="For creators"
      title="Get paid for the views you already generate"
      intro={
        <>
          Clip content you&apos;d happily post anyway and earn per 1,000 views. No
          follower minimum, no exclusivity, and nothing to pay to join.
        </>
      }
    >
      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="surface reveal rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                  <s.icon className="h-4 w-4 text-primary-ink" />
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className="display-sm mt-4 text-base">{s.title}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-7">
            <a href={CREATOR_HREF} {...DISCORD_LINK_PROPS}>
              Join the network
              <ArrowRight />
            </a>
          </Button>
        </div>
      </section>

      {/* The straight talk. */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <div className="surface reveal rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="display text-xl">Read this before you post</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">Rejected clips earn nothing.</span> If a
              clip breaks the campaign&apos;s brief — wrong sound, missing footage, wording
              that was ruled out — it&apos;s rejected. The time you spent on it is yours to
              lose, which is why the brief is worth reading first.
            </li>
            <li>
              <span className="text-foreground">Bought views get you removed.</span> View
              counts that climb without the comments, shares and saves that normally come
              with them are flagged and rejected. This is not negotiable and it is checked
              on every clip.
            </li>
            <li>
              <span className="text-foreground">Post from your own account.</span> Clips
              posted from an account you haven&apos;t verified don&apos;t count, and a clip
              posted by somebody else is rejected outright.
            </li>
            <li>
              <span className="text-foreground">Pending is normal.</span> A submitted clip
              sits as pending until we&apos;ve confirmed the post is yours. That is the
              system working, not a problem with your clip.
            </li>
          </ul>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-8">
        {/* ── The way in ──────────────────────────────────────────────
            This used to say there was nothing to link to, because the only
            way to reach a clipper's page was a signed link the bot DM'd. That
            stopped being true when Discord sign-in arrived: /me works out who
            they are from the snowflake and mints the same signature
            server-side, so the page is one button away.

            Signing in also unlocks the things the signed link deliberately
            cannot do — setting a payout address, registering an account,
            withdrawing — so it is the better door for a returning clipper
            regardless. */}
        <div className="surface reveal rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
          <h2 className="display text-lg">Already clipping with us?</h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sign in and go straight to your page — every clip you&apos;ve submitted, what each
            one is worth, what you&apos;re owed, and a button to withdraw it.
          </p>

          {discordEnabled ? (
            <div className="mt-5 flex justify-center">
              <DiscordButton
                label="Sign in with Discord"
                variant="default"
                size="lg"
                className="h-12 px-7"
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Run{" "}
              <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                /my-clips
              </code>{" "}
              in Discord and we&apos;ll DM you a private link to your page.
            </p>
          )}

          <p className="mt-4 text-xs text-muted-foreground/70">
            Same Discord account you clip with. Or run{" "}
            <code className="font-mono">/my-clips</code> in the server for a private link
            instead.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Brands: it&apos;s{" "}
          <Link href="/pricing" className="text-primary-ink underline-offset-4 hover:underline">
            ${RATE_PER_THOUSAND.toFixed(2)} per 1,000 delivered views
          </Link>{" "}
          on the other side of this.
        </p>
      </section>
    </PageShell>
  );
}
