"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { NavGroup } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

/**
 * One top-level nav item with a menu under it.
 *
 * ── Why this isn't the DropdownMenu primitive ───────────────────────────
 * Radix's DropdownMenu is a menu of *actions*: it takes focus into itself,
 * traps it, and treats arrow keys as the only way through. These are links to
 * pages, and a reader tabbing through a marketing header expects Tab to walk
 * them in order and expects hover to reveal them without a click. Wiring a
 * menubar to behave like navigation is more code than the 60 lines here, and
 * it fights the primitive the whole way.
 *
 * ── The three ways in, and why all three ────────────────────────────────
 * Hover, because that is what the design does and what a mouse expects.
 * Click, because hover does not exist on a phone — a touch fires pointerenter
 * once and then leaves the panel stuck open with no way to dismiss it.
 * Keyboard, because a menu you cannot Tab into is a menu that is not there.
 *
 * The trigger is a real link as well as a toggle. Someone who doesn't know
 * which of eight categories they are gets a landing page rather than being
 * forced to pick from a list they don't understand — so a click navigates,
 * and the menu is what opens on hover and on the chevron.
 */
export function NavMenu({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();

  // Any navigation closes it. Without this the panel stays open across a
  // client-side route change, hanging over the page you just asked for.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Focus goes back where it came from, or Escape drops the caret at the
      // top of the document and the next Tab restarts from the logo.
      trigger.current?.focus();
    };
    // Pointerdown rather than click: a click listener fires after the link's
    // own handler and can close the panel before the navigation is read.
    const onAway = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onAway);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onAway);
    };
  }, [open]);

  const active = pathname === group.href || pathname.startsWith(`${group.href}/`);

  return (
    <div
      ref={wrap}
      className="relative"
      onPointerEnter={(e) => {
        // Mouse only. On touch, pointerenter fires on tap and would open the
        // panel at the same moment the click navigates.
        if (e.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
      // Tabbing out of the last link closes it, so the panel doesn't hang
      // open behind whatever gets focus next.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="flex items-center">
        <Link
          href={group.href}
          className={cn(
            "rounded-md py-2 pl-2 text-[15px] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {group.label}
        </Link>
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls={id}
          // The link beside it already carries the name; without this the
          // button announces as an unlabelled toggle.
          aria-label={`${group.label} menu`}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {/* Kept mounted and hidden rather than unmounted, so the pointerleave
          that closes it can't fire against a node that no longer exists. */}
      <div
        id={id}
        className={cn(
          "absolute left-1/2 top-full z-50 w-max -translate-x-1/2 pt-3 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        // Hidden from assistive tech and from Tab when closed. `inert` would
        // be tidier and is not safe to assume in every browser we see.
        aria-hidden={!open}
      >
        <div
          className={cn(
            "surface rounded-2xl border border-border bg-popover p-2 shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.25)]",
            // Eight categories in one column is a menu that runs off the
            // bottom of a laptop screen. Four and under stays single.
            group.links.length > 4 ? "grid w-[34rem] grid-cols-2 gap-1" : "w-72 space-y-1",
          )}
        >
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              tabIndex={open ? undefined : -1}
              className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              <span className="display-sm block text-sm">{link.label}</span>
              {link.blurb && (
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {link.blurb}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
