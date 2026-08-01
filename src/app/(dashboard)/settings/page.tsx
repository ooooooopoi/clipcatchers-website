import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SettingsForms } from "@/components/settings/settings-forms";
import { getCurrentUser } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, credentials and notifications." />
      <SettingsForms
        name={user.name}
        email={user.email}
        company={user.company}
        image={user.image}
        prefs={{
          emailCampaignUpdates: user.settings?.emailCampaignUpdates ?? true,
          emailInvoices: user.settings?.emailInvoices ?? true,
          emailProductUpdates: user.settings?.emailProductUpdates ?? false,
          emailMarketing: user.settings?.emailMarketing ?? false,
        }}
      />
    </div>
  );
}
