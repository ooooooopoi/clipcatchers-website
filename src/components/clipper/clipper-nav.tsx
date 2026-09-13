"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  CircleHelp,
  Clapperboard,
  DollarSign,
  Megaphone,
  Store,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

/**
 * The clipper dashboard's left rail.
 *
 * ── Why some entries are dead on purpose ─────────────────────────────────
 * Marketplace, Progress and Referrals are marked SOON and are not links.
 * Everything else is backed by an endpoint that already works. A nav item
 * that opens an empty page is worse than one that says it isn't ready yet:
 * the first looks broken and gets reported, the second sets an expectation.
 * Referrals in particular has real data behind it in the bot — invite_joins
 * and invite_campaigns — but nothing exposes it over HTTP, so it stays SOON
 * until that exists rather than shipping a page that invents numbers.
 */
const SECTIONS = [
  { href: "", label: "Campaigns", icon: Megaphone },
  { href: "/clips", label: "Clips", icon: Clapperboard },
  { href: "/marketplace", label: "Marketplace", icon: Store, soon: true },
  { href: "/accounts", label: "Accounts", icon: UserRound },
  { href: "/earnings", label: "Earnings", icon: DollarSign },
  { href: "/progress", label: "Progress", icon: Trophy, soon: true },
  { href: "/referrals", label: "Referrals", icon: Users, soon: true },
  { href: "/payouts", label: "Payouts", icon: Banknote },
  { href: "/help", label: "Help", icon: CircleHelp },
] as const;

export function ClipperNav({ base }: { base: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-4">
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
              className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50"
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
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-accent font-medium text-primary-ink"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
