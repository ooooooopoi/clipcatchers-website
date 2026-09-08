"use client";

import { useState } from "react";
import { FileText, Phone } from "lucide-react";
import { QuoteForm, type QuoteMode } from "@/components/quote-form";
import { cn } from "@/lib/utils";

/**
 * The two ways into a campaign, and the switch between them.
 *
 * ── Why both ────────────────────────────────────────────────────────────
 * This page had one door: a nine-field form that gets answered by email
 * within a working day. That suits someone who has already decided and wants
 * numbers. It does not suit someone still working out whether this is real,
 * and that person was being asked to write a brief for a service they hadn't
 * been convinced of yet. They close the tab instead, and we never know they
 * were here.
 *
 * "Book a call" is the door for them. Fewer fields, a rough window instead of
 * a brief, and a human on the other end.
 *
 * ── Why the state is here and not in the URL ────────────────────────────
 * The mode is seeded from `?mode=call` so the choice is linkable — that link
 * goes in the header, the footer and the homepage's closing panel, and it can
 * be pasted into a DM. But switching after arrival is local state, so it is
 * instant and doesn't push a history entry: someone toggling between the two
 * to compare them should not have to press Back four times to leave.
 */
const TABS = [
  {
    mode: "brief" as const,
    icon: FileText,
    label: "Send a brief",
    blurb: "Written reply with real numbers, within a working day.",
  },
  {
    mode: "call" as const,
    icon: Phone,
    label: "Book a call",
    blurb: "Fifteen minutes with someone who has run these.",
  },
];

export function LaunchPanel({ initialMode = "brief" }: { initialMode?: QuoteMode }) {
  const [mode, setMode] = useState<QuoteMode>(initialMode);

  return (
    <div>
      {/* A real tablist, so arrow keys move between the two and a screen
          reader announces which is selected — this is a choice between two
          views of the same thing, which is exactly what tabs are for. */}
      <div
        role="tablist"
        aria-label="How to get in touch"
        className="surface grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-card p-1.5"
      >
        {TABS.map((tab) => {
          const active = mode === tab.mode;
          return (
            <button
              key={tab.mode}
              type="button"
              role="tab"
              id={`launch-tab-${tab.mode}`}
              aria-selected={active}
              aria-controls="launch-panel"
              onClick={() => setMode(tab.mode)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:px-5",
                // Filled near-black when selected, matching the chips inside
                // the form below. One selection language for the whole page.
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="display-sm text-sm">{tab.label}</span>
              </span>
              {/* Hidden on the narrowest screens: two lines of explanation
                  inside a tab is more words than the tab itself, and at 320px
                  it wraps to four. */}
              <span
                className={cn(
                  "hidden text-xs leading-snug min-[420px]:block",
                  active ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {tab.blurb}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="launch-panel"
        role="tabpanel"
        aria-labelledby={`launch-tab-${mode}`}
        className="mt-4"
      >
        <QuoteForm mode={mode} />
      </div>
    </div>
  );
}
