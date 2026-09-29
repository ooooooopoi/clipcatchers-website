import { QuoteForm } from "@/components/quote-form";
import type { QuotePrefill } from "@/lib/quote-options";

/**
 * The way into a campaign: the written brief.
 *
 * There used to be two doors here, "Send a brief" and "Book a call", as tabs,
 * with `?mode=call` opening on the second (or leaving for the scheduler when
 * one was configured). Booking was removed from the site on 2026-09-30 at the
 * owner's request: every "Book a call" button went, and anything that still
 * links to `?mode=call` (an old DM, a bookmark) now lands here, on the brief,
 * which is where "Get started" goes. QuoteForm still knows a call mode; nothing
 * on the site asks for it.
 */
export function LaunchPanel({
  prefill,
}: {
  /** Form defaults seeded from the URL, passed straight through. */
  prefill?: QuotePrefill;
}) {
  return <QuoteForm mode="brief" prefill={prefill} />;
}
