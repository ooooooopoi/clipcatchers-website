import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireUser } from "@/lib/auth-helpers";
import { getDashboardData } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * Data only. The page it renders is DashboardView, which takes everything as
 * props so the layout can be worked on without a database and a session
 * standing between it and a browser.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return <DashboardView data={data} />;
}
