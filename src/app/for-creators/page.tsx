import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Send, Wallet } from "lucide-react";
import { PageShell } from "@/components/marketing/page-shell";
import { Button } from "@/components/ui/button";
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

// Creators join through Discord — that's where campaigns are briefed, clips
// submitted and payouts run. Pointing them at /signup put them in the client
// dashboard instead, which is a dead end for a clipper. Falls back to signup
// if the invite isn't configured, so a missing variable can't leave a dead
// button on the page.
const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || "";
const CREATOR_HREF = DISCORD_INVITE || "/signup";

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
            <a
              href={CREATOR_HREF}
              {...(DISCORD_INVITE ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
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
        <div className="surface reveal rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="display-sm text-sm">Already clipping with us?</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Run{" "}
            <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              /my-clips
            </code>{" "}
            in Discord and we&apos;ll DM you a private link to your own page — everything
            you&apos;ve submitted, what each clip is worth and what you&apos;re owed. There
            is nothing to link to from here: the page is signed to your Discord account, so
            the bot is the only thing that can make it.
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
