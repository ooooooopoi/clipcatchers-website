import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Ban,
  Clapperboard,
  FileText,
  Gauge,
  LineChart,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ImpressionCounter } from "@/components/marketing/impressions";
import { PageShell } from "@/components/marketing/page-shell";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
import { getPublicStats } from "@/lib/public-stats";

const TITLE = "How it works";
const SOCIAL_TITLE = "How it works — Clip Catchers";
const DESCRIPTION =
  "The whole mechanic, stage by stage: how a brief becomes hundreds of clips, how a view becomes a billed view, and exactly what you pay for.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/how-it-works",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

/**
 * The full mechanic.
 *
 * The homepage carries a three-step summary, which is the right length for
 * someone deciding whether to keep reading and far too short for the question
 * that decides the deal: "so what actually happens, and where can this go
 * wrong for me?" That question gets asked internally, by someone who wasn't on
 * the call, when the budget needs approving — and until this page existed the
 * only answer was a sales reply.
 *
 * Numbered stages, because this genuinely is a sequence and the order carries
 * information the reader needs. Each stage says who does the work, because the
 * whole proposition is that their column is nearly empty.
 */
const STAGES = [
  {
    icon: FileText,
    title: "You write the brief",
    clock: "About 5 minutes",
    body: "You set a total budget, pick TikTok or Instagram, and say what creators should make. Upload whatever footage you already have — the track, the trailer, the screen recording, the product shots. The brief is where you set the rules: required footage, the hook, a sound or hashtag to use, anything you don't want said, and a minimum view count before a clip is worth anything.",
    you: "Budget, footage, rules",
    us: "Nothing yet",
    out: "A campaign brief creators can claim",
  },
  {
    icon: BadgeCheck,
    title: "We review it before it goes near a creator",
    clock: "Within one working day",
    body: "We read the brief and tell you whether it will work. If the assets are thin, or the rules contradict each other, or the category needs wording we can't enforce, you hear that now rather than after the budget is spent. This is also where we say if it isn't a fit at all — a campaign we don't think will deliver is worse for us than one we never ran.",
    you: "Answer any questions",
    us: "Review, push back, approve",
    out: "A live campaign, or an honest no",
  },
  {
    icon: Users,
    title: "The network claims it",
    clock: "Posting usually within 24 hours",
    body: "Your campaign goes out to a network of creators who have each proved they own the accounts they post from — a code in the bio, checked against the live profile, before a single clip of theirs can earn. They cut your footage themselves, post it to their own audience, and submit the link back to us.",
    you: "Nothing — this runs itself",
    us: "Brief the network, answer creators, moderate",
    out: "Dozens to hundreds of live posts",
  },
  {
    icon: ShieldCheck,
    title: "Every clip is checked",
    clock: "Before it counts, then continuously",
    body: "A submitted clip lands as pending and earns nothing. We confirm the post is live, that it came from an account that creator actually owns, and that it follows your brief. Clips that break the brief are rejected and earn nothing. Clips showing the engagement pattern bought views leave behind — a view count climbing without the comments, shares and saves that normally come with it — are rejected too.",
    you: "Nothing, unless you want to review",
    us: "Verify ownership, enforce the brief, reject",
    out: "A list of approved clips, each traceable to a post",
  },
  {
    icon: LineChart,
    title: "Views are read off the live posts",
    clock: "Refreshed every hour",
    body: "Nothing is self-reported by a creator. Each approved clip is read directly from the live post on TikTok or Instagram and logged on its own with a timestamp. Every figure on your dashboard can be traced back to the individual video that earned it, and you can click through to that video.",
    you: "Watch, or send the link to your team",
    us: "Read, log, timestamp",
    out: "A live per-clip report, with the links",
  },
  {
    icon: Receipt,
    title: "You pay for what landed",
    clock: "Against delivery",
    body: `Billing is ${`$${RATE_PER_THOUSAND.toFixed(2)}`} per 1,000 delivered views, drawn down from the budget you funded. Not per clip, not per creator, not a retainer. Unspent budget is never charged. The campaign closes itself the moment the total is met, so overspending isn't something you have to watch for — it isn't possible.`,
    you: "Nothing to reconcile",
    us: "Bill against delivery, close the campaign",
    out: "A spend figure that matches a list of videos",
  },
] as const;

