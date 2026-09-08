import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StarField } from "@/components/marketing/star-field";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

/**
 * The chrome every subject page shares.
 *
 * Eleven pages appeared at once. Without this each of them owns its own
 * header, starfield height, hero spacing and closing call to action, and they
 * start out identical and end up eleven slightly different pages — the shorter
 * starfield on one, the heading a size up on another. None of that is a
 * decision anyone makes on purpose; it is just what happens to copied markup.
 *
 * The session read is here rather than in each page because the header needs
 * it and nothing else does. It's what makes these pages dynamic, which they
 * would be anyway: the header renders a different CTA signed in.
 */
export async function PageShell({
  eyebrow,
  title,
  intro,
  children,
  /** Set on index pages that carry their own, denser opening. */
  compact = false,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  const user = await getSessionUser();

  return (
    // overflow-x-clip, not overflow-hidden: `hidden` makes this a scroll
    // container, which silently stops the sticky header from sticking.
    <div className="relative min-h-screen overflow-x-clip">
      {/* Shorter than the homepage's 760px. These pages open on a heading
          rather than a full hero, so a field sized for the homepage would
          still be drawing at the point the body copy starts. */}
      <StarField className="h-[520px]" />

      <SiteHeader signedIn={Boolean(user)} />

      <main>
        <section
          className={cn(
            "relative z-10 mx-auto w-full max-w-4xl px-5 text-center",
            compact ? "pb-10 pt-12" : "pb-14 pt-14 sm:pt-20",
          )}
        >
          <p className="eyebrow text-primary-ink">{eyebrow}</p>
          <h1 className="display mx-auto mt-4 max-w-3xl text-4xl sm:text-6xl">{title}</h1>
          {intro && (
            <div className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {intro}
            </div>
          )}
        </section>

        {children}

        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * The same ask at the bottom of every subject page.
 *
 * Someone who has read a whole page on their own category is the most
 * convinced reader the site produces, and until these pages existed there was
 * nowhere for that to go — they'd have had to scroll back to the header.
 */
export function ClosingCta() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-24 pt-6">
      <div className="surface reveal overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-12">
        <h2 className="display mx-auto max-w-2xl text-3xl sm:text-4xl">
          Start with one campaign
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Tell us what you&apos;re promoting and roughly what you&apos;d spend, and
          we&apos;ll come back with what it should realistically deliver — drawn from
          campaigns we&apos;ve run, not a projection. If it isn&apos;t a fit, we&apos;ll
          tell you that instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-7">
            <Link href="/launch">
              Start a campaign
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7">
            <Link href="/launch?mode=call">
              <Phone />
              Book a call
            </Link>
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Two required fields · No card at any point · Reply within one working day
        </p>
      </div>
    </section>
  );
}
