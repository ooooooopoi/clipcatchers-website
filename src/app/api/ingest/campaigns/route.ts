import { randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";
import { Prisma, type CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const SYSTEM_EMAIL = "shared-reports@clipcatchers.local";

/**
 * Rows per INSERT for the child tables.
 *
 * Postgres caps a statement at 65,535 bound parameters; 500 rows of at most 8
 * columns is 4,000, so this stays far under it while keeping the number of
 * round trips in single digits. The schemas above cap a campaign at 1,000
 * clips and 400 metrics, so this is at most two statements per table per
 * campaign.
 */
const WRITE_CHUNK = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Last occurrence wins, keyed by whatever the table's unique constraint is.
 *
 * This matters more than it looks. A multi-row INSERT ... ON CONFLICT fails
 * outright — "ON CONFLICT DO UPDATE command cannot affect row a second time" —
 * if two rows in the same statement collide on the conflict target. The
 * per-row upserts this replaces simply applied the second write over the
 * first, so a payload carrying a duplicate clip id or two metrics on one date
 * used to sync fine. Deduplicating here keeps that behaviour instead of
 * turning a tolerable payload into a 500.
 */
function lastPerKey<T>(items: T[], key: (item: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) byKey.set(key(item), item);
  return [...byKey.values()];
}

/**
 * Receives campaign state from the Discord bot. Authenticated with a shared
 * secret rather than a user session, since the caller is a service.
 *
 * Campaigns are keyed by externalId (the bot's campaign id) and owned by the
 * client whose email the bot has assigned. Unassigned campaigns are skipped —
 * data is never attached to an account that shouldn't see it.
 */
const metricSchema = z.object({
  date: z.string(),
  views: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  spendCents: z.number().int().min(0).default(0),
});

const clipSchema = z.object({
  externalId: z.string().min(1),
  url: z.string().max(2000),
  platform: z.string().max(40).nullish(),
  handle: z.string().max(120).nullish(),
  views: z.number().int().min(0).default(0),
});

const campaignSchema = z.object({
  externalId: z.string().min(1),
  // Optional fields accept null as well as absent: the sender is a service
  // serialising database rows, where an empty column comes through as null.
  ownerEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  name: z.string().min(1).max(200),
  brandName: z.string().max(200).nullish(),
  status: z
    .enum(["PENDING", "APPROVED", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])
    .default("RUNNING"),
  budgetCents: z.number().int().min(0).default(0),
  spentCents: z.number().int().min(0).default(0),
  totalViews: z.number().int().min(0).default(0),
  estimatedReach: z.number().int().min(0).default(0),
  clipCount: z.number().int().min(0).default(0),
  platforms: z.array(z.string()).nullish(),
  description: z.string().max(4000).nullish(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  metrics: z.array(metricSchema).max(400).default([]),
  clips: z.array(clipSchema).max(1000).default([]),
});

const payloadSchema = z.object({ campaigns: z.array(campaignSchema).max(200) });

function secretMatches(provided: string | null) {
  const expected = process.env.INGEST_SECRET ?? "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Constant-time compare, with a length guard since timingSafeEqual throws on mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}

const deleteSchema = z.object({ externalIds: z.array(z.string().min(1)).min(1).max(100) });

/**
 * Removes mirrored campaigns by externalId.
 *
 * Deliberately explicit rather than pruning anything absent from a sync: a
 * partial or failed sync would otherwise wipe a client's live report.
 */
export async function DELETE(request: Request) {
  try {
    if (!process.env.INGEST_SECRET) {
      return badRequest("Ingest is not configured — set INGEST_SECRET.");
    }
    if (!secretMatches(request.headers.get("x-ingest-secret"))) {
      return unauthorized("Invalid ingest secret.");
    }

    const { externalIds } = deleteSchema.parse(await request.json());
    const found = await prisma.campaign.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true, name: true },
    });

    // Metrics and clips go with it via the schema's cascade.
    const { count } = await prisma.campaign.deleteMany({
      where: { externalId: { in: externalIds } },
    });

    return ok({
      deleted: count,
      names: found.map((c) => c.name),
      missing: externalIds.filter((id) => !found.some((c) => c.externalId === id)),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.INGEST_SECRET) {
      return badRequest("Ingest is not configured — set INGEST_SECRET.");
    }
    if (!secretMatches(request.headers.get("x-ingest-secret"))) {
      return unauthorized("Invalid ingest secret.");
    }

    const { campaigns } = payloadSchema.parse(await request.json());

    let synced = 0;
    let linkOnly = 0;
    const unknownOwners: string[] = [];
    let systemUserId: string | null = null;

    /**
     * Holder for campaigns with no client account. Has no usable password and
     * is left unverified, so it can never be signed into — these campaigns are
     * reachable only through their signed share link.
     */
    async function systemOwner() {
      if (systemUserId) return systemUserId;
      const existing = await prisma.user.findUnique({
        where: { email: SYSTEM_EMAIL },
        select: { id: true },
      });
      if (existing) {
        systemUserId = existing.id;
        return systemUserId;
      }
      const created = await prisma.user.create({
        data: {
          email: SYSTEM_EMAIL,
          name: "Shared reports",
          passwordHash: randomBytes(32).toString("hex"),
          emailVerified: null,
        },
        select: { id: true },
      });
      systemUserId = created.id;
      return systemUserId;
    }

    for (const item of campaigns) {
      const email = item.ownerEmail?.toLowerCase() ?? "";
      const owner = email
        ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
        : null;

      if (email && !owner) unknownOwners.push(email);
      const ownerId = owner?.id ?? (await systemOwner());
      if (!owner) linkOnly += 1;

      const data = {
        userId: ownerId,
        name: item.name,
        brandName: item.brandName || item.name,
        status: item.status as CampaignStatus,
        budgetCents: item.budgetCents,
        spentCents: item.spentCents,
        totalViews: item.totalViews,
        estimatedReach: item.estimatedReach,
        clipCount: item.clipCount,
        platforms: item.platforms ?? [],
        description: item.description ?? null,
        startDate: item.startDate ? new Date(item.startDate) : null,
        endDate: item.endDate ? new Date(item.endDate) : null,
      };

      const campaign = await prisma.campaign.upsert({
        where: { externalId: item.externalId },
        create: { ...data, externalId: item.externalId },
        update: data,
      });

      // ── Why these are raw bulk INSERTs rather than prisma.upsert ──────────
      // They used to be a nested loop doing one upsert, and so one round trip
      // to Neon, per row. On the live dataset that is 5,484 clips + 473
      // metrics = 5,957 round trips in a single request. At the ~5ms a pooled
      // Neon round trip costs from a Vercel function that lands exactly on the
      // bot's 30s client timeout, and as the clip count grew it crossed it:
      // the bot logged "Couldn't reach the dashboard" with an empty error —
      // asyncio.TimeoutError stringifies to "" — while this route was still
      // happily working. Chunked, it is ~6 statements instead of ~6,000.
      //
      // "id" and "updatedAt" are written explicitly because Prisma generates
      // cuid() and @updatedAt in the client, not the database: those columns
      // are plain NOT NULL with no default, so a raw INSERT omitting them
      // fails. "createdAt" is deliberately absent from both the column list
      // and the DO UPDATE — it has a database default for new rows, and
      // touching it on conflict would reset the original creation time on
      // every sync.
      const now = new Date();

      const metricRows = lastPerKey(
        item.metrics
          .map((metric) => ({ ...metric, at: new Date(metric.date) }))
          .filter((metric) => !Number.isNaN(metric.at.getTime())),
        (metric) => String(metric.at.getTime()),
      );

      for (const part of chunk(metricRows, WRITE_CHUNK)) {
        const values = part.map(
          (m) => Prisma.sql`(${randomUUID()}, ${campaign.id}, ${m.at}, ${m.views}, ${m.reach}, ${m.spendCents})`,
        );
        await prisma.$executeRaw`
          INSERT INTO "CampaignMetric" ("id", "campaignId", "date", "views", "reach", "spendCents")
          VALUES ${Prisma.join(values)}
          ON CONFLICT ("campaignId", "date") DO UPDATE SET
            "views" = EXCLUDED."views",
            "reach" = EXCLUDED."reach",
            "spendCents" = EXCLUDED."spendCents"
        `;
      }

      const clipRows = lastPerKey(item.clips, (clip) => clip.externalId);

      for (const part of chunk(clipRows, WRITE_CHUNK)) {
        const values = part.map(
          (c) => Prisma.sql`(${randomUUID()}, ${campaign.id}, ${c.externalId}, ${c.url}, ${
            c.platform ?? ""
          }, ${c.handle ?? ""}, ${c.views}, ${now})`,
        );
        await prisma.$executeRaw`
          INSERT INTO "CampaignClip" ("id", "campaignId", "externalId", "url", "platform", "handle", "views", "updatedAt")
          VALUES ${Prisma.join(values)}
          ON CONFLICT ("campaignId", "externalId") DO UPDATE SET
            "url" = EXCLUDED."url",
            "platform" = EXCLUDED."platform",
            "handle" = EXCLUDED."handle",
            "views" = EXCLUDED."views",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
      }

      // A clip the bot no longer sends was removed or un-approved, so it has to
      // disappear from the client's report too rather than linger at its last
      // known view count. An empty list means every clip goes.
      const keep = item.clips.map((clip) => clip.externalId);
      await prisma.campaignClip.deleteMany({
        where: {
          campaignId: campaign.id,
          ...(keep.length > 0 ? { externalId: { notIn: keep } } : {}),
        },
      });

      synced += 1;
    }

    return ok({ synced, linkOnly, unknownOwners: [...new Set(unknownOwners)] });
  } catch (error) {
    return handleError(error);
  }
}
