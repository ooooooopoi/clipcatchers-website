/**
 * The three ceilings a client sets, and what each one stops.
 *
 * "You can't overspend" is claimed twice on this page already — once in the
 * guarantees under the hero, once in the pricing block. Both are the claim;
 * neither is the mechanism. This is the mechanism, and it follows the same
 * shape the page uses for verification: assert it early, then earn it further
 * down for the reader who wants to know how.
 *
 * It matters more than it sounds. The objection this answers isn't "will it
 * work", it's "what's the worst case if it goes wrong" — the question a
 * finance approver asks and a marketer has to have an answer to. Three
 * numbers, each capping a different failure, is an answer they can repeat.
 *
 * No mock dashboard here on purpose. There used to be a panel of invented
 * campaign figures on this page and it was removed: a made-up screenshot
 * under a promise that every figure is real does the opposite of its job.
 */
const CONTROLS = [
  {
    label: "Total budget",
    setting: "The most this campaign can ever cost you.",
    body:
      "Spend is recomputed from the live posts as they earn, and the campaign closes itself the moment it reaches the number — checked more often the closer it gets, so it lands on the line rather than past it.",
    stops: "an open-ended spend",
  },
  {
    label: "Per-post cap",
    setting: "The most any single clip can bill for.",
    body:
      "One clip going unexpectedly viral is a good day, not an invoice. Past the cap it keeps earning you views and stops earning against your budget.",
    stops: "one post swallowing the campaign",
  },
  {
    label: "Minimum views",
    setting: "The floor a clip clears before it earns anything.",
    body:
      "Posts that went nowhere cost you nothing. Creators know the threshold before they claim the brief, so it shapes what gets made rather than arriving as a surprise deduction.",
    stops: "paying for posts nobody saw",
  },
] as const;

export function Control() {
  return (
    <section
      id="control"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:py-24"
    >
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
            Budget control
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            You set the ceiling, not us
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Three numbers, set before anything goes live. Each one caps a different way
            a campaign could cost more than you meant it to — and none of them need
            watching once they&apos;re set.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Budget you never spend is never charged. There&apos;s no overage line, no
            true-up at the end, and no invoice arriving with a number you didn&apos;t
            already watch accumulate.
          </p>
        </div>

        <ol className="space-y-4">
          {CONTROLS.map((control, i) => (
            <li
              key={control.label}
              className="surface reveal rounded-2xl border border-border bg-card p-6 sm:p-7"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">{control.label}</h3>
              </div>
              <p className="mt-2 text-sm font-medium">{control.setting}</p>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {control.body}
              </p>
              {/* The failure each control exists to prevent, named. A cap is
                  abstract until you say what happens without it. */}
              <p className="mt-4 border-t border-border pt-3.5 text-xs text-muted-foreground">
                <span className="text-muted-foreground/60">Stops:</span> {control.stops}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
