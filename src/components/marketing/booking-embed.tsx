"use client";

import { useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";

/**
 * The scheduler, in an iframe.
 *
 * ── Why a plain iframe and not the vendor SDK ───────────────────────────
 * Cal.com and Calendly both ship an embed script, and both scripts do the
 * same job an iframe does while also being a third-party bundle that runs on
 * the page. An iframe is provider-agnostic: whichever of them
 * NEXT_PUBLIC_BOOKING_URL points at, this renders it, and switching provider
 * is an env var rather than a code change.
 *
 * Nothing is prefilled into it. The scheduler collects a name and an email
 * itself, and passing the ones typed into the brief would be sending a
 * visitor's details to a third party before they chose to give them.
 */
export function BookingEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="mt-5">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* A blank 640px box reads as broken, so the frame is covered until it
            paints. Absolute rather than conditional so the iframe below is
            mounted and loading the whole time it's shown. */}
        {!loaded && !failed && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading available times…</p>
          </div>
        )}

        {failed ? (
          // onError fires for a frame that can't load at all. It does not fire
          // for a scheduler that refuses to be framed, so this is a partial
          // safety net — which is exactly why the request form below it is
          // always reachable rather than hidden behind "couldn't load".
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">The calendar didn&apos;t load</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Ask for a time below instead and we&apos;ll confirm by reply.
            </p>
          </div>
        ) : (
          <iframe
            src={url}
            title="Book a call"
            // Tall enough that a month grid and its slot column both fit
            // without the inner page scrolling inside the outer one, which is
            // the single worst feel an embedded scheduler has on a phone.
            className="h-[640px] w-full border-0 sm:h-[700px]"
            // The scheduler needs its own scripts and forms to work at all;
            // allow-same-origin is what lets it keep the booking session.
            // Narrower than the default (no top-navigation, no downloads).
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
