"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MAIN_NAV, SECONDARY_NAV, isActive, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  unread,
  onNavigate,
}: {
  item: NavItem;
  unread?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg border border-border bg-accent/60"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon className={cn("relative z-10 h-4 w-4 shrink-0", active && "text-primary")} />
      <span className="relative z-10 font-medium">{item.title}</span>
      {unread ? (
        <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

export function SidebarNav({
  unreadCount = 0,
  onNavigate,
}: {
  unreadCount?: number;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-6 px-3">
      <div className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Workspace
        </p>
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Account
        </p>
        {SECONDARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            unread={item.href === "/notifications" ? unreadCount : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}
