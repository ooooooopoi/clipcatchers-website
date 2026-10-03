"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  CircleHelp,
  DollarSign,
  Compass,
  LayoutDashboard,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

/**
 * The clipper dashboard's left rail.
 *
 * ── Why some entries are dead on purpose ─────────────────────────────────
 * Progress is marked SOON and is not a link. Everything else is backed by an
 * endpoint that already works. A nav item that opens an empty page is worse
 * than one that says it isn't ready yet: the first looks broken and gets
 * reported, the second sets an expectation. Referrals sat here as SOON until
 * the bot served /api/users/<id>/referrals, rather than ship a page that
 * invented numbers.
 */
const SECTIONS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  // Paid placement, deliberately next to Campaigns rather than further down:
  // it is the other half of the same question ("what can I cut?"), and the
  // two boards only work as a pair if finding one means finding the other.
  { href: "/ads", label: "Ads", icon: BadgeDollarSign },
  { href: "/accounts", label: "Accounts", icon: UserRound },
  { href: "/earnings", label: "Earnings", icon: DollarSign },
  { href: "/progress", label: "Progress", icon: Trophy, soon: true },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/help", label: "Help", icon: CircleHelp },
] as const;

/**
 * ── Icons only on a phone ────────────────────────────────────────────────
 * Below `lg` the rail is a row across the top, and with labels it ran off the
 * screen after three tabs ("Dashboard", "Explore", "Ads", "Ac…"), so most of
 * it was out of sight. The owner asked for the tabs to be just their icons
 * there (2026-10-03): all of them fit in one row, each a 44px button (a
 * little less on a 320px phone, rather than running off it), and the page's
 * own heading still says where you are. The label stays as the link's
 * accessible name. Progress, which isn't a link yet, is left out on a phone:
 * a greyed icon with no "Soon" beside it would only look broken.
 */
export function ClipperNav({ base }: { base: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex justify-between gap-1 p-3 lg:flex-col lg:justify-start lg:overflow-visible lg:p-4">
      {SECTIONS.map(({ href, label, icon: Icon, ...rest }) => {
        const soon = "soon" in rest && rest.soon;
        const target = `${base}${href}`;
        // Exact match for the index, prefix for the rest — otherwise the
        // Campaigns tab stays lit on every page, since its href is the base.
        const active = href === "" ? pathname === base : pathname.startsWith(target);

        if (soon) {
          return (
            <span
              key={label}
              aria-disabled="true"
              className="hidden shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50 lg:flex"
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{label}</span>
              <span className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:inline">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={label}
            href={target}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 w-11 min-w-0 items-center justify-center gap-3 rounded-lg text-sm transition-colors lg:h-auto lg:w-auto lg:shrink-0 lg:justify-start lg:px-3 lg:py-2.5 ${
              active
                ? "bg-accent font-medium text-primary-ink"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 lg:h-[18px] lg:w-[18px]" aria-hidden="true" />
            <span className="hidden whitespace-nowrap lg:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
