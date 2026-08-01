import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function CampaignNotFound() {
  return (
    <EmptyState
      icon={Megaphone}
      title="Campaign not found"
      description="This campaign doesn't exist, or it belongs to another account."
      action={
        <Button asChild>
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      }
    />
  );
}
