import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";

// A plan card used to sit at the foot of this nav, pushing an upgrade to
// subscription tiers that were never for sale. Replaced with the one thing a
// client on this screen might actually want next.
export function Sidebar({ unreadCount }: { unreadCount: number }) {
  // bg-background, matching the topbar and the page. Tinting only this panel
  // made it read as a separate window sitting next to the app.
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard">
          <BrandWordmark />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto py-4 scrollbar-thin">
        <SidebarNav unreadCount={unreadCount} />
      </div>

      <div className="p-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Need a hand?</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Ask about a campaign, or request the full per-clip report.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3 w-full">
            <Link href="/support">Contact us</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
