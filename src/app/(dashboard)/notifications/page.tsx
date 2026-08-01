import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Everything that's happened in your workspace." />
      <NotificationList
        initial={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
