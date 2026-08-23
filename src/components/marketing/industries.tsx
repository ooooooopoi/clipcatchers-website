import {
  Coins,
  Dices,
  Gamepad2,
  Mic,
  Music,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";

/**
 * What a campaign actually looks like, per industry.
 *
 * The site read as a music product — the quote form asked for an artist and a
 * release date, and everything else was written around a single drop. Seven of
 * the eight verticals we sell to landed on a page that told them, politely,
 * that this wasn't for them.
 *
 * Each card names the asset the brand already has and the clip that gets made
 * from it, because the unspoken objection in every vertical except music is
 * "what would creators even post about us?"
 */
const INDUSTRIES = [
  {
    icon: Music,
    name: "Music & labels",
    brief: "Clip the hook over gameplay, vlog or edit footage",
    goal: "Drive saves and streams in the first 72 hours of a release",
  },
  {
    icon: Gamepad2,
    name: "Gaming",
    brief: "Cut highlights, patch reactions and first-look footage",
    goal: "Wishlists before launch, installs after",
  },
  {
    icon: Smartphone,
    name: "Apps",
    brief: "Screen-recorded demos and before/after use cases",
    goal: "Installs at a CPM paid social can't reach",
  },
  {
    icon: Coins,
    name: "Crypto",
    brief: "Explainers, chart breakdowns and announcement reactions",
    goal: "Awareness ahead of a listing or a mint",
  },
  {
    icon: Dices,
    name: "iGaming & casino",
    brief: "Session clips and big-win reactions, within your rules",
    goal: "Signups from an audience paid channels restrict",
  },
  {
    icon: Mic,
    name: "Podcasts",
    brief: "The best 40 seconds of every episode, cut many ways",
    goal: "Turn one long-form episode into a week of short-form",
  },
  {
    icon: ShoppingBag,
    name: "Consumer brands",
    brief: "Unboxings, demos and honest first-impression clips",
    goal: "Reach and social proof at the top of the funnel",
  },
  {
    icon: Sparkles,
    name: "Startups & SaaS",
    brief: "Product walkthroughs and founder-story cuts",
    goal: "Category awareness without a content team",
  },
] as const;

export function Industries() {
  return (
    <section
      id="industries"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
          Campaign examples
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          What a campaign looks like in your category
        </h2>
        <p className="mt-4 text-muted-foreground">
          The mechanism is the same everywhere — a budget, a brief and a network. What
          changes is the footage you hand over and what you want it to do.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((industry) => (
          <div
            key={industry.name}
            className="surface lift reveal group rounded-2xl border border-border bg-card p-5 hover:border-primary/25"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition-colors group-hover:border-primary/30">
              <industry.icon className="h-4 w-4 text-primary-ink" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">{industry.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {industry.brief}
            </p>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground/80">
              <span className="text-muted-foreground/60">Usually for:</span> {industry.goal}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Not on the list?{" "}
        <a href="/launch" className="text-primary-ink underline-offset-4 hover:underline">
          Tell us what you&apos;re promoting
        </a>{" "}
        — the model doesn&apos;t care what the category is.
      </p>
    </section>
  );
}
