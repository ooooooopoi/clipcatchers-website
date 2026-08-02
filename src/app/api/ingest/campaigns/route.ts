import { randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import type { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const SYSTEM_EMAIL = "shared-reports@clipcatchers.local";

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

      for (const metric of item.metrics) {
        const date = new Date(metric.date);
        if (Number.isNaN(date.getTime())) continue;
        await prisma.campaignMetric.upsert({
          where: { campaignId_date: { campaignId: campaign.id, date } },
          create: {
            campaignId: campaign.id,
            date,
            views: metric.views,
            reach: metric.reach,
            spendCents: metric.spendCents,
          },
          update: { views: metric.views, reach: metric.reach, spendCents: metric.spendCents },
        });
      }

      for (const clip of item.clips) {
        const clipData = {
          url: clip.url,
          platform: clip.platform ?? "",
          handle: clip.handle ?? "",
          views: clip.views,
        };
        await prisma.campaignClip.upsert({
          where: {
            campaignId_externalId: { campaignId: campaign.id, externalId: clip.externalId },
          },
          create: { campaignId: campaign.id, externalId: clip.externalId, ...clipData },
          update: clipData,
        });
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
