/**
 * The timeline from sending the form to the campaign closing itself.
 *
 * "How it works" explains the mechanic — three steps, who does what. It does
 * not answer the question someone actually has with their cursor over the
 * button, which is "what am I signing up for in the next week". That gap is
 * where enquiries are lost: the page has already argued the case, and the last
 * unknown is procedural, not commercial.
 *
 * So this is elapsed time, not features. Every marker is a claim made
 * elsewhere on the site or in the product — one working day to reply, five
 * minutes to brief, posting inside 24 hours, hourly reads, auto-close at
 * budget — put on a clock so the whole thing can be held in one picture.
 *
 * If any of those change, change them here too: this is the page that reads
 * most like a promise.
 */
const STEPS = [
  {
    when: "Right away",
    title: "You send the form",
    body:
      "A name, an email, and whatever you can tell us about what you're promoting. No card, no call to book, nothing charged. Nothing goes live until you've seen a number and said yes to it.",
  },
  {
    when: "Within 1 working day",
    title: "We come back with a number",
    body:
      "What your budget should realistically deliver, drawn from campaigns we've actually run rather than a projection. If we don't think it will work for what you're promoting, we'll say so instead of selling you a campaign.",
  },
  {
    when: "About 5 minutes",
    title: "You brief it, we approve it",
    body:
      "Your footage, the hook, hashtags or sound, anything you don't want said — plus a total budget and a per-post cap. We check the brief over and push it live to the network.",
  },
  {
    // Same claim as the "Posting within 24 hours" marker in How it works, and
    // worded the same length so the column stays one line per row.
    when: "Within 24 hours",
    title: "Creators start posting",
    body:
      "Verified clippers claim the brief, cut your content and post from accounts they've proven they own. Clips that break the brief are rejected and earn nothing. What you don't do is approve each post — that's the trade that makes the volume possible.",
  },
  {
    when: "Every hour after that",
    title: "You watch it land",
    body:
      "Views are read straight off each live post and logged with a timestamp. Your dashboard updates clip by clip, and a share link opens the same live report for anyone who needs it without an account.",
  },
  {
    when: "When the budget's met",
    title: "It closes itself",
    body:
      "The campaign stops the moment the budget is spent, so there's no overage to argue about — and budget that never delivered is never charged.",
  },
] as const;

/** The three things people assume happen next, and don't. */
const NO_STRINGS = [
  {
    title: "No auto-renewal",
    body: "A campaign ends when its budget does. Running another one is a decision you make, not a default you have to cancel.",
  },
  {
    title: "No lock-in",
    body: "No exclusivity in either direction, no minimum term, and nothing stopping you running the same assets anywhere else.",
  },
  {
    title: "Nothing comes down",
    body: "Clips stay up after the campaign closes. The views they keep earning from there are ones you're no longer paying for.",
  },
] as const;

export function AfterLaunch() {
  return (
    <section
      id="after-launch"
      className="relative z-10 scroll-mt-24 border-y border-border bg-muted/30 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
            After you launch
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            What happens after I launch?
          </h2>
          <p className="mt-4 text-muted-foreground">
            From sending the form to the campaign closing itself. Two of these six steps
            need anything from you.
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-3xl">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              // 12rem, not less: at 10rem four of the six markers wrapped to a
              // second line, which turns a column meant to be scanned into six
              // ragged blocks.
              className="reveal relative grid grid-cols-[2.25rem_1fr] sm:grid-cols-[12rem_2.25rem_1fr]"
            >
              {/* Desktop only. Below sm the same string renders inline above
                  the title, where there's no column to put it in. */}
              <p className="hidden pr-6 pt-0.5 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground sm:block">
                {step.when}
              </p>

              {/* The rail. Drawn per row rather than as one absolute element
                  across the list, so it can't drift out of step with the dots
                  when a body wraps to a different number of lines — and so the
                  last segment stops at the last dot instead of trailing off
                  under the final paragraph. */}
              <div aria-hidden className="relative flex justify-center">
                <span
                  className={`absolute top-3 w-px bg-border ${
                    i === STEPS.length - 1 ? "h-0" : "h-full"
                  }`}
                />
                <span className="relative mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-muted/30" />
              </div>

              <div className="pb-10">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground sm:hidden">
                  {step.when}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight sm:mt-0">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-4 grid max-w-3xl gap-4 sm:grid-cols-3">
          {NO_STRINGS.map((item) => (
            <div
              key={item.title}
              className="surface reveal rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
