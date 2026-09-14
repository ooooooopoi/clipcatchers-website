"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * The app subdomain's sign-in.
 *
 * Not DiscordButton, for one reason: the callbackUrl. That component sends
 * everyone to a relative /me, which after the OAuth dance resolves against the
 * apex — so someone who signed in at app.clipcatchers.net would land back on
 * clipcatchers.net and conclude the app "kicked them out". This one builds an
 * absolute URL from wherever the page is actually running, so you come back to
 * the door you went in through.
 */
export function AppSignIn({ label = "Sign in with Discord" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      size="lg"
      className="h-12 w-full max-w-xs px-7"
      loading={loading}
      onClick={() => {
        setLoading(true);
        signIn("discord", { callbackUrl: `${window.location.origin}/me` });
      }}
    >
      {label}
    </Button>
  );
}
