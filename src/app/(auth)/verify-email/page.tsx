import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/tokens";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let verified = false;

  if (token) {
    const record = await consumeToken(token, "EMAIL_VERIFICATION");
    if (record) {
      await prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      });
      // Give them something to land on the first time they sign in.
      await prisma.notification.create({
        data: {
          userId: record.userId,
          type: "SYSTEM",
          title: "Welcome to Clip Catchers",
          body: "Your account is verified. Create your first campaign to get moving.",
          link: "/campaigns/new",
        },
      });
      verified = true;
    }
  }

  return (
    <div>
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
          verified ? "border-primary/25 bg-primary/10" : "border-destructive/25 bg-destructive/10"
        }`}
      >
        {verified ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        {verified ? "Email verified" : "This link didn't work"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {verified
          ? "Your account is active. Sign in to reach your dashboard."
          : "The link may have expired or already been used. Sign in to request a fresh one."}
      </p>

      <Button asChild className="mt-8 w-full">
        <Link href={verified ? "/login?verified=1" : "/login"}>Continue to sign in</Link>
      </Button>
    </div>
  );
}
