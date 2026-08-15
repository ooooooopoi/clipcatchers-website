import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
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
            <BrandMark className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-tight">Clip Catchers</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="#how-it-works">How it works</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
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
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/signup">Start a campaign</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Pay for performance, not promises
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Get your content clipped by{" "}
          {/* Green into gold, the two colours of the mark. */}
          <span className="bg-gradient-to-r from-primary via-primary to-gold bg-clip-text text-transparent">
            hundreds of creators
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Set a budget and a rate per 1,000 views. Our network clips your content across TikTok and
          Instagram, and every view lands in a dashboard you can watch in real time.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">
              Start a campaign
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#creators">Clip for us</Link>
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          No retainer · No minimum term · You only pay for delivered views
        </p>
        <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground/80">
          Every figure below comes from campaigns we have actually run. Each view is
          read from the live post and logged per clip, so any number here can be
          traced back to the video that earned it.
        </p>

        {/* Real figures from campaigns we've run, not round numbers. Anyone
            asking to see the working can be shown the per-clip report. */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: "41M+", label: "views delivered" },
            { value: "1,200+", label: "clips published" },
            // The price is the argument, so it's the one in gold.
            { value: "$0.08", label: "cost per 1,000 views", gold: true },
            { value: "113", label: "creator accounts" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                className={`font-mono text-2xl font-semibold sm:text-3xl ${
                  stat.gold ? "text-gold" : "text-primary"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">For brands</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Live in three steps
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {BRAND_STEPS.map((step, i) => (
            <Card key={step.title} className="relative p-6">
              <span className="absolute right-5 top-5 font-mono text-4xl font-semibold text-primary/10">
                0{i + 1}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/60">
                <step.icon className="h-5 w-5 text-primary" />
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
              className="group p-6 transition-colors hover:border-border/90"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60 transition-colors group-hover:border-primary/30">
                <feature.icon className="h-4 w-4 text-primary" />
              </span>
              <h3 className="mt-4 font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* For creators */}
      <section id="creators" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <Card className="overflow-hidden border-primary/20 p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
                For creators
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn your posting into income
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Clip content you'd happily post anyway, and get paid for every thousand views it
                earns. No follower minimum, no exclusivity — just clip, submit and cash out.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link href="/signup">
                  Join the network
                  <ArrowRight />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {CREATOR_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 rounded-xl border border-border/70 bg-background/40 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-semibold text-primary">
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

      {/* CTA */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to get clipped?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Set up your first campaign in a few minutes. We&apos;ll have creators posting within a day
          of approval.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">
              Start a campaign
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
          <div className="flex items-center gap-5">
            <Link href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="#creators" className="transition-colors hover:text-foreground">
              For creators
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Client login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
