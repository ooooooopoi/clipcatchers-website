import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Gauge, Phone, ReceiptText, ShieldCheck } from "lucide-react";
import { AfterLaunch } from "@/components/marketing/after-launch";
import { Clients } from "@/components/marketing/clients";
import { ClipsWall } from "@/components/marketing/clips-wall";
import { Comparison } from "@/components/marketing/comparison";
import { Control } from "@/components/marketing/control";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Industries } from "@/components/marketing/industries";
import { Pricing } from "@/components/marketing/pricing";
import { Proof } from "@/components/marketing/proof";
import { Results } from "@/components/marketing/results";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StarField } from "@/components/marketing/star-field";
import { Ticker } from "@/components/marketing/ticker";
import { Verification } from "@/components/marketing/verification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";
import { CREATOR_HREF, DISCORD_LINK_PROPS } from "@/lib/discord";
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

// Creators join through Discord — see lib/discord.ts. The /signup fallback
// that used to live here is gone: it sent clippers to the client dashboard,
// which is a dead end for them, and it was the live behaviour because the
// invite was never configured.

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
      {/* The starfield, and nothing else. There used to be a tinted glow
          behind the hero as well; once the accent went from orange to
          near-black it stopped reading as warmth and started reading as a grey
          smudge across the top of a white page — a monochrome scheme has no
          colour to bloom, so the honest version is to drop it and let the page
          be white. Taller than the old 560px because it fades on a mask
          instead of stopping at an edge; see star-field.tsx. */}
      <StarField className="h-[760px]" />

      <SiteHeader signedIn={Boolean(user)} />

      <main>
        {/* Hero */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Performance-based creator distribution for brands
          </span>

          {/* No coloured span. On a monochrome page emphasis comes from
              weight and size, not hue — tinting three words a slightly
              different shade of near-black reads as a rendering fault rather
              than as emphasis.

              Set in the brand's own voice rather than in the semibold
              sentence case everything else used — see .display in globals.css
              for why. Uppercase at this weight makes a solid block of type,
              which is the whole effect; it only holds together because the
              leading is under 1, and that only works because uppercase has no
              descenders to collide.

              The mobile size is set from the fold, not from the desktop step.
              Uppercase costs lines: this headline sets in three at 72px and in
              five at 40px on a 375px screen, and measured on an iPhone SE
              (375x667) that pushed "Book a call" half under the fold at 645px.
              36px wraps to four, and the tighter mobile margins below take the
              rest — both buttons now land above 667. Desktop spacing is
              unchanged, hence the sm: steps. */}
          <h1 className="display mx-auto mt-6 max-w-4xl text-4xl sm:mt-7 sm:text-6xl lg:text-7xl">
            Scale your brand through hundreds of creators
          </h1>

          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground sm:mt-7 sm:text-lg">
            Launch a TikTok and Instagram campaign, brief a network of verified creators,
            and pay only for views that actually landed — not an influencer retainer.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
            <Button asChild size="lg" className="h-12 px-7">
              <Link href="/launch">
                Start a campaign
                <ArrowRight />
              </Link>
            </Button>
            {/* Straight to the booking tab. The hero's second action used to
                be "See how it works", which is a request to keep reading —
                fine, but the page already scrolls and the anchor is in the
                header. This is the one someone who is already interested
                wants, and it was previously three pages away. */}
            <Button asChild size="lg" variant="outline" className="h-12 px-7">
              <Link href="/launch?mode=call">
                <Phone />
                Book a call
              </Link>
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

        {/* The brand/clipper mode switcher stood here. Its brand half repeated
            the HowItWorks section a few blocks below — same four beats, same
            page — and its clipper half is served by the "For creators" panel
            further down, so removing it cost the page nothing it still says
            elsewhere. */}

        {/* The terms, running edge to edge. The only full-bleed element on the
            page and the only one that moves by itself — see ticker.tsx. */}
        <Ticker />

        {/* The four risk answers, before anything else has to be read. */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-4 pt-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GUARANTEES.map((item) => (
              <div
                key={item.title}
                className="surface lift reveal rounded-2xl border border-border bg-card p-5 hover:border-[hsl(var(--border-strong))]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <item.icon className="h-4 w-4 text-primary-ink" />
                </span>
                <h2 className="display-sm mt-4 text-sm">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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

        {/* Straight after Results for the same reason Control follows
            Verification: Results is the numbers, this is the posts behind
            them. A reader who has just been told 244M views can click one and
            count it themselves. Renders nothing until enough clips have a
            cached thumbnail — see clips-wall.tsx. */}
        <ClipsWall />

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
                <p className="eyebrow text-muted-foreground/70">
                  For creators
                </p>
                <h2 className="display mt-3 text-2xl sm:text-3xl">
                  Get paid for the views you already generate
                </h2>
                <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                  Clip content you&apos;d happily post anyway and earn per 1,000 views.
                  Verify your account, pick a live campaign, submit the link — paid out by
                  PayPal or USDT. No follower minimum, no exclusivity.
                </p>
                {/* The one thing the public site can say to a clipper who is
                    already signed up. Their page is behind a signed link that
                    only the bot can mint — it's derived from their Discord id,
                    so there is nothing to link to from here that would work
                    for more than one person. Naming the command is the whole
                    of what this side can usefully do. */}
                <p className="mt-3 text-sm text-muted-foreground">
                  Already clipping?{" "}
                  <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                    /my-clips
                  </code>{" "}
                  in Discord opens your page — everything you&apos;ve submitted and what
                  you&apos;re owed.
                </p>
              </div>
              <Button asChild variant="outline" size="lg">
                <a
                  href={CREATOR_HREF}
                  {...DISCORD_LINK_PROPS}
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
            <p className="eyebrow text-primary-ink">FAQ</p>
            <h2 className="display mt-3 text-3xl sm:text-5xl">
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
              <h2 className="display mx-auto max-w-2xl text-3xl sm:text-5xl">
                Start with one campaign
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
                Tell us what you&apos;re promoting and roughly what you&apos;d spend, and
                we&apos;ll come back with what it should realistically deliver — drawn
                from campaigns we&apos;ve run, not a projection. If it isn&apos;t a fit,
                we&apos;ll tell you that instead.
              </p>
              {/* Two buttons, then a link. Three buttons abreast is a reader
                  being asked to rank three things at the exact moment they had
                  decided one — so the case study drops to a text link. It's
                  the exit for someone who still isn't sure, and an exit does
                  not need to compete with the entrance. */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="h-12 px-7">
                  <Link href="/launch">
                    Start a campaign
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7">
                  <Link href="/launch?mode=call">
                    <Phone />
                    Book a call
                  </Link>
                </Button>
              </div>
              {/* Countable, checkable claims rather than "no obligation" —
                  the form really does require two fields, and a reader who
                  believes that is a reader who starts filling it in. */}
              <p className="mt-5 text-xs text-muted-foreground">
                Two required fields · No card at any point · Reply within one working day
              </p>
              {caseStudyHref && (
                <p className="mt-4 text-sm">
                  <Link
                    href={caseStudyHref}
                    className="text-primary-ink underline-offset-4 hover:underline"
                  >
                    Or see a real campaign&apos;s numbers first →
                  </Link>
                </p>
              )}
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
