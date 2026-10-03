"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ClipperActions } from "@/components/clipper/clipper-actions";
import { Engagement, StatusDot, clipNote } from "@/components/clipper/clip-status";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { ClipperClip } from "@/lib/bot";
import { compact, dollars } from "@/lib/clipper-format";

/**
 * The dashboard's clip list on a phone.
 *
 * The desktop row puts the campaign, views, engagement, worth and Take down on
 * one line. At phone width that squeezed the campaign name down to a letter or
 * two ("N…"), the one thing that says which clip it is. Here each clip is two
 * short lines, campaign and worth, then status and views, and tapping it opens
 * a panel with the rest: the full figures, its post, and Take down. Take down
 * sitting one tap away rather than on every row also keeps a thumb scrolling
 * the list from stopping a clip by accident.
 */
export function MobileClipList({
  clips,
  userId,
  sig,
  floorPct,
  floorFrom,
}: {
  clips: ClipperClip[];
  userId: string;
  sig: string;
  floorPct: number | null;
  floorFrom: number | null;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = clips.find((c) => c.id === openId) ?? null;

  return (
    <>
      <ul className="mt-4 space-y-2 lg:hidden">
        {clips.map((clip) => {
          const note = clipNote(clip, floorPct, floorFrom);
          return (
            <li key={clip.id}>
              <button
                type="button"
                onClick={() => setOpenId(clip.id)}
                className="surface w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors active:bg-accent/40"
              >
                <span className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{clip.campaign}</span>
                  <Worth clip={clip} />
                </span>
                <span className="mt-1.5 flex items-center gap-3">
                  <StatusDot status={clip.status} paid={clip.paid} fixed={false} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {compact(clip.views)} views
                  </span>
                  <Engagement
                    pct={clip.engagement_pct}
                    views={clip.views}
                    floor={floorPct}
                    minViews={floorFrom}
                  />
                  <ChevronRight aria-hidden className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60" />
                </span>
                {note ? (
                  <span
                    className={`mt-1.5 block text-xs ${note.warning ? "text-warning" : "text-muted-foreground"}`}
                  >
                    {note.text}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={open !== null} onOpenChange={(next) => !next && setOpenId(null)}>
        {/* `dark` because the sheet portals to document.body, outside the
            .clipper-shell wrapper that scopes this subtree's variables. */}
        <SheetContent
          side="bottom"
          className="dark max-h-[85vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 text-foreground lg:hidden"
        >
          {open ? <ClipPanel clip={open} userId={userId} sig={sig} floorPct={floorPct} floorFrom={floorFrom} /> : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Worth is provisional while the campaign runs; muted until it's a settled
 *  figure, so a moving number doesn't dress as a promise. */
function Worth({ clip }: { clip: ClipperClip }) {
  const settledAndOwed = !clip.paid && clip.worth > 0 && !clip.campaign_active;
  return (
    <span
      className={`font-mono text-sm ${
        settledAndOwed ? "font-semibold text-primary-ink" : "text-muted-foreground"
      }`}
    >
      {dollars(clip.worth)}
    </span>
  );
}

function ClipPanel({
  clip,
  userId,
  sig,
  floorPct,
  floorFrom,
}: {
  clip: ClipperClip;
  userId: string;
  sig: string;
  floorPct: number | null;
  floorFrom: number | null;
}) {
  const note = clipNote(clip, floorPct, floorFrom);
  const worthLabel = clip.paid ? "Paid" : clip.campaign_active ? "Worth so far" : "Worth";

  return (
    <div>
      {/* pr-8 keeps a long campaign name clear of the close button. */}
      <SheetTitle className="truncate pr-8 text-lg">{clip.campaign}</SheetTitle>
      <SheetDescription asChild>
        <div className="mt-1.5">
          <StatusDot status={clip.status} paid={clip.paid} fixed={false} />
        </div>
      </SheetDescription>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
        <div className="px-3 py-3.5">
          <dt className="text-xs text-muted-foreground">Views</dt>
          <dd className="mt-1 font-mono text-base font-semibold">{compact(clip.views)}</dd>
        </div>
        <div className="px-3 py-3.5">
          <dt className="text-xs text-muted-foreground">Engagement</dt>
          <dd className="mt-1 font-mono text-base font-semibold">
            {clip.engagement_pct == null ? "Not read" : `${clip.engagement_pct.toFixed(1)}%`}
          </dd>
        </div>
        <div className="px-3 py-3.5">
          <dt className="text-xs text-muted-foreground">{worthLabel}</dt>
          <dd className="mt-1 font-mono text-base font-semibold">{dollars(clip.worth)}</dd>
        </div>
      </dl>

      {note ? (
        <p className={`mt-4 text-sm ${note.warning ? "text-warning" : "text-muted-foreground"}`}>
          {note.text}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <a
          href={clip.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-accent/40"
        >
          Open post
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <ClipperActions
          userId={userId}
          sig={sig}
          clipId={clip.id}
          status={clip.status}
          paid={clip.paid}
          locked={clip.locked}
          className="h-11 flex-1 rounded-xl text-sm"
        />
      </div>
    </div>
  );
}
