
/**
 * The terms of the offer, running edge to edge under the hero.
 *
 * ── Why a marquee, on a page that had none ──────────────────────────────
 * Everything above and below this is a centred column on white, and a centred
 * column on white is a layout with no edges — nothing ever reaches the side of
 * the screen, so the page has no sense of width. One full-bleed band fixes
 * that on its own, and it's the only element here allowed to touch the edges.
 *
 * The content is the argument, not decoration. These lines are the commercial
 * offer, the things a brand has to believe before anything further down the
 * page is worth reading. Running them means a reader who scrolls past the hero
 * without stopping still passes every one.
 *
 * "No retainer" and "Every clip listed" used to run here too. The four
 * statements directly under the band say both, and the same words twice
 * within one screen reads as filler.
 *
 * The price is read from lib/pricing rather than typed, because it appears in
 * four places on this page and the hand-typed copies had already drifted once.
 *
 * ── The bit that is easy to get wrong ───────────────────────────────────
 * The list is rendered twice and the track slides exactly -50%. Those two
 * facts are one mechanism: at the end of the animation the second copy sits
 * precisely where the first began, so the reset is invisible. Change either
 * one without the other and the band visibly snaps every cycle.
 */
const TERMS = [
  "Pay per view",
  "No minimum term",
  "You only pay for views that landed",
  "TikTok + Instagram",
  "Verified creators only",
];

/**
 * One half of the loop, with the terms going round twice inside it.
 *
 * A half has to be wider than the screen: the track slides exactly one half,
 * so a half narrower than the viewport opens a blank strip at the right edge
 * at the end of every cycle. Once, the terms make 1576px at desktop size, which
 * a 1920 screen outruns; twice makes 3152, which clears a 2560 monitor. The
 * second pass is scenery for the same reason the second Run is.
 */
function Run({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center"
      {...(ariaHidden ? { "aria-hidden": true } : {})}
    >
      {[0, 1].map((pass) => (
        <div
          key={pass}
          className="flex shrink-0 items-center"
          {...(pass ? { "aria-hidden": true } : {})}
        >
          {TERMS.map((term) => (
            <span key={term} className="flex shrink-0 items-center">
              <span className="display-sm px-6 text-sm sm:px-8 sm:text-base">{term}</span>
              {/* A rotated square rather than a bullet or a slash. A bullet
                  disappears at this weight and a slash reads as a fraction; a
                  diamond is the one separator that holds its own against
                  uppercase 800 without becoming a word. */}
              <span
                aria-hidden
                className="size-1.5 shrink-0 rotate-45 bg-foreground/25"
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <section
      className="ticker relative z-10 overflow-hidden border-y border-border bg-card py-4"
      aria-label="What a campaign costs and what it commits you to"
    >
      {/* Faded at both ends so the terms arrive and leave rather than being
          cut off mid-word by the edge of the screen. Sits above the track and
          ignores the pointer, or it would eat the hover that pauses it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_right,hsl(var(--card))_0%,transparent_8%,transparent_92%,hsl(var(--card))_100%)]"
      />

      {/* w-max, so the track is as wide as its contents rather than as wide as
          the screen — without it there is nothing to translate.

          The duration moves with the width of a half. 73s over a 3152px half
          is 43px a second, the speed the band has always run at. */}
      <div
        className="ticker-track flex w-max items-center"
        style={{ "--ticker-duration": "73s" } as React.CSSProperties}
      >
        <Run />
        {/* The second copy is scenery, not content: it exists so the loop can
            close. Announcing it would read the whole offer twice. */}
        <Run ariaHidden />
      </div>
    </section>
  );
}
