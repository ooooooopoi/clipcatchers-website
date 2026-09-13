import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  // Read on the server: the client can't see whether the provider is set up,
  // and offering a button that can't work is worse than not offering one.
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  // Clippers sign in here too, and land on /me rather than the dashboard.
  const discordEnabled = Boolean(
    process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
  );
  return <LoginForm googleEnabled={googleEnabled} discordEnabled={discordEnabled} />;
}
