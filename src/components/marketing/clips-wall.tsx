import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCompact } from "@/lib/format";
import { WALL_CLIPS } from "@/lib/wall-clips";

/**
 * Real clips, on the front page, running edge to edge.
 *
 * ── Phones, and why they move ────────────────────────────────────────────
 * A 9:16 post in a square tile is a post out of context; in a handset it
 * reads as the thing it is. They travel because a still row of seven is a
 * composition a reader takes in once — a belt that keeps arriving says the
 * inventory is deeper than the screen, which is the actual claim.
 *
 * The motion is the Ticker's, not a second mechanism: `.ticker-track` already
 * carries the animation, pauses under the cursor and stops entirely under
 * prefers-reduced-motion. Reusing it means the page has one moving-content
 * behaviour rather than two that drift apart.
 *
 * ── The bit that is easy to get wrong ────────────────────────────────────
 * Same trap the Ticker documents: the run is rendered twice and the track
 * slides exactly -50%, so the second copy lands where the first began. On top
 * of that, the lift and lean here alternate by index — a period of two — so
 * the run must hold an EVEN number of phones or the second copy starts on the
 * opposite phase and the seam jumps every cycle. `usable` enforces that;
 * don't make it odd.
 *
 ── Curated, and the list is in the code ─────────────────────────────────
 * lib/wall-clips.ts decides what shows, in order. It replaced featuredRank,
 * which lived in the production database and could only be changed from a
 * session with access to it, so the belt went weeks without being refreshed.
 * Ranking by views never worked here: the language is burned into the video
 * frame where no caption test reaches it, and most top posts are slideshows.
 * See that file for how the current set was chosen.
 *
 * ── Views, no handles, no link ──────────────────────────────────────────
 * The tiles are inert. They used to open the post, which is what made this
 * section checkable; the line beneath now says so plainly instead of inviting
 * a click that doesn't happen. The creator is not named either — clients are
 * only named on this site by agreement (NAMED_CLIENTS in lib/public-stats.ts)
 * and creators have not been asked.
 *
 * ── The video files ─────────────────────────────────────────────────────
 * /videos/<externalId>.mp4, fetched and shrunk by scripts/fetch-clip-videos.py
 * and served off the CDN with the rest of the site. Re-hosted on the owner's
 * statement that the clipper terms grant reuse of submitted clips; if that
 * stops being true, empty WALL_CLIPS and the section renders nothing.
 *
 * Views is also all there is: the bot's sync payload carries externalId, url,
 * platform, handle and views per clip, so the likes and shares it does track
 * never reach this database.
 *
 * ── No poster ───────────────────────────────────────────────────────────
 * The poster used to be the TikTok thumbnail. Those URLs are signed and
 * expire: on 2026-09-28 all twelve on the live belt answered 403, so every
 * tile opened on a broken image until its video loaded. The first frame of
 * the video is the poster now — preload="metadata" fetches just enough to
 * paint it.
 */
export type WallClip = {
  /** Names the file under /videos — see fetch-clip-videos.py. */
  externalId: string;
  views: number;
};

/** Below this the belt has visible gaps between repeats. */
const MINIMUM = 6;

const load = unstable_cache(
  async (): Promise<WallClip[]> => {
    if (WALL_CLIPS.length === 0) return [];
    // The list decides what shows and in what order. The database is only
    // asked for fresher view counts, and it is allowed to be down: a belt
    // with the counts as picked is better than no belt, which is what a
    // failed query used to produce.
    let live = new Map<string, number>();
    try {
      const rows = await prisma.campaignClip.findMany({
        where: { externalId: { in: WALL_CLIPS.map((c) => c.externalId) } },
        select: { externalId: true, views: true },
      });
      live = new Map(rows.map((r) => [r.externalId, r.views]));
    } catch (error) {
      console.error("clips-wall: live view counts unavailable, using the picked ones", error);
    }
    // Views only accumulate, so the larger of the two readings is the newer
    // one. Taking the max also means a payable-capped figure in the database
    // can never show a clip smaller than it was when it was chosen.
    return WALL_CLIPS.map((c) => ({
      externalId: c.externalId,
      views: Math.max(c.views, live.get(c.externalId) ?? 0),
    }));
  },
  ["clips-wall-v2"],
  { revalidate: 3600, tags: ["clips-wall"] },
);

