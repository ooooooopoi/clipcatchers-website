import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string; error?: string }>;
}) {
  const params = await searchParams;
  // Read on the server: the client can't see whether the provider is set up,
  // and offering a button that can't work is worse than not offering one.
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  // Clippers sign in here too, and land on /me rather than the dashboard.
  const discordEnabled = Boolean(
    process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
  );
  return (
    <LoginForm
      verified={params.verified === "1"}
      passwordReset={params.reset === "1"}
      initialError={params.error}
      googleEnabled={googleEnabled}
      discordEnabled={discordEnabled}
    />
  );
}
