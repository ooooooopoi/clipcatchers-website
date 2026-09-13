"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Continue with Discord — for clippers, not clients.
 *
 * Rendered only when the server says the provider is configured, on the same
 * reasoning as the Google button: one that bounces off a misconfigured
 * provider is worse than none, because the user has already committed by the
 * time it fails.
 *
 * ── Why this lands on /me and not /dashboard ─────────────────────────────
 * The dashboard is a client's view: campaigns, invoices, spend. A clipper
 * arriving there sees an empty page about somebody else's money. /me works out
 * who they are from the Discord id and forwards them to their own clips and
 * earnings. Sending clippers to the dashboard is a mistake this codebase has
 * made once already — see the note in app/page.tsx.
 */
export function DiscordButton({
  label = "Continue with Discord",
}: {
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="mt-3 w-full"
      loading={loading}
      onClick={() => {
        setLoading(true);
        signIn("discord", { callbackUrl: "/me" });
      }}
    >
      {!loading && (
        // Simple mark rather than the brand glyph: it reads at 16px, needs no
        // permission, and does not go stale when the brand is refreshed.
        <svg
          className="mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 0 0-9 9v5.5A2.5 2.5 0 0 0 5.5 20H8l1-2H5.5a.5.5 0 0 1-.5-.5V12a7 7 0 1 1 14 0v5.5a.5.5 0 0 1-.5.5H15l1 2h2.5a2.5 2.5 0 0 0 2.5-2.5V12a9 9 0 0 0-9-9Z" />
          <circle cx="9" cy="13" r="1.5" />
          <circle cx="15" cy="13" r="1.5" />
        </svg>
      )}
      {label}
    </Button>
  );
}
