import { unstable_cache } from "next/cache";
import { looksEnglish } from "@/lib/caption-language";
import { prisma } from "@/lib/prisma";
import { formatCompact } from "@/lib/format";

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
 ── Curated, not ranked ─────────────────────────────────────────────────
 * featuredRank decides what shows; scripts/feature-clips.ts sets it. Ranking
 * by views put French, Portuguese and Indonesian posts on an English homepage,
 * because the language is burned into the video frame where no caption test
 * reaches it — of the first twenty-five resolved clips, four were English.
 *
 * lib/caption-language.ts is now only the fallback, for when nothing is
 * picked. It reads captions, so it catches what a post declares and never what
 * it shows; that is exactly why curation exists above it.
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
 * stops being true, delete public/videos and the poster fallback takes over
 * with no code change.
 *
 * Views is also all there is: the bot's sync payload carries externalId, url,
 * platform, handle and views per clip, so the likes and shares it does track
 * never reach this database.
 *
 * ── Only clips with a cached thumbnail ───────────────────────────────────
 * ~91% of submitted links are vt.tiktok.com short links, which TikTok's
 * oEmbed refuses; each needs a redirect round trip of several seconds first.
 * scripts/resolve-clips.ts does that out of band and this only reads the
 * result, so a page render never waits on tiktok.com. oEmbed serves /video/
 * and not /photo/, and many of the best clips are photo posts — they have no
 * thumbnail and are absent, so this is the best *video* clips.
 */
export type WallClip = {
  href: string;
  /** Names the file under /videos — see fetch-clip-videos.py. */
  externalId: string;
  thumbnailUrl: string;
  views: number;
};

/** Below this the belt has visible gaps between repeats. */
const MINIMUM = 6;
const WANTED = 12;
/**
 * Read this many before filtering. The English test runs in JS on the stored
 * caption — it isn't expressible as a Prisma where — so the query has to
 * over-fetch or a run of French clips would starve the belt.
 */
const CANDIDATES = 60;

const select = {
  externalId: true,
  url: true,
  canonicalUrl: true,
  thumbnailUrl: true,
  views: true,
  caption: true,
} as const;

const load = unstable_cache(
  async (): Promise<WallClip[]> => {
    const shape = (r: {
      externalId: string;
      url: string;
      canonicalUrl: string | null;
      thumbnailUrl: string | null;
      views: number;
    }) => ({
      href: r.canonicalUrl ?? r.url,
      externalId: r.externalId,
      thumbnailUrl: r.thumbnailUrl as string,
      views: r.views,
    });

    // Hand-picked wins outright. A curated list has already been looked at, so
    // it skips the language guess entirely — that test reads captions, and the
    // reason curation exists is that the language is in the pixels.
    const featured = await prisma.campaignClip.findMany({
      where: {
        featuredRank: { not: null },
        thumbnailUrl: { not: null },
        campaign: { status: { not: "PENDING" } },
      },
      orderBy: { featuredRank: "asc" },
      select,
    });
    if (featured.length >= MINIMUM) return featured.map(shape);

    // Nothing picked (or too few survived a re-sync): fall back to the best
    // by views that the caption test doesn't rule out. Weaker — it cannot see
    // burned-in text — but better than an empty band.
    const rows = await prisma.campaignClip.findMany({
      where: {
        thumbnailUrl: { not: null },
        views: { gt: 0 },
        campaign: { status: { not: "PENDING" } },
      },
      orderBy: { views: "desc" },
      take: CANDIDATES,
      select,
    });
    return rows.filter((r) => looksEnglish(r.caption)).slice(0, WANTED).map(shape);
  },
  ["clips-wall"],
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
            {/* The thumbnail is the poster, which makes the fallback free: if
                the file under /videos is missing — never fetched, or the
                rights position changed and it was deleted — the browser shows
                the poster and the belt looks exactly as it did before there
                was any video at all. No existence check, no build step.

                muted + playsInline are what make autoplay legal on iOS and
                Chrome; without both, twelve tiles sit frozen on mobile.
                preload="none" keeps first paint off the hook — the poster is
                already on screen, so nothing is waiting on a video file. */}
            <video
              src={`/videos/${clip.externalId}.mp4`}
              poster={clip.thumbnailUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
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
        <Phone key={clip.href} clip={clip} index={i} />
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
