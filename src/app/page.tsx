import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Gauge, Phone, ReceiptText, ShieldCheck } from "lucide-react";
import { Clients } from "@/components/marketing/clients";
import { ClipsWall } from "@/components/marketing/clips-wall";
import { RevealHeading } from "@/components/marketing/reveal";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { OrganizationSchema } from "@/components/marketing/organization-schema";
import { Proof } from "@/components/marketing/proof";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Ticker } from "@/components/marketing/ticker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";
import { CREATOR_HREF, DISCORD_LINK_PROPS } from "@/lib/discord";
import { formatCompact } from "@/lib/format";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { NAMED_CLIENTS, getPublicStats, slugify } from "@/lib/public-stats";
import { SITE_STATS } from "@/lib/site-stats";
import { PUBLIC_VIEWPORT } from "@/lib/public-theme";

export const viewport = PUBLIC_VIEWPORT;

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

/**
 * The four objections that otherwise decide it before anyone asks. Titles
 * only: the explanations live on /pricing and /how-it-works.
 */
const GUARANTEES = [
  { icon: Ban, title: "No retainer" },
  { icon: Gauge, title: "You can't overspend" },
  { icon: ShieldCheck, title: "Nothing is self-reported" },
  { icon: ReceiptText, title: "You see every clip" },
] as const;

