import { BadgeCheck, FileSearch, Link2, RefreshCw } from "lucide-react";

/**
 * How a view becomes a billed view.
 *
 * "Verified views" is a claim every platform in this category makes, which
 * means it persuades nobody on its own. What persuades is the mechanism: four
 * checks, in order, each one describable in a sentence. A buyer who can repeat
 * this chain back to their finance team is a buyer who can get it approved.
 *
 * The honesty panel at the bottom is deliberate. Naming the two things we
 * don't measure is what makes the four things we do measure believable — and
 * it's cheaper to say here than to be caught out on later.
 */
const CHAIN = [
  {
    icon: BadgeCheck,
    step: "Ownership",
    title: "The creator proves the account is theirs",
    body:
      "A one-time code goes in the account bio and we check it from our side. Until that passes, nothing that account posts can earn.",
  },
  {
    icon: Link2,
    step: "Attribution",
    title: "Each clip is tied to one live post",
    body:
      "A submitted clip is matched to a specific video ID. Two submissions can't point at the same post, and a deleted post stops earning.",
  },
  {
    icon: RefreshCw,
    step: "Measurement",
    title: "Views are read from the post, hourly",
    body:
      "We pull the count off the live video and write it to its own row with a timestamp. Creators never type a number in. Nothing is self-reported.",
  },
  {
    icon: FileSearch,
    step: "Integrity",
    title: "Bought views are found and rejected",
    body:
      "Clips are checked for the pattern purchased views leave — a count that climbs without the comments, shares and saves that normally come with it. Failed clips earn nothing.",
  },
] as const;

export function Verification() {
  return (
    <section
      id="verification"
      className="relative z-10 scroll-mt-24 border-y border-border bg-muted/30 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-ink">
            Trust &amp; verification
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            How a view becomes a billed view
          </h2>
          <p className="mt-4 text-muted-foreground">
            Four checks, in order. Any figure on your dashboard can be traced back through
            all of them to the individual video that earned it.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHAIN.map((link, i) => (
            <div
              key={link.step}
              className="surface reveal relative rounded-2xl border border-border bg-card p-6"
            >
              {/* The arrow between cards. Hidden on the last one, and hidden
                  entirely below lg where the cards stack in pairs and a
                  rightward arrow would point at nothing. */}
              {i < CHAIN.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-border bg-card lg:block"
                />
              )}
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <link.icon className="h-4 w-4 text-primary-ink" />
                </span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {i + 1} · {link.step}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-snug">{link.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{link.body}</p>
            </div>
          ))}
        </div>

        <div className="surface reveal mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="text-sm font-semibold">And what we don&apos;t claim</h3>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
            <li>
              <span className="text-foreground">Reach is modelled, not measured.</span> TikTok
              and Instagram don&apos;t expose unique viewers per post, so anywhere you see
              reach it&apos;s an estimate and labelled as one. Views are the number we bill on.
            </li>
            <li>
              <span className="text-foreground">We can&apos;t attribute your sales.</span> We
              can tell you exactly which post earned which views. Tying that to a signup or a
              stream is your analytics, not ours — bring a UTM or a landing page and
              we&apos;ll point creators at it.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
