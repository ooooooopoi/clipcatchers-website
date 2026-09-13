"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { GoogleButton } from "@/components/google-button";
import { DiscordButton } from "@/components/discord-button";

/**
 * Sign-in, OAuth only.
 *
 * The email-and-password form is gone, along with signup, forgot-password and
 * reset-password. Nobody is issued a password any more, so a field asking for
 * one could only ever fail.
 *
 * ── If neither provider is configured ────────────────────────────────────
 * Both buttons are gated on the server having credentials for them, and with
 * the password form removed there is no longer anything underneath to fall
 * back to. So the empty case is handled explicitly rather than rendering a
 * page with no way off it — that state means a misconfigured deployment, and
 * saying so beats a blank card.
 */
export function LoginForm({
  googleEnabled = false,
  discordEnabled = false,
}: {
  googleEnabled?: boolean;
  discordEnabled?: boolean;
}) {
  const none = !googleEnabled && !discordEnabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {none
          ? "Sign-in isn't available on this deployment."
          : "Continue with the account you already use."}
      </p>

      {none ? (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No sign-in provider is configured. If you&apos;re an admin, set the Discord or
            Google credentials in the environment.
          </span>
        </div>
      ) : (
        <div className="mt-8">
          {googleEnabled && <GoogleButton />}
          {discordEnabled && <DiscordButton />}
        </div>
      )}

      {/* No "create an account" link. Client accounts are set up by us when a
          campaign is assigned to them — a stranger self-registering here lands
          in an empty dashboard with nothing to look at, which is a worse first
          impression than the enquiry form they should have used. */}
      <p className="mt-6 text-sm text-muted-foreground">
        Want to run a campaign?{" "}
        <Link href="/launch" className="font-medium text-foreground underline-offset-4 hover:underline">
          Tell us what you&apos;re promoting
        </Link>
      </p>
    </motion.div>
  );
}
