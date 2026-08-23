import { Clapperboard, LineChart, Rocket } from "lucide-react";

/**
 * The three steps, built to be recalled rather than read once.
 *
 * The old version was three cards of prose. Prose is what people skim, and a
 * prospect who skims this section leaves without being able to say what
 * actually happens — which is the question they're asked internally when they
 * try to get budget approved.
 *
 * So each step carries four things a card of prose doesn't: a number you can
 * count, a clock telling you how long it takes, an explicit split of who does
 * the work, and one concrete artefact you'd actually see. The clock line
 * doubles as the answer to "how fast can I launch", which otherwise sits
 * unanswered until the FAQ.
 */
const STEPS = [
  {
    icon: Rocket,
    title: "Create your campaign",
    clock: "About 5 minutes",
    body:
      "Set your budget, pick TikTok or Instagram, and tell creators what to make. Upload your footage, brand kit and any rules you want enforced.",
    you: "Brief and budget",
    us: "Review and approve",
    artefact: "A campaign brief creators can claim",
  },
  {
    icon: Clapperboard,
    title: "Creators distribute your brand",
    clock: "Posting within 24 hours",
    body:
      "Your campaign goes live to a network of verified clippers. They cut your content, post it from accounts they've proven they own, and submit the link.",
    you: "Nothing — this runs itself",
    us: "Verify, moderate, reject what doesn't fit",
    artefact: "Dozens to hundreds of live posts",
  },
  {
    icon: LineChart,
    title: "Track real results",
    clock: "Refreshed every hour",
    body:
      "Every clip is read straight from the live post and logged on its own. Views, spend and effective CPM land in a dashboard you can watch — or forward.",
    you: "Watch, or send the link to your team",
    us: "Pull the numbers, bill against delivery",
    artefact: "A live report, per clip, with the links",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Three steps, and you&apos;re live
        </h2>
        <p className="mt-4 text-muted-foreground">
          You brief it once. Everything after that — recruiting creators, checking the
          posts, counting the views, closing the budget — is ours.
        </p>
      </div>

      {/* The rail is the thing that makes this read as a sequence rather than
          three unrelated boxes. Horizontal on desktop, vertical on mobile, and
          hidden from assistive tech since the ordered list already says it. */}
      <ol className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
        <span
          aria-hidden
          className="absolute left-[27px] top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-primary/40 via-border to-transparent sm:block md:left-0 md:top-[27px] md:h-px md:w-full md:bg-gradient-to-r md:from-primary/40 md:via-border md:to-transparent"
        />

        {STEPS.map((step, i) => (
          <li key={step.title} className="reveal relative">
            <div className="flex items-center gap-4">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-card font-mono text-lg font-semibold text-primary-ink shadow-[0_1px_2px_hsl(var(--foreground)/0.06)]">
                {i + 1}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.07] px-3 py-1 text-xs font-medium text-primary-ink">
                <step.icon className="h-3.5 w-3.5" />
                {step.clock}
              </span>
            </div>

            <h3 className="mt-6 text-xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

            {/* Who does what. This is the part people repeat back — the whole
                pitch is that the middle column is almost empty for them. */}
            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex gap-3">
                <dt className="w-14 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  You
                </dt>
                <dd className="text-foreground">{step.you}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-14 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Us
                </dt>
                <dd className="text-muted-foreground">{step.us}</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-muted-foreground/80">
              <span className="text-muted-foreground/60">You end up with:</span>{" "}
              {step.artefact}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