/** The four objections that otherwise decide it before anyone asks. */
const GUARANTEES = [
  {
    icon: Ban,
    title: "No retainer",
    body: "Nothing up front and no minimum term. You fund a budget and it draws down against delivery.",
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
    icon: Clapperboard,
    title: "You see every clip",
    body: "Not a summary — the actual list, with a link to each post and what it earned.",
  },
] as const;

/**
 * The trade nobody volunteers.
 *
 * A page explaining how something works that only lists the good parts is a
 * brochure, and a reader who has bought anything before knows it. Naming the
 * constraint here costs one section and buys the credibility that makes the
 * six stages above worth reading — and every one of these is a real limit of
 * the model, not a humblebrag.
 */
const TRADES = [
  {
    q: "You don't approve each post individually",
    a: "You set the rules and we enforce them, but you don't sign off every video before it goes up. That's the trade that makes hundreds of clips possible in a week — per-post approval turns a network into an agency, and an agency into a retainer.",
  },
  {
    q: "Creators aren't reading your script",
    a: "They cut your footage for an audience they know better than you do, which is why it works. Clips that break the brief are rejected. Clips that are simply not how you'd have done it are not.",
  },
  {
    q: "We can measure views, not your funnel",
    a: "We read what the platform reports on each post. Installs, signups and sales live in your analytics, not ours — so if one of those is the number you're judging this on, say so at the brief stage and we'll set it up to be measurable rather than argue about it afterwards.",
  },
  {
    q: "Weak assets stay weak at volume",
    a: "Distribution moves reach, not appeal. If the hook doesn't hold a scroll, more clips is a more expensive way to find that out — we'd rather say so before the budget goes in than take it and report the result.",
  },
] as const;

export default async function HowItWorksPage() {
  const stats = await getPublicStats();

  return (
    <PageShell
      eyebrow="How it works"
      title="A brief in, hundreds of posts out"
      intro={
        <>
          You brief it once. Recruiting creators, checking the posts, counting the views
          and closing the budget are ours. Here is every stage of that, including the
          parts that constrain you.
        </>
      }
    >
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <ImpressionCounter stats={stats} size="md" />
      </section>

      {/* The stages. */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-20">
        <ol className="space-y-4">
          {STAGES.map((stage, i) => (
            <li
              key={stage.title}
              className="surface reveal rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-background font-mono text-lg font-semibold text-primary-ink">
                  {i + 1}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.07] px-3 py-1 text-xs font-medium text-primary-ink">
                  <stage.icon className="h-3.5 w-3.5" />
                  {stage.clock}
                </span>
              </div>

              <h2 className="display mt-5 text-xl sm:text-2xl">{stage.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{stage.body}</p>

              {/* Who does what. This is the part people repeat back — the whole
                  pitch is that the middle column is almost empty for them. */}
              <dl className="mt-6 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-muted-foreground/70">You</dt>
                  <dd className="mt-1.5 text-foreground">{stage.you}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground/70">Us</dt>
                  <dd className="mt-1.5 text-muted-foreground">{stage.us}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground/70">You end up with</dt>
                  <dd className="mt-1.5 text-muted-foreground">{stage.out}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      {/* The four risk answers. */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display text-3xl sm:text-4xl">What it commits you to</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((item) => (
            <div
              key={item.title}
              className="surface lift reveal rounded-2xl border border-border bg-card p-5 hover:border-[hsl(var(--border-strong))]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                <item.icon className="h-4 w-4 text-primary-ink" />
              </span>
              <h3 className="display-sm mt-4 text-sm">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The constraints. */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20">
        <div className="text-center">
          <p className="eyebrow text-primary-ink">The trade</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">What you give up</h2>
          <p className="mt-4 text-muted-foreground">
            Four real constraints of this model. If any of them is a dealbreaker,
            it&apos;s cheaper for both of us that you know now.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {TRADES.map((t) => (
            <div
              key={t.q}
              className="surface reveal rounded-xl border border-border bg-card px-5 py-4"
            >
              <h3 className="display-sm text-sm">{t.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.a}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          More detail on{" "}
          <Link href="/verification" className="text-primary-ink underline-offset-4 hover:underline">
            how a view becomes a billed view
          </Link>{" "}
          and{" "}
          <Link href="/pricing" className="text-primary-ink underline-offset-4 hover:underline">
            what it costs
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
