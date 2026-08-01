import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CampaignEditForm } from "@/components/campaigns/edit-form";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit campaign" };
export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) notFound();

  return (
    <div>
      <Link
        href={`/campaigns/${campaign.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to campaign
      </Link>
      <PageHeader title={`Edit ${campaign.name}`} description="Update the brief, budget or schedule." />
      <CampaignEditForm campaign={campaign} />
    </div>
  );
}
