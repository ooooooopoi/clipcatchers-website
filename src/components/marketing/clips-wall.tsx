import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCompact } from "@/lib/format";

/**
 * Real clips, on the front page, shown in the shape they were made for.
 *
 * ── Phones, and on the light background ──────────────────────────────────
 * A 9:16 post in a square tile is a post out of context; in a handset it
 * reads as the thing it is. The frames sit on the page's existing white
 * rather than in a dark band of their own, because the ticker is the one
 * full-bleed element this site gets and a second one would cost it its spine.
 *
 * ── Views, no handles ────────────────────────────────────────────────────
 * The post is public and linked, but the creator is not named here. Clients
 * are only named on this site by agreement (NAMED_CLIENTS in
 * lib/public-stats.ts) and creators have not been asked at all, so the same
 * restraint applies. Anyone curious can follow the link to TikTok, where they
 * chose to publish.
 *
 * Views is also all there is: the bot's sync payload carries externalId, url,
 * platform, handle and views per clip, so likes and shares — which it does
 * track — never reach this database. An engagement line would need that
 * payload widened first.
 *
 * ── Only clips with a cached thumbnail ───────────────────────────────────
 * ~91% of submitted links are vt.tiktok.com short links, which TikTok's
 * oEmbed refuses; each needs a redirect round trip of several seconds first.
 * That happens in scripts/resolve-clips.ts, and this component only reads the
 * result, so a page render never waits on tiktok.com.
 *
 * The consequence worth knowing: oEmbed serves /video/ and not /photo/, and a
 * lot of the best clips are photo posts — they cannot be given a thumbnail
 * without a headless browser, so they are absent. This is the best *video*
 * clips, not the best clips.
 */
export type WallClip = {
  href: string;
  thumbnailUrl: string;
  views: number;
};

/** Below this it reads as a broken row rather than a showcase. */
const MINIMUM = 5;
const WANTED = 7;

const load = unstable_cache(
  async (): Promise<WallClip[]> => {
    const rows = await prisma.campaignClip.findMany({
      where: {
        thumbnailUrl: { not: null },
        views: { gt: 0 },
        campaign: { status: { not: "PENDING" } },
      },
      orderBy: { views: "desc" },
      take: WANTED,
      select: { url: true, canonicalUrl: true, thumbnailUrl: true, views: true },
    });
    return rows.map((r) => ({
      href: r.canonicalUrl ?? r.url,
      thumbnailUrl: r.thumbnailUrl as string,
      views: r.views,
    }));
  },
  ["clips-wall"],
  { revalidate: 3600, tags: ["clips-wall"] },
);

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

  const middle = (clips.length - 1) / 2;

  return (
    <section className="overflow-hidden py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-4 text-center sm:px-6">
        {/* Not "what delivery actually looks like", which is what this said
            first: Industries sits immediately below with "What a campaign
            looks like in your category", and two ...looks like headings in a
            row read as one section that lost its way. This one points back at
            Results directly above it instead. */}
        <p className="eyebrow text-primary-ink">Real clips</p>
        <h2 className="display mx-auto mt-3 max-w-3xl text-3xl sm:text-5xl">
          THE POSTS BEHIND THE NUMBERS
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every one of these is a live post that earned against a campaign budget. Open
          any of them and check the view count yourself — nothing here is a mockup, and
          nothing is self-reported.
        </p>
      </div>

      {/* Scrolls on a phone, fans out from the middle on a desktop. The
          transforms are inline because each one is derived from the item's
          distance from centre, which Tailwind can't express as a class. */}
      <ul className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:justify-center sm:gap-5 sm:overflow-visible sm:px-6 lg:gap-6 scrollbar-thin">
        {clips.map((clip, i) => {
          const distance = Math.abs(i - middle);
          return (
            <li
              key={clip.href}
              className="w-[140px] shrink-0 snap-center sm:w-[124px] lg:w-[150px]"
              style={{
                // Outer phones sit lower and lean away, so the row reads as an
                // arc rather than a shelf.
                // Rounded because the raw product is a binary fraction, and
                // -7.199999999999999deg has no business being in the markup.
                ["--lift" as string]: `${Math.round(distance * 16)}px`,
                ["--lean" as string]: `${((i - middle) * 2.4).toFixed(1)}deg`,
              }}
            >
              <a
                href={clip.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block transition-transform duration-300 will-change-transform sm:[transform:translateY(var(--lift))_rotate(var(--lean))] sm:hover:[transform:translateY(calc(var(--lift)-10px))_rotate(var(--lean))]"
              >
                {/* The handset. Bezel, notch, screen — nothing else; a chrome
                    frame competing with the clip inside it defeats the point. */}
                <div className="relative rounded-[1.6rem] bg-neutral-900 p-[5px] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.45)] ring-1 ring-black/5">
                  <div className="absolute left-1/2 top-[9px] z-10 h-[5px] w-10 -translate-x-1/2 rounded-full bg-neutral-700/90" />
                  <div className="relative aspect-[9/17] overflow-hidden rounded-[1.3rem] bg-neutral-800">
                    <Image
                      src={clip.thumbnailUrl}
                      alt=""
                      fill
                      sizes="150px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
                <p className="mt-3 text-center font-mono text-sm font-semibold text-primary-ink">
                  {formatCompact(clip.views)}
                </p>
                <p className="text-center text-[11px] uppercase tracking-wider text-muted-foreground">
                  views
                </p>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
