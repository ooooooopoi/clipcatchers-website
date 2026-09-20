import { redirect } from "next/navigation";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // ── Clippers don't belong in here ──────────────────────────────────────
  // Every query behind this layout is scoped to campaigns the account owns,
  // and a clipper owns none. /me and /app already send them to their own
  // dashboard, but neither is a boundary: a bookmark, a stale link or the
  // sidebar inside this shell all land here directly, and what they get is a
  // brand's dashboard reporting zeros — or, since the redesign, a page
  // inviting them to brief a creator network, which is somebody else's job.
  //
  // The campaign count is what keeps this from being a trap in the other
  // direction. A brand that happens to have signed in with Discord owns
  // campaigns, and bouncing them to the clipper dashboard would lock them out
  // of their own. Only an account with a Discord id *and* nothing of its own
  // here is unambiguously in the wrong place.
  const [unreadCount, ownedCampaigns] = await Promise.all([
    // The plan lookup that used to sit beside this fed the sidebar's upgrade
    // card. That card is gone with the rest of the subscription UI, so the
    // query was running on every dashboard page and being thrown away.
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    user.discordId
      ? prisma.campaign.count({ where: { userId: user.id } })
      : Promise.resolve(1),
  ]);

  if (user.discordId && ownedCampaigns === 0) redirect("/me");

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
