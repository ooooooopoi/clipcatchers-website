import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { NewCampaignForm } from "@/components/team/new-campaign-form";
import { teamSignatureValid } from "@/lib/share";

export const metadata: Metadata = {
  title: "New campaign",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Open a campaign without a Discord client.
 *
 * /campaign-create was the only way in, which meant campaigns could only be
 * opened by someone sitting in Discord on a machine that could run a slash
 * command. The bot has had an HTTP route for it for a while; this is the
 * surface that route always needed.
 *
 * Gated on the team signature like every other page under /team — the same
 * credential that already opens the payouts and campaign views, so this adds
 * a capability rather than a second way to authenticate.
 */
export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ sig: string }>;
}) {
  const { sig } = await params;
  // 404, not 401: a wrong signature shouldn't confirm the page is there.
  if (!teamSignatureValid(sig)) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <BrandWordmark />
          <Link
            href={`/team/${sig}/campaigns`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Campaigns
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">New campaign</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Opens on the clipper board straight away. Announcing it to the server is a
          separate step.
        </p>

        <div className="mt-8">
          <NewCampaignForm sig={sig} />
        </div>
      </main>
    </div>
  );
}
