import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CreateCampaignWizard } from "@/components/campaigns/create-wizard";
import { requireUser } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Create campaign" };

export default async function NewCampaignPage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Create a campaign"
        description="Seven quick steps — brief us, drop your assets, set a budget."
      />
      <CreateCampaignWizard />
    </div>
  );
}
