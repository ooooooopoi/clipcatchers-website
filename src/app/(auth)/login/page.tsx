import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      verified={params.verified === "1"}
      passwordReset={params.reset === "1"}
      initialError={params.error}
    />
  );
}
