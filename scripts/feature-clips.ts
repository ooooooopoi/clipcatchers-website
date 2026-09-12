/**
 * Set which clips appear on the homepage belt, and in what order.
 *
 *   npx tsx scripts/feature-clips.ts --set 7412345,7412346,7412347
 *   npx tsx scripts/feature-clips.ts --list
 *   npx tsx scripts/feature-clips.ts --clear
 *
 * Ids are the bot's clip ids (CampaignClip.externalId), which is what the
 * contact sheet prints alongside each thumbnail.
 *
 * ── Why curate at all ────────────────────────────────────────────────────
 * Ranking by views put mostly French, Portuguese and Indonesian posts on an
 * English homepage. The language is burned into the video frame, so no caption
 * test reaches it — of the first twenty-five resolved clips, four were clearly
 * English. A shop window is chosen, not sorted.
 *
 * It also unpicks an accident: oEmbed refuses /photo/ posts, so the three
 * best-performing clips in the library were excluded for being slideshows
 * rather than for being bad. Curation ignores that, since a hand-picked list
 * only needs a thumbnail, and photo posts have none — they still can't appear.
 * What changes is that nothing else is chosen *for* you.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const valueOf = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

async function list() {
  const featured = await prisma.campaignClip.findMany({
    where: { featuredRank: { not: null } },
    orderBy: { featuredRank: "asc" },
    select: { externalId: true, featuredRank: true, views: true, caption: true },
  });
  if (featured.length === 0) {
    console.log("  nothing featured — the belt is falling back to top-by-views");
    return;
  }
  console.log(`  ${featured.length} featured, in belt order:`);
  for (const c of featured) {
    console.log(
      `    ${String(c.featuredRank).padStart(3)}  id ${c.externalId.padEnd(6)}` +
        `  ${c.views.toLocaleString().padStart(10)} views  ${JSON.stringify((c.caption ?? "").slice(0, 40))}`,
    );
  }
}

async function main() {
  if (has("clear")) {
    const { count } = await prisma.campaignClip.updateMany({
      where: { featuredRank: { not: null } },
      data: { featuredRank: null },
    });
    console.log(`  cleared ${count} — the belt falls back to top-by-views`);
    return list();
  }

  const raw = valueOf("set");
  if (!raw) return list();

  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length < 6) {
    // The belt hides itself below six and needs an even count to loop without
    // a visible seam, so refuse rather than quietly produce a broken band.
    throw new Error(`need at least 6 ids, got ${ids.length}`);
  }
  if (ids.length % 2 !== 0) {
    throw new Error(
      `need an even number of ids (the belt alternates lift by index and would ` +
        `jump at the loop seam), got ${ids.length}`,
    );
  }

  const found = await prisma.campaignClip.findMany({
    where: { externalId: { in: ids } },
    select: { externalId: true, thumbnailUrl: true },
  });
  const missing = ids.filter((id) => !found.some((f) => f.externalId === id));
  if (missing.length) throw new Error(`no such clip(s): ${missing.join(", ")}`);

  const noThumb = found.filter((f) => !f.thumbnailUrl).map((f) => f.externalId);
  if (noThumb.length) {
    throw new Error(
      `these have no cached thumbnail and would render as empty frames: ${noThumb.join(", ")}`,
    );
  }

  await prisma.campaignClip.updateMany({
    where: { featuredRank: { not: null } },
    data: { featuredRank: null },
  });
  for (const [i, externalId] of ids.entries()) {
    await prisma.campaignClip.updateMany({
      where: { externalId },
      data: { featuredRank: i },
    });
  }
  console.log(`  featured ${ids.length} clips`);
  return list();
}

main()
  .catch((e) => {
    console.error(`  ${(e as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
