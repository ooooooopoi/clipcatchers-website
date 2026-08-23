import { Check, Minus } from "lucide-react";
import { PAID_SOCIAL_CPM, RATE_PER_THOUSAND } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Influencer retainer versus this, head to head.
 *
 * Two columns rather than a wall of feature ticks, because the argument isn't
 * that we have more features — it's that the risk sits somewhere different.
 * Every row is written as the same question asked of both, so a reader can
 * check one line and stop.
 *
 * Colour is doing work here and it's kept to the brand's own: orange for our
 * column, plain grey for theirs. Red crosses against green ticks is the usual
 * way to draw this and it introduces two hues the rest of the site doesn't
 * have — and it reads as a sales sheet rather than a comparison.
 */
const ROWS = [
  {
    question: "What you're paying for",
    them: "A fee agreed before anyone posts",
    us: "Views that actually landed",
  },
  {
    question: "If it underperforms",
    them: "You've already paid",
    us: "You've spent proportionally less",
  },
  {
    question: "Money up front",
    them: "Retainer, often monthly",
    us: "None — billed against delivery",
  },
  {
    question: "How many posts",
    them: "One to a handful",
    us: "Dozens to hundreds",
  },
  {
    question: "Where the numbers come from",
    them: "A screenshot in a deck, after the fact",
    us: "Read from the live post, hourly",
  },
  {
    question: "Which post earned the views",
    them: "Aggregated, if you get it at all",
    us: "Per clip, with a link to each one",
  },
  {
    question: "Time to first post",
    them: "Weeks of negotiation",
    us: "Usually within a day",
  },
  {
    question: "Overspend risk",
    them: "Fixed cost regardless of result",
    us: "Campaign closes itself at budget",
  },
] as const;

export function Comparison() {
  const ourCostPerMillion = (1_000_000 / 1000) * RATE_PER_THOUSAND;
  const metaCostPerMillion = (1_000_000 / 1000) * PAID_SOCIAL_CPM.meta;

  return (
    <section
      id="comparison"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
          Why brands switch
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          The same budget, with the risk moved
        </h2>
        <p className="mt-4 text-muted-foreground">
          Influencer marketing asks you to pay first and find out after. This is the
          same reach, bought the other way round.
        </p>
      </div>

      <div className="surface reveal mt-12 overflow-hidden rounded-2xl border border-border bg-card">
        {/* Column headers. Ours carries a hairline of brand colour along the
            top — enough to mark the column without tinting the whole panel. */}
        <div className="grid grid-cols-[1fr_1fr] border-b border-border sm:grid-cols-[minmax(0,1.1fr)_1fr_1fr]">
          <div className="hidden items-end p-5 sm:flex">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              The question
            </span>
          </div>
          <div className="border-r border-border p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Traditional influencer marketing
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">Pay first, hope after</p>
          </div>
          <div className="relative p-5">
            {/* Solid, not a gradient. The two stops used to be the logo's
                orange and amber; in monochrome they became near-black fading
                to grey, which reads as a rendering artefact rather than as a
                deliberate mark on our column. */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
            <p className="text-sm font-semibold">Clip Catchers</p>
            <p className="mt-1 text-xs text-primary-ink">Pay for what landed</p>
          </div>
        </div>

        <dl>
          {ROWS.map((row, i) => (
            <div
              key={row.question}
              className={cn(
                "grid grid-cols-[1fr_1fr] sm:grid-cols-[minmax(0,1.1fr)_1fr_1fr]",
                i % 2 === 1 && "bg-muted/40",
              )}
            >
              {/* On phones the question becomes a full-width caption above the
                  two answers — three columns at 375px turns every cell into a
                  one-word-per-line stack. */}
              <dt className="col-span-2 px-5 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/70 sm:col-span-1 sm:flex sm:items-center sm:py-4 sm:pb-4 sm:pt-4 sm:text-sm sm:normal-case sm:tracking-normal sm:text-foreground">
                {row.question}
              </dt>
              <dd className="flex items-start gap-2.5 border-r border-border px-5 pb-4 pt-2 text-sm text-muted-foreground sm:py-4">
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                <span>{row.them}</span>
              </dd>
              <dd className="flex items-start gap-2.5 px-5 pb-4 pt-2 text-sm sm:py-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" />
                <span>{row.us}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* The cost line, stated once and conservatively. The Meta figure is the
          bottom of the range on purpose — a number a prospect can beat inside
          their own ad account is worse than publishing no number at all. */}
      <div className="surface reveal mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 rounded-2xl border border-border bg-card px-6 py-8 text-center">
        <div>
          <p className="font-mono text-3xl font-semibold tracking-tight text-muted-foreground">
            ${metaCostPerMillion.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            1M views as Meta ads, at a ${PAID_SOCIAL_CPM.meta.toFixed(2)} CPM
          </p>
        </div>
        <span aria-hidden className="hidden h-10 w-px bg-border sm:block" />
        <div>
          <p className="font-mono text-3xl font-semibold tracking-tight text-primary-ink">
            ${ourCostPerMillion.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            1M views here, at ${RATE_PER_THOUSAND.toFixed(2)} per 1,000
          </p>
        </div>
        <p className="w-full text-xs leading-relaxed text-muted-foreground/80">
          And the posts stay up after the spend stops. Paid impressions don&apos;t.
        </p>
      </div>
    </section>
  );
}