function Phone({ clip, index }: { clip: WallClip; index: number }) {
  const raised = index % 2 === 0;
  return (
    <li className="w-[132px] shrink-0 lg:w-[150px]">
      {/* Not a link. These used to open the post on TikTok, which is what made
          the section evidence rather than decoration — see the note on the
          caption line below. */}
      <div
        style={{
          transform: `translateY(${raised ? 0 : 20}px) rotate(${raised ? -2.5 : 2.5}deg)`,
        }}
      >
        {/* Bezel, notch, screen — nothing else. Chrome competing with the clip
            inside it defeats the point of showing the clip. */}
        <div className="relative rounded-[1.6rem] bg-neutral-900 p-[5px] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.45)] ring-1 ring-black/5">
          <div className="absolute left-1/2 top-[9px] z-10 h-[5px] w-10 -translate-x-1/2 rounded-full bg-neutral-700/90" />
          <div className="relative aspect-[9/17] overflow-hidden rounded-[1.3rem] bg-neutral-800">
            {/* muted + playsInline are what make autoplay legal on iOS and
                Chrome; without both, every tile sits frozen on mobile.
                No poster: see "No poster" at the top of this file.
                preload="metadata" is a few KB per tile and paints the first
                frame, which is what the poster used to be for. */}
            <video
              src={`/videos/${clip.externalId}.mp4`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-sm font-semibold text-primary-ink">
          {formatCompact(clip.views)}
        </p>
        <p className="text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          views
        </p>
      </div>
    </li>
  );
}

function Run({ clips, ariaHidden }: { clips: WallClip[]; ariaHidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-start gap-4 px-2 sm:gap-5 lg:gap-6"
      {...(ariaHidden ? { "aria-hidden": true } : {})}
    >
      {clips.map((clip, i) => (
        <Phone key={clip.externalId} clip={clip} index={i} />
      ))}
    </ul>
  );
}

export async function ClipsWall() {
  let clips: WallClip[] = [];
  try {
    clips = await load();
  } catch (error) {
    // Same posture as getPublicStats: a homepage that 500s because the
    // database blinked is worse than one missing a section.
    console.error("clips-wall: couldn't read the clips", error);
    return null;
  }
  if (clips.length < MINIMUM) return null;

  // Even, or the alternating lift lands on the wrong phase in the second copy
  // and the loop visibly jumps. Dropping the lowest-view clip is the cheapest
  // way to guarantee it.
  const usable = clips.length % 2 === 0 ? clips : clips.slice(0, -1);

  return (
    // No heading. This sits directly beneath the hero, and a display h2 four
    // lines under the hero's own would read as two pages stapled together. The
    // belt is the argument; one line underneath is all the wording it needs.
    // aria-label because without a heading there is nothing to name it by.
    <section className="pb-10 pt-8 sm:pb-14 sm:pt-10" aria-label="Recent clips from live campaigns">
      <div className="ticker relative overflow-hidden">
        {/* Faded at both ends so phones arrive and leave rather than being
            guillotined by the edge of the screen. Above the track and
            pointer-transparent, or it would eat the hover that pauses it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_right,hsl(var(--background))_0%,transparent_10%,transparent_90%,hsl(var(--background))_100%)]"
        />
        {/* w-max so the track is as wide as its contents; without it there is
            nothing to translate. */}
        <div
          className="ticker-track flex w-max items-start pb-6"
          style={{ "--ticker-duration": "70s" } as React.CSSProperties}
        >
          <Run clips={usable} />
          {/* Scenery, not content: it exists so the loop can close. */}
          <Run clips={usable} ariaHidden />
        </div>
      </div>

      {/* The claim, in one line. It used to say "open any one and check the
          view count yourself", which was the section's whole argument — the
          tiles are no longer links, so that invitation would be a lie. What is
          left is a statement a reader has to take on trust. */}
      <p className="mx-auto mt-2 max-w-2xl px-5 text-center text-sm text-muted-foreground">
        Real posts from live campaigns. Every view count here was read off the live
        post, not reported by the creator.
      </p>
    </section>
  );
}
