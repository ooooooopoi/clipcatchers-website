import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clapperboard,
  Coins,
  Gauge,
  LayoutDashboard,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/brand";
import { HeroPreview } from "@/components/hero-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Clip Catchers — Pay creators for the views they deliver",
  description:
    "Launch a clipping campaign, brief a network of creators, and watch verified views land in a live dashboard. You only pay for performance.",
  // Public page, unlike the rest of the app.
  robots: { index: true, follow: true },
  openGraph: {
    title: "Clip Catchers — Pay creators for the views they deliver",
    description:
      "Launch a clipping campaign and watch verified views land in a live dashboard. Pay for performance, not promises.",
    type: "website",
  },
};

const BRAND_STEPS = [
  {
    icon: Rocket,
    title: "Brief your campaign",
    body: "Set your budget, rate per 1,000 views and the rules. Upload your assets and we take it from there.",
  },
  {
    icon: Clapperboard,
    title: "Creators clip it",
    body: "A vetted network of clippers posts to TikTok and Instagram from verified accounts.",
  },
  {
    icon: LineChart,
    title: "Watch it land",
    body: "Views are pulled from the platforms hourly and shown in your dashboard as they arrive.",
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Live reporting",
    body: "Views, reach, spend and effective CPM per campaign — refreshed automatically, never self-reported.",
  },
  {
    icon: ShieldCheck,
    title: "Verified accounts",
    body: "Every clipper proves ownership of the account they post from before a single clip counts.",
  },
  {
    icon: Gauge,
    title: "Budget control",
    body: "Set a cap per post and a total budget. Campaigns close themselves the moment it's spent.",
  },
  {
    icon: LayoutDashboard,
    title: "Client dashboard",
    body: "Your own login, or a private share link you can send anyone — no account required.",
  },
  {
    icon: Users,
    title: "Creator network",
    body: "Hundreds of clippers already posting daily, with a leaderboard that rewards the best.",
  },
  {
    icon: Coins,
    title: "Pay per view",
    body: "You're billed against delivery, not a flat retainer. No views, no spend.",
  },
];

const CREATOR_STEPS = [
  { icon: ShieldCheck, title: "Verify your account", body: "Drop a code in your bio — approved in about two minutes." },
  { icon: Clapperboard, title: "Clip live campaigns", body: "Pick a campaign, post the content, submit the link." },
  { icon: Wallet, title: "Get paid", body: "Earn per 1,000 views, cashed out by PayPal or USDT." },
];

// Creators join through Discord — that's where campaigns are briefed, clips
// submitted and payouts run. Pointing them at /signup put them in the client
// dashboard instead, which is a dead end for a clipper. Falls back to signup
// if the invite isn't configured, so a missing variable can't leave a dead
// button on the page.
const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || "";
const CREATOR_HREF = DISCORD_INVITE || "/signup";

