import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // The plan lookup that used to sit beside this fed the sidebar's upgrade
  // card. That card is gone with the rest of the subscription UI, so the query
  // was running on every dashboard page and being thrown away.
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <div className="min-h-screen">
      <Sidebar unreadCount={unreadCount} />
      <div className="lg:pl-60">
        <Topbar user={user} unreadCount={unreadCount} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <KeyboardShortcuts />
    </div>
  );
}
