import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [unreadCount, account] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
  ]);

  return (
    <div className="min-h-screen">
      <Sidebar plan={account?.plan ?? "STARTER"} unreadCount={unreadCount} />
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
