import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { PLAN_META } from "@/lib/constants";
import type { Plan } from "@prisma/client";

export function Sidebar({ plan, unreadCount }: { plan: Plan; unreadCount: number }) {
  const meta = PLAN_META[plan];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard">
          <BrandWordmark />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto py-4 scrollbar-thin">
        <SidebarNav unreadCount={unreadCount} />
      </div>

      <div className="p-3">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">{meta.label} plan</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{meta.tagline}</p>
          <Button asChild size="sm" variant="outline" className="mt-3 w-full">
            <Link href="/billing">{plan === "SCALE" ? "Manage plan" : "Upgrade"}</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
