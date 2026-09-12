import Image from "next/image";
import { unstable_cache } from "next/cache";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCompact } from "@/lib/format";

/**
 * Real clips, on the front page.
 *
 * ── Views, no handles ────────────────────────────────────────────────────
 * The post is public and linked, but the creator's name is not printed here.
 * Clients are only named on this site with their agreement (see NAMED_CLIENTS
 * in lib/public-stats.ts) and creators have not been asked at all, so the same
 * restraint applies: anyone who wants to know whose clip it is can follow the
 * link to TikTok, where they chose to publish it.
 *
 * ── Only clips with a cached thumbnail ───────────────────────────────────
 * ~91% of submitted links are vt.tiktok.com short links, and TikTok's oEmbed
 * refuses those — each needs a redirect round trip of several seconds before
 * it will even be looked at. That work happens in scripts/resolve-clips.ts and
 * lands in thumbnailUrl; this component only reads the result, so a page
 * render never waits on tiktok.com.
 *
 * The consequence to know about: oEmbed serves /video/ and not /photo/, and a
 * good number of the best-performing clips are photo posts. They cannot be
 * given a thumbnail without a headless browser, so they are absent here. This
 * wall is the best *video* clips, not the best clips.
 */
export type WallClip = {
  href: string;
  thumbnailUrl: string;
  views: number;
};

/** Below this it reads as a broken grid rather than a showcase. */
const MINIMUM = 6;
const WANTED = 12;

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

  // Rendering four tiles where twelve belong looks like a fault, not a
  // showcase. Until the resolver has built up a bench, show nothing.
  if (clips.length < MINIMUM) return null;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <p className="eyebrow text-primary-ink">Real clips, real numbers</p>
      <h2 className="display mt-3 text-3xl sm:text-5xl">
        WHAT DELIVERY
        <br />
        ACTUALLY LOOKS LIKE
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Every tile is a live post that earned against a campaign budget. Open any one
        and check the view count yourself — nothing here is a mockup, and nothing is
        self-reported.
      </p>

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {clips.map((clip) => (
          <li key={clip.href}>
            <a
              href={clip.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-xl border border-border bg-muted"
            >
              {/* 9:16, because that is the shape of the thing being shown. */}
              <div className="relative aspect-[9/16]">
                <Image
                  src={clip.thumbnailUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8">
                  <p className="font-mono text-sm font-semibold text-white">
                    {formatCompact(clip.views)}
                  </p>
                  <p className="text-[11px] text-white/70">views</p>
                </div>
                <ArrowUpRight
                  className="absolute right-2 top-2 h-4 w-4 text-white/0 transition-colors group-hover:text-white/90"
                  aria-hidden
                />
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
