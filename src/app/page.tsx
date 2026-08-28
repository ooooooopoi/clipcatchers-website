import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Gauge, ReceiptText, ShieldCheck } from "lucide-react";
import { Comparison } from "@/components/marketing/comparison";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Industries } from "@/components/marketing/industries";
import { Pricing } from "@/components/marketing/pricing";
import { Results } from "@/components/marketing/results";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Verification } from "@/components/marketing/verification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";
import { formatCompact } from "@/lib/format";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { getPublicStats } from "@/lib/public-stats";
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

  // One number, not three. Clips published and creators paid are our operating
  // detail — a brand reading the hero is asking "how much reach can you
  // actually deliver", and two extra figures beside the answer make it take
  // longer to find. The full breakdown is still in Results for anyone who
  // wants it.
  //
  // Live where the database answered, the last recorded total where it didn't.
  // Falling back rather than rendering a zero: a homepage claiming "0 views
  // delivered" during a blip is worse than one an hour out of date.
  const live = stats.live && stats.totalViews > 0;
  const totalViews = live ? formatCompact(stats.totalViews) : SITE_STATS.viewsDelivered;

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
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            No retainer · No minimum term · You only pay for delivered views
          </p>

          {/* One line, on the way past. The full per-client breakdown lives in
              Results, which reads the same cached query. */}
          <p className="mt-14 text-sm text-muted-foreground">
            <span className="font-mono text-base font-semibold text-foreground">
              {totalViews}
            </span>{" "}
            views delivered for brands so far
          </p>
        </section>

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

        <HowItWorks />

        {/* The mock client report used to sit here. It was built from a real
            campaign's figures, but nobody could say whose — and a panel of
            invented-looking numbers under a line promising every figure is
            real was doing the opposite of its job. The claim it carried
            ("a private link, no login") is made in Results and the FAQ, both
            of which can point at something true. */}

        <Comparison />
        <Verification />
        <Results />
        <Industries />
        <Pricing />

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

        {/* Final conversion */}
        <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-24">
          <div className="surface reveal rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Tell us what you&apos;re promoting
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
              We&apos;ll come back with what it would cost and what it should realistically
              deliver — based on campaigns we&apos;ve actually run, not a projection.
              Creators are usually posting within a day of approval.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/launch">
                  Launch a Campaign
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Client sign in</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              No obligation · No card required · Reply within one working day
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
