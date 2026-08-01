import { timingSafeEqual } from "crypto";
import { z } from "zod";
import type { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

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

const campaignSchema = z.object({
  externalId: z.string().min(1),
  ownerEmail: z.string().email(),
  name: z.string().min(1).max(200),
  brandName: z.string().max(200).default(""),
  status: z
    .enum(["PENDING", "APPROVED", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])
    .default("RUNNING"),
  budgetCents: z.number().int().min(0).default(0),
  spentCents: z.number().int().min(0).default(0),
  totalViews: z.number().int().min(0).default(0),
  estimatedReach: z.number().int().min(0).default(0),
  platforms: z.array(z.string()).default([]),
  description: z.string().max(4000).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  metrics: z.array(metricSchema).max(400).default([]),
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
    const skipped: string[] = [];

    for (const item of campaigns) {
      const owner = await prisma.user.findUnique({
        where: { email: item.ownerEmail.toLowerCase() },
        select: { id: true },
      });
      if (!owner) {
        skipped.push(item.ownerEmail);
        continue;
      }

      const data = {
        userId: owner.id,
        name: item.name,
        brandName: item.brandName || item.name,
        status: item.status as CampaignStatus,
        budgetCents: item.budgetCents,
        spentCents: item.spentCents,
        totalViews: item.totalViews,
        estimatedReach: item.estimatedReach,
        platforms: item.platforms,
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

      synced += 1;
    }

    return ok({ synced, skippedUnknownOwners: [...new Set(skipped)] });
  } catch (error) {
    return handleError(error);
  }
}
