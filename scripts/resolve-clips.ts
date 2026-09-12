/**
 * Resolve clip links to canonical URLs and cache their thumbnails.
 *
 *   npx tsx scripts/resolve-clips.ts [--limit 40] [--refresh] [--dry]
 *
 * ── Why this is a job and not a request ──────────────────────────────────
 * ~91% of submitted links are vt.tiktok.com short links. TikTok's oEmbed
 * returns 400 for those, so each one needs a redirect round trip to reach its
 * canonical /@user/video/<id> form first — measured at ~5s apiece. Doing that
 * for 5,033 clips is hours of waiting, which is fine for a background job and
 * impossible inside a page render.
 *
 * ── Why it goes highest-views-first ──────────────────────────────────────
 * The wall shows a dozen clips. Ordering by views means the page is usable
 * after the first couple of minutes rather than after the whole backlog, and
 * every later run only deepens the bench.
 *
 * ── What it will not do ──────────────────────────────────────────────────
 * Retry the hopeless. oEmbed serves /video/ and refuses /photo/, and a good
 * number of these are photo posts; the reason is written to resolveError and
 * that clip is skipped next time unless --refresh is passed. Thumbnails come
 * from a *-sign CDN host and carry an expiring signature, so thumbnailAt
 * records when each was fetched and --refresh re-fetches the oldest.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};

const LIMIT = value("limit", 40);
const REFRESH = flag("refresh");
const DRY = flag("dry");
/** Polite spacing between hits on tiktok.com. Two jobs at once will get you rate limited. */
const DELAY_MS = 700;
/** A thumbnail older than this is assumed to have lapsed and is re-fetched. */
const STALE_DAYS = 10;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Resolved = { canonicalUrl: string; thumbnailUrl: string } | { error: string };

async function resolveOne(url: string): Promise<Resolved> {
  let canonical = url;

  // Short links have to be followed before oEmbed will look at them. fetch
  // follows redirects by default, so the landing URL is what we want; the
  // body is discarded.
  if (/^https?:\/\/(vt|vm)\.tiktok\.com\//i.test(url) || /\/t\//.test(url)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      canonical = res.url || url;
      await res.arrayBuffer().catch(() => undefined);
    } catch (e) {
      return { error: `redirect failed: ${(e as Error).message.slice(0, 80)}` };
    }
  }

  // Strip TikTok's tracking query so the stored URL is stable and shareable.
  try {
    const u = new URL(canonical);
    u.search = "";
    canonical = u.toString();
  } catch {
    /* leave it as-is; oEmbed will reject it and we record why */
  }

  if (/\/photo\//.test(canonical)) {
    return { error: "photo post — oEmbed serves /video/ only" };
  }

  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonical)}`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return { error: `oembed ${res.status}` };
    const data = (await res.json()) as { thumbnail_url?: string };
    if (!data.thumbnail_url) return { error: "oembed returned no thumbnail" };
    return { canonicalUrl: canonical, thumbnailUrl: data.thumbnail_url };
  } catch (e) {
    return { error: `oembed failed: ${(e as Error).message.slice(0, 80)}` };
  }
}

async function main() {
  const where = REFRESH
    ? {
        thumbnailAt: { lt: new Date(Date.now() - STALE_DAYS * 864e5) },
        campaign: { status: { not: "PENDING" as const } },
      }
    : {
        thumbnailUrl: null,
        resolveError: null,
        views: { gt: 0 },
        platform: "TikTok",
        campaign: { status: { not: "PENDING" as const } },
      };

  const clips = await prisma.campaignClip.findMany({
    where,
    orderBy: REFRESH ? { thumbnailAt: "asc" } : { views: "desc" },
    take: LIMIT,
    select: { id: true, url: true, views: true },
  });

  const done = await prisma.campaignClip.count({ where: { thumbnailUrl: { not: null } } });
  const failed = await prisma.campaignClip.count({ where: { resolveError: { not: null } } });
  console.log(
    `  ${REFRESH ? "refreshing" : "resolving"} ${clips.length} clip(s)` +
      `  ·  already have thumbnails: ${done}  ·  previously failed: ${failed}` +
      (DRY ? "  ·  DRY RUN, nothing written" : ""),
  );

  let ok = 0;
  let bad = 0;
  for (const [i, clip] of clips.entries()) {
    const out = await resolveOne(clip.url);
    const label = `${String(i + 1).padStart(3)}/${clips.length}  ${clip.views.toLocaleString().padStart(10)} views`;

    if ("error" in out) {
      bad += 1;
      console.log(`  ${label}  ✗ ${out.error}`);
      if (!DRY) {
        await prisma.campaignClip.update({
          where: { id: clip.id },
          data: { resolveError: out.error },
        });
      }
    } else {
      ok += 1;
      console.log(`  ${label}  ✓ ${out.canonicalUrl.slice(0, 58)}`);
      if (!DRY) {
        await prisma.campaignClip.update({
          where: { id: clip.id },
          data: {
            canonicalUrl: out.canonicalUrl,
            thumbnailUrl: out.thumbnailUrl,
            thumbnailAt: new Date(),
            resolveError: null,
          },
        });
      }
    }
    await sleep(DELAY_MS);
  }

  const total = await prisma.campaignClip.count({ where: { thumbnailUrl: { not: null } } });
  console.log(`\n  resolved ${ok}, failed ${bad}  ·  clips with a thumbnail now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
