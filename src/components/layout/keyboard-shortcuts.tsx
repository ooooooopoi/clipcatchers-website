"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MAIN_NAV } from "@/lib/nav";

/**
 * Linear-style chords: press `g` then a letter to jump. `?` lists them.
 * ⌘K is owned by the search dialog itself.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pending = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "combobox");
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "?") {
        event.preventDefault();
        toast("Keyboard shortcuts", {
          description: `⌘K search · ${MAIN_NAV.filter((n) => n.shortcut)
            .map((n) => `g+${n.shortcut?.toLowerCase()} ${n.title.toLowerCase()}`)
            .join(" · ")}`,
          duration: 6000,
        });
        return;
      }

      if (event.key === "g") {
        pending.current = true;
        clearTimeout(timer);
        timer = setTimeout(() => (pending.current = false), 1200);
        return;
      }

      if (pending.current) {
        const match = MAIN_NAV.find(
          (item) => item.shortcut?.toLowerCase() === event.key.toLowerCase(),
        );
        pending.current = false;
        if (match) {
          event.preventDefault();
          router.push(match.href);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [router]);

  return null;
}
