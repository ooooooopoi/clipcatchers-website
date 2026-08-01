import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { SearchCommand } from "@/components/layout/search-command";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/auth-helpers";

export function Topbar({ user, unreadCount }: { user: SessionUser; unreadCount: number }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <MobileNav unreadCount={unreadCount} />

      <div className="flex-1 sm:flex-none">
        <SearchCommand />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsMenu initialUnread={unreadCount} />
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <UserMenu
          name={user.name}
          email={user.email}
          image={user.image}
          company={user.company}
        />
      </div>
    </header>
  );
}
