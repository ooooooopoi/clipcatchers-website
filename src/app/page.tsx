import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Gauge, ReceiptText, ShieldCheck } from "lucide-react";
import { AfterLaunch } from "@/components/marketing/after-launch";
import { Clients } from "@/components/marketing/clients";
import { Comparison } from "@/components/marketing/comparison";
import { Control } from "@/components/marketing/control";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Industries } from "@/components/marketing/industries";
import { Pricing } from "@/components/marketing/pricing";
import { Proof } from "@/components/marketing/proof";
import { Results } from "@/components/marketing/results";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Verification } from "@/components/marketing/verification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";
import { formatCompact } from "@/lib/format";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { NAMED_CLIENTS, getPublicStats, slugify } from "@/lib/public-stats";
import { SITE_STATS } from "@/lib/site-stats";

const TITLE = "Clip Catchers — Performance-based creator distribution for brands";
const DESCRIPTION =
  "Launch a TikTok and Instagram campaign, brief a network of verified creators, and pay only for views that actually landed. No retainer, no minimum term, live reporting per clip.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Public page, unlike the rest of the app.
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  keywords: [
    "creator distribution",
    "performance marketing",
    "TikTok campaigns",
    "Instagram Reels campaigns",
    "clipping campaigns",
    "pay per view advertising",
    "influencer marketing alternative",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Clip Catchers",
    url: "/",
    // Without this every link pasted into Discord, X or LinkedIn rendered as
    // a bare grey card — on a product whose deals start in DMs, that's the
    // highest-traffic surface there is. See src/app/opengraph-image.tsx.
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

// Creators join through Discord — that's where campaigns are briefed, clips
// submitted and payouts run. Pointing them at /signup put them in the client
// dashboard instead, which is a dead end for a clipper. Falls back to signup
// if the invite isn't configured, so a missing variable can't leave a dead
// button on the page.
const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || "";
const CREATOR_HREF = DISCORD_INVITE || "/signup";

/** The four objections that otherwise decide it before anyone asks. */
const GUARANTEES = [
  {
    icon: Ban,
    title: "No retainer",
    body: "Nothing up front, no minimum term. You fund a budget and it draws down against delivery.",
  },
  {
    icon: Gauge,
    title: "You can't overspend",
    body: "Set a total and a per-post cap. The campaign closes itself the moment the budget is met.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing is self-reported",
    body: "Views are read off the live post every hour and logged per clip, with a timestamp.",
  },
  {
    icon: ReceiptText,
    title: "You see every clip",
    body: "Not a summary — the actual list, with a link to each post and what it earned.",
  },
] as const;

const FAQ = [
  {
    q: "How do you know the views are real?",
    a: "Every clip is read directly from the live post on TikTok or Instagram and logged on its own, with a timestamp. Nothing is self-reported by the creator, and any figure on your dashboard can be traced back to the individual video that earned it.",
  },
  {
    q: "What stops someone buying views?",
    a: "Creators verify ownership of an account before a single clip counts, and clips are checked for the engagement pattern bought views leave behind — view counts that move without the comments, shares and saves that normally come with them. Clips that fail are rejected and earn nothing.",
  },
  {
    q: "What does it cost?",
    a: `$${RATE_PER_THOUSAND.toFixed(2)} per 1,000 delivered views. No retainer, no minimum term, no setup fee. You set the total budget and the campaign closes itself the moment it's spent, so you can't overspend. The same reach bought as paid social typically runs four to six times that, and won't tell you which post earned it.`,
  },
  {
    q: "Can I control what creators make?",
    a: "Yes. Your brief sets the rules — required footage, the hook, hashtags or sound, anything you don't want said, and a minimum view threshold before a clip counts. Clips that break the brief are rejected and earn nothing. What you don't do is approve each post individually; that's the trade that makes volume possible.",
  },
  {
    q: "What happens if performance is weak?",
    a: "You spend proportionally less. Billing is against views delivered, so a campaign that underperforms costs less rather than costing the same. Unspent budget is never charged, and we'll tell you honestly whether the assets or the brief are the problem before you put more behind it.",
  },
  {
    q: "How quickly do creators start posting?",
    a: "Usually within a day of a campaign being approved. Clips tend to land fastest in the first 72 hours, which is when a release or a launch benefits most.",
  },
  {
    q: "Which platforms do you cover?",
    a: "TikTok and Instagram. TikTok carries the majority of delivery today; Instagram works well as a second surface on the same assets.",
  },
  {
    q: "How do I report this to my team?",
    a: "Every campaign has a private share link that opens the live report with no account required — send it to a manager, a label or a client. The full per-clip breakdown exports for anyone who needs it in a spreadsheet or a deck.",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const stats = await getPublicStats();

  // The headline figure, for the closing CTA's stat strip. The proof band
  // under the hero does its own formatting from the same `stats` object.
  //
  // Live where the database answered, the last recorded total where it didn't.
  // Falling back rather than rendering a zero: a homepage claiming "0 views
  // delivered" during a blip is worse than one an hour out of date.
  const live = stats.live && stats.totalViews > 0;
  const totalViews = live ? formatCompact(stats.totalViews) : SITE_STATS.viewsDelivered;

  // The closing CTA's secondary action. Derived from the allowlist rather than
  // hardcoded, so emptying NAMED_CLIENTS drops the button instead of leaving
  // one pointed at a page that would refuse to render.
  const caseStudyHref = NAMED_CLIENTS[0] ? `/case-studies/${slugify(NAMED_CLIENTS[0])}` : null;

  return (
    // overflow-x-clip, not overflow-hidden: `hidden` makes this a scroll
    // container, which silently stops the sticky header from sticking.
    <div className="relative min-h-screen overflow-x-clip">
      {/* The grid, and nothing else. There used to be a tinted glow behind the
          hero as well; once the accent went from orange to near-black it
          stopped reading as warmth and started reading as a grey smudge across
          the top of a white page — a monochrome scheme has no colour to bloom,
          so the honest version is to drop it and let the page be white. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-grid opacity-[0.25]" />

      <SiteHeader signedIn={Boolean(user)} />

      <main>
        {/* Hero */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Performance-based creator distribution for brands
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            {/* No coloured span. On a monochrome page emphasis comes from
                weight and size, not hue — tinting three words a slightly
                different shade of near-black reads as a rendering fault
                rather than as emphasis. */}
            Scale your brand through hundreds of creators
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Launch a TikTok and Instagram campaign, brief a network of verified creators,
            and pay only for views that actually landed — not an influencer retainer.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/launch">
                Launch a Campaign
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ctaOutline">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            No retainer · No minimum term · You only pay for delivered views
          </p>
        </section>

        {/* The single "40.7M views delivered so far" line used to close the
            hero. One number on its own answers "are you real" and nothing
            else; the same query already knows the clips, the creators and the
            campaigns behind it, and a brand deciding whether to keep reading
            does that in the first screen. */}
        <Proof stats={stats} />

        {/* The four risk answers, before anything else has to be read. */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GUARANTEES.map((item) => (
              <div
                key={item.title}
                className="surface reveal rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <item.icon className="h-4 w-4 text-primary-ink" />
                </span>
                <h2 className="mt-4 text-sm font-semibold">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Clients />
        <HowItWorks />

        {/* The mock client report used to sit here. It was built from a real
            campaign's figures, but nobody could say whose — and a panel of
            invented-looking numbers under a line promising every figure is
            real was doing the opposite of its job. The claim it carried
            ("a private link, no login") is made in Results and the FAQ, both
            of which can point at something true. */}

        <Comparison />
        <Verification />
        {/* Straight after verification on purpose. That section answers "is
            the number real"; this one answers "and what stops the number
            costing me more than I meant" — the same reader, one question
            later. */}
        <Control />
        <Results />
        <Industries />
        <Pricing />

        {/* Deliberately after the price. Everything above argues the case; the
            last thing standing between a convinced reader and the form is
            procedural — what the next week actually looks like — and it's
            cheapest to answer immediately before the ask. */}
        <AfterLaunch />

        {/* For creators — deliberately one panel, deliberately late. They're
            the supply side and they arrive through Discord anyway; the top of
            this page belongs to the people with a budget. */}
        <section
          id="creators"
          className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-20"
        >
          <Card className="surface reveal overflow-hidden border-border p-7 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
                  For creators
                </p>
                <h2 className="mt-2.5 text-2xl font-semibold tracking-tight">
                  Get paid for the views you already generate
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Clip content you&apos;d happily post anyway and earn per 1,000 views.
                  Verify your account, pick a live campaign, submit the link — paid out by
                  PayPal or USDT. No follower minimum, no exclusivity.
                </p>
              </div>
              <Button asChild variant="outline" size="lg">
                <a
                  href={CREATOR_HREF}
                  {...(DISCORD_INVITE ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  Join the network
                  <ArrowRight />
                </a>
              </Button>
            </div>
          </Card>
        </section>

        {/* FAQ — native <details> so it works without JavaScript and stays
            keyboard and screen-reader accessible for free. */}
        <section
          id="faq"
          className="relative z-10 mx-auto w-full max-w-3xl scroll-mt-24 px-5 pb-20"
        >
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Questions worth asking
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="surface group reveal rounded-xl border border-border bg-card px-5 py-4 open:border-primary/25"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="shrink-0 font-mono text-lg text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final conversion.

            The heading used to be "Tell us what you're promoting" over the
            same paragraph the /launch page opens with, word for word — so
            clicking the button showed you the sentence you'd just read and
            looked like a page that hadn't loaded. It closes the loop from the
            section above instead: the reader has just been told there's no
            lock-in, and this is the sentence that spends it.

            The secondary button was "Client sign in", which is the wrong ask
            for someone who has read the whole page and hasn't bought yet, and
            it's repeated in the footer a few hundred pixels below. It's now
            the exit an undecided reader actually wants — real numbers from a
            named client, which is the one thing we can offer that a deck
            can't. */}
        <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-24">
          <div className="surface reveal overflow-hidden rounded-3xl border border-border bg-card">
            <div className="px-6 py-14 text-center sm:px-12">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Start with one campaign
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
                Tell us what you&apos;re promoting and roughly what you&apos;d spend, and
                we&apos;ll come back with what it should realistically deliver — drawn
                from campaigns we&apos;ve run, not a projection. If it isn&apos;t a fit,
                we&apos;ll tell you that instead.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/launch">
                    Launch a Campaign
                    <ArrowRight />
                  </Link>
                </Button>
                {caseStudyHref && (
                  <Button asChild size="lg" variant="outline">
                    <Link href={caseStudyHref}>See a real campaign&apos;s numbers</Link>
                  </Button>
                )}
              </div>
              {/* Countable, checkable claims rather than "no obligation" —
                  the form really does require two fields, and a reader who
                  believes that is a reader who starts filling it in. */}
              <p className="mt-5 text-xs text-muted-foreground">
                Two required fields · No card at any point · Reply within one working day
              </p>
            </div>

            {/* The three numbers that decide it, at the point of deciding.
                They're all stated further up the page, but nobody scrolls back
                to check a figure before clicking — so they're repeated here
                where the decision is actually made. */}
            <div className="grid divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { value: `$${RATE_PER_THOUSAND.toFixed(2)}`, label: "per 1,000 delivered views" },
                { value: totalViews, label: "views delivered for brands" },
                { value: "24 hrs", label: "typical time to first clips" },
              ].map((stat) => (
                <div key={stat.label} className="px-5 py-6 text-center">
                  <p className="font-mono text-xl font-semibold tracking-tight text-primary-ink">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