const INCLUDED = [
  "Unlimited clips per campaign",
  "Views read from the live post, per clip",
  "Creator accounts verified before a clip counts",
  "Total budget and per-post view caps",
  "Live dashboard, plus a share link for anyone",
  "Full per-clip report on request",
];

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
    a: "$0.50 per 1,000 delivered views. No retainer, no minimum term, no setup fee. You set the total budget and the campaign closes itself the moment it's spent, so you can't overspend. For comparison, running the same reach as paid social costs several times that, and doesn't tell you which post earned it.",
  },
  {
    q: "How quickly do creators start posting?",
    a: "Usually within a day of a campaign being approved. Clips tend to land fastest in the first 72 hours, which is when a release benefits most.",
  },
  {
    q: "Which platforms do you cover?",
    a: "TikTok and Instagram. TikTok carries the majority of delivery today; Instagram works well as a second surface on the same assets.",
  },
  {
    q: "Can I see the results without logging in?",
    a: "Yes. Every campaign has a private share link you can send to a manager, a label or anyone else. It opens the live report with no account required.",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    // overflow-x-clip, not overflow-hidden: `hidden` makes this a scroll
    // container, which silently stops the sticky header below from sticking.
    // `clip` still trims the background blur without that side effect.
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-grid opacity-[0.25]" />
      <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />

      {/* Nav — stays put while the page scrolls, so Sign in and Start a
          campaign are always one click away rather than a scroll back up. */}
      {/* Glass rather than a solid bar, so content scrolling underneath stays
          visible through it. The fallback stays near-opaque: without backdrop
          blur, 70% alone leaves text sitting on whatever passes behind. */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        {/* Three zones: mark, then the explainer links centred, then the two
            actions. Keeping the centre column empty-but-present on mobile is
            what stops the logo drifting off-centre when the links hide. */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex flex-1 items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            {/* The mark alone below sm. With the wordmark, the nav and both
                actions, 375px wraps "Clip Catchers" onto two lines and runs
                Pricing straight through it. */}
            <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight sm:inline">
              Clip Catchers
            </span>
          </Link>

          {/* Four links need md to breathe. Below that the whole nav used to
              vanish, taking Pricing with it — so it stays on its own down to
              the narrowest screens, where it's the link people want most. */}
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden rounded-full md:inline-flex">
              <Link href="#results">Results</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden rounded-full md:inline-flex">
              <Link href="#how-it-works">How it works</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="#pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden rounded-full md:inline-flex">
              <Link href="#creators">For creators</Link>
            </Button>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            {user ? (
              <Button asChild size="sm" className="rounded-full">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="whitespace-nowrap rounded-full">
                  {/* "Get a quote" is too long for a 375px bar once Sign in
                      is beside it; the short label only shows there. */}
                  <Link href="/quote">
                    <span className="sm:hidden">Quote</span>
                    <span className="hidden sm:inline">Get a quote</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary-ink" />
          Pay for performance, not promises
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Get your content clipped by{" "}
          {/* Green into gold, the two colours of the mark — in the ink
              variants, since this is type on a white page. */}
          <span className="bg-gradient-to-r from-primary-ink via-primary-ink to-gold-ink bg-clip-text text-transparent">
            hundreds of creators
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Set a budget and a rate per 1,000 views. Our network clips your content across TikTok and
          Instagram, and every view lands in a dashboard you can watch in real time.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/quote">
              Get a quote
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#creators">Clip for us</Link>
          </Button>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            See pricing
          </Link>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          No retainer · No minimum term · You only pay for delivered views
        </p>

        {/* The product itself, this high up. Everything above is a claim; this
            is the first thing on the page that shows the thing being sold. */}
        <div className="mx-auto mt-14 max-w-4xl">
          <HeroPreview />
        </div>

        <p className="mx-auto mt-14 max-w-xl text-xs text-muted-foreground/80">
          Every figure below comes from campaigns we have actually run. Each view is
          read from the live post and logged per clip, so any number here can be
          traced back to the video that earned it.
        </p>

        {/* Real figures from campaigns we've run, not round numbers. Anyone
            asking to see the working can be shown the per-clip report. */}
        <div className="surface mx-auto mt-6 grid max-w-3xl grid-cols-2 divide-border rounded-2xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
          {[
            // Counted from approved clips in the ledger, so each of these can
            // be re-derived on demand. Deliberately not rounded up.
            { value: "40.7M", label: "views delivered" },
            { value: "1,486", label: "clips published" },
            // The price we charge, not what delivery costs us — publishing the
            // cost would undercut every quote before it's sent.
            { value: "$0.50", label: "per 1,000 views", gold: true },
            { value: "85", label: "creators paid" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-5">
              <p
                className={`font-mono text-2xl font-semibold tracking-tight sm:text-3xl ${
                  stat.gold ? "text-gold-ink" : "text-primary-ink"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Results — the total only. The per-campaign breakdown that used to sit
          here published how few campaigns we've run and how many creators are
          on each, which is competitor intelligence rather than proof. The
          working still exists; it's shown on a call, not on the open web. */}
      <section id="results" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">Results</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Views we&apos;ve actually delivered
          </h2>
        </div>

        <Card className="surface reveal mx-auto mt-10 max-w-2xl p-10 text-center sm:p-14">
          <p className="font-mono text-5xl font-semibold tracking-tight text-primary-ink sm:text-6xl">
            40.7M
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            views delivered across every campaign to date
          </p>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Counted from the individual posts that earned them, not estimated. We&apos;ll walk
            you through the full per-clip report on a call.
          </p>
        </Card>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">For brands</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Live in three steps
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {BRAND_STEPS.map((step, i) => (
            <Card key={step.title} className="surface lift reveal relative p-6">
              <span className="absolute right-5 top-5 font-mono text-4xl font-semibold text-primary/10">
                0{i + 1}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/60">
                <step.icon className="h-5 w-5 text-primary-ink" />
              </span>
              <h3 className="mt-5 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything measured, nothing guessed
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Numbers come from the platforms themselves, so what you see is what actually happened.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="surface lift reveal group p-6 hover:border-primary/25"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60 transition-colors group-hover:border-primary/30">
                <feature.icon className="h-4 w-4 text-primary-ink" />
              </span>
              <h3 className="mt-4 font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing — one rate, stated plainly. A page that makes people ask what
          it costs loses the ones who won't bother asking. */}
      <section id="pricing" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold-ink">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One rate. No retainer.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            You set the budget. We bill against views that actually landed — if nothing delivers,
            you spend nothing.
          </p>
        </div>

        <Card className="surface reveal mx-auto mt-10 max-w-4xl overflow-hidden border-gold/25 p-0">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-12">
            <div className="lg:border-r lg:border-border lg:pr-12">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-5xl font-semibold text-gold-ink">$0.50</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                per 1,000 delivered views
              </p>
              <div className="mt-6 space-y-1.5 text-sm text-muted-foreground">
                <p>
                  <span className="font-mono text-foreground">$500</span> ≈ 1M views
                </p>
                <p>
                  <span className="font-mono text-foreground">$2,500</span> ≈ 5M views
                </p>
              </div>
              <Button asChild size="lg" className="mt-7 w-full">
                <Link href="/quote">
                  Get a quote
                  <ArrowRight />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No obligation · Reply within a day
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Every campaign includes</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" />
                    <span className="leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* For creators */}
      <section id="creators" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <Card className="surface reveal overflow-hidden border-primary/20 p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
                For creators
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn your posting into income
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Clip content you'd happily post anyway, and get paid for every thousand views it
                earns. No follower minimum, no exclusivity — just clip, submit and cash out.
              </p>
              {/* Discord, not /signup: campaigns are briefed and clips
                  submitted there, and the dashboard signup is for clients. */}
              <Button asChild size="lg" className="mt-7">
                <a
                  href={CREATOR_HREF}
                  {...(DISCORD_INVITE
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  Join the network
                  <ArrowRight />
                </a>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Free to join · Paid per 1,000 views · No follower minimum
              </p>
            </div>

            <div className="space-y-3">
              {CREATOR_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 rounded-xl border border-border/70 bg-background/40 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-semibold text-primary-ink">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ — the objections that otherwise arrive as an email nobody sends.
          Native <details> so it works without JavaScript and stays keyboard
          and screen-reader accessible for free. */}
      <section id="faq" className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions worth asking
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="surface lift group reveal rounded-xl border border-border bg-card/60 px-5 py-4 open:border-primary/25"
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

      {/* CTA */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to get clipped?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Tell us what you&apos;re releasing and we&apos;ll come back with what it would cost.
          Creators are usually posting within a day of a campaign being approved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/quote">
              Get a quote
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Client sign in</Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7" />
            <span>© {new Date().getFullYear()} Clip Catchers</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="#results" className="transition-colors hover:text-foreground">
              Results
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
            {DISCORD_INVITE ? (
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Discord
              </a>
            ) : null}
            <Link href="/login" className="transition-colors hover:text-foreground">
              Client login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