const FAQ = [
  {
    q: "How do you know the views are real?",
    a: "Every clip is read directly from the live post on TikTok or Instagram and logged on its own, with a timestamp. Nothing is self-reported by the creator, and any figure on your dashboard can be traced back to the individual video that earned it.",
  },
  {
    q: "What stops someone buying views?",
    a: "Creators verify ownership of an account before a single clip counts, and clips are checked for the engagement pattern bought views leave behind: view counts that move without the comments, shares and saves that normally come with them. Clips that fail are rejected and earn nothing.",
  },
  {
    q: "What does it cost?",
    a: `$${RATE_PER_THOUSAND.toFixed(2)} per 1,000 delivered views. No retainer, no minimum term, no setup fee. You set the total budget and the campaign closes itself the moment it's spent, so you can't overspend. The same reach bought as paid social typically runs four to six times that, and won't tell you which post earned it.`,
  },
  {
    q: "Can I control what creators make?",
    a: "Yes. Your brief sets the rules: required footage, the hook, hashtags or sound, anything you don't want said, and a minimum view threshold before a clip counts. Clips that break the brief are rejected and earn nothing. What you don't do is approve each post individually; that's the trade that makes volume possible.",
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
    a: "Every campaign has a private share link that opens the live report with no account required. Send it to a manager, a label or a client. The full per-clip breakdown exports for anyone who needs it in a spreadsheet or a deck.",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  // Read on the server: the browser cannot see whether the provider is
  // configured, and a sign-in that bounces is worse than none.
  const discordEnabled = Boolean(
    process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
  );
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
    <div className="marketing theme-black page-light relative min-h-screen overflow-x-clip bg-background text-foreground">
      <SmoothScroll />
      <OrganizationSchema />
      <SiteHeader
        signedIn={Boolean(user)}
        isClipper={Boolean(user?.discordId)}
        discordEnabled={discordEnabled}
      />

      <main>
        {/* Hero */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-20">
          {/* No kicker line above the headline. It was 11px letter-spaced
              grey — small print at the top of the page, and the tiny label
              over a big heading is the most familiar template pattern there
              is. The paragraph under the headline already says what we do.

              No coloured span. On a monochrome page emphasis comes from
              weight and size, not hue — tinting three words a slightly
              different shade of near-black reads as a rendering fault rather
              than as emphasis.

              Set in the brand's own voice rather than in the semibold
              sentence case everything else used — see .display in globals.css
              for why. Uppercase at this weight makes a solid block of type,
              which is the whole effect; it only holds together because the
              leading is under 1, and that only works because uppercase has no
              descenders to collide.

              The size is set from the screen, because uppercase in the wide
              display face costs lines and a fixed size strands words: the
              previous headline set in five lines at 36px on a 390px phone,
              with one word alone on a line. Each step targets a layout and
              divides the width it has by that layout's widest line, measured
              in the face:
                phones — GET YOUR / BRAND INTO / MILLIONS / OF FEEDS, widest
                  7.19em (/7.37), capped at 52px. Four short lines rather
                  than three long ones, because the three-line set came out
                  at 32px on a 390px phone and the paragraph under it, four
                  lines of body copy, was the bigger block on the screen.
                  From about 575 up, GET YOUR BRAND fits at the cap and it
                  sets in three, which is also fine.
                tablets — GET YOUR BRAND / INTO MILLIONS / OF FEEDS, widest
                  10.29em (/10.8 leaves room for a desktop scrollbar),
                  capped at 60px
                lg and up — GET YOUR BRAND INTO / MILLIONS OF FEEDS, widest
                  13.32em (/13.66), capped at 72px
              The non-breaking space keeps OF with FEEDS; without it the
              phone layout can end a line on OF. */}
          <RevealHeading className="display mx-auto max-w-5xl text-[clamp(1.5rem,calc((100vw_-_2.5rem)/7.37),3.25rem)] sm:text-[min(3.75rem,calc((100vw_-_2.5rem)/10.8))] lg:text-[min(4.5rem,calc((100vw_-_2.5rem)/13.66))]">
            Get your brand into millions of&nbsp;feeds
          </RevealHeading>

          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground sm:mt-7 sm:text-lg">
            Launch a TikTok and Instagram campaign, brief a network of verified creators,
            and pay only for views that actually landed, not an influencer retainer.
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

        </section>

        {/* Renders nothing: WALL_CLIPS is empty. The belt showed the
            network's video posts, and those are almost all relationship-meme
            captions over stock footage — on a page selling to brands that read
            as the product's ceiling, not its proof. It comes back by itself if
            clips worth showing are added to lib/wall-clips.ts. */}
        <ClipsWall />

        {/* The single "40.7M views delivered so far" line used to close the
            hero. One number on its own answers "are you real" and nothing
            else; the same query already knows the clips, the creators and the
            campaigns behind it, and a brand deciding whether to keep reading
            does that in the first screen. */}
        <Proof stats={stats} />

        {/* The brand/clipper mode switcher stood here. Its brand half repeated
            the how-it-works beats (now on /how-it-works rather than this page)
            and its clipper half is served by the "For creators" panel further
            down, so removing it cost the page nothing it still says
            elsewhere. */}

        {/* The terms, running edge to edge. Still the only full-bleed *band*
            here — the clips belt above travels too, and borrows this one's
            animation, but it rides on the page's own white instead of laying
            down a second surface. See ticker.tsx. */}
        <Ticker />

        {/* The four risk answers, before anything else has to be read. */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-14 sm:pb-20">
          {/* Four statements, read in one glance. Each had a 16-word
              paragraph under it in 14px grey — the fine print that makes a page
              look like it is hiding something. The titles say it; the detail
              is on /pricing and /how-it-works for anyone who wants it.

              Balanced, because four columns wrap three of them: unbalanced
              they broke as "NOTHING IS SELF- / REPORTED" and "YOU SEE EVERY /
              CLIP". */}
          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {GUARANTEES.map((item) => (
              <li key={item.title} className="flex items-center gap-3 border-t border-border pt-5">
                <item.icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                <h2 className="display-sm text-balance text-base sm:text-lg">{item.title}</h2>
              </li>
            ))}
          </ul>
        </section>

        <Clients />

        {/* For creators — deliberately one panel, deliberately late. They're
            the supply side and they arrive through Discord anyway; the top of
            this page belongs to the people with a budget. */}
        <section
          id="creators"
          className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-20"
        >
          <Card className="surface overflow-hidden border-border p-7 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="display text-2xl sm:text-3xl">
                  Get paid for the views you already generate
                </h2>
                <p className="mt-3.5 text-base text-muted-foreground">
                  Clip content you&apos;d post anyway. Get paid per 1,000 views.
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
            <h2 className="display text-3xl sm:text-5xl">
              Questions worth asking
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="surface group rounded-xl border border-border bg-card px-5 py-4 open:border-primary/25"
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
          <div className="surface panel-light overflow-hidden rounded-3xl border border-border bg-card">
            <div className="px-6 py-14 text-center sm:px-12">
              <h2 className="display mx-auto max-w-2xl text-3xl sm:text-5xl">
                Start with one campaign
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
                Tell us what you&apos;re promoting. We&apos;ll tell you what it should deliver.
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
                  <p className="display-num text-3xl text-primary sm:text-4xl">{stat.value}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
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
