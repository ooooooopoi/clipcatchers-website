import {
  BarChart3,
  Bell,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  PlusCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  exact?: boolean;
};

export const MAIN_NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "D", exact: true },
  { title: "Campaigns", href: "/campaigns", icon: Megaphone, shortcut: "C" },
  { title: "Create Campaign", href: "/campaigns/new", icon: PlusCircle, shortcut: "N", exact: true },
  { title: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "A" },
  { title: "Files", href: "/files", icon: FolderOpen, shortcut: "F" },
];

export const SECONDARY_NAV: NavItem[] = [
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Support", href: "/support", icon: LifeBuoy },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const ALL_NAV = [...MAIN_NAV, ...SECONDARY_NAV];

export function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
