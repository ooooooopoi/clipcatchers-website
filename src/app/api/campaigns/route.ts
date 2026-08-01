import type { CampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { campaignSchema } from "@/lib/validations";
import { handleError, ok, unauthorized } from "@/lib/api";

const STATUSES: CampaignStatus[] = [
  "PENDING",
  "APPROVED",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();
    const status = searchParams.get("status") as CampaignStatus | null;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? 9));

    const where: Prisma.CampaignWhereInput = {
      userId: user.id,
      ...(status && STATUSES.includes(status) ? { status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { brandName: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.campaign.count({ where }),
    ]);

    return ok({ campaigns, total, page, pageSize });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = campaignSchema.parse(await request.json());

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        brandName: body.brandName.trim(),
        brandLogoUrl: body.brandLogoUrl || null,
        website: body.website || null,
        discord: body.discord || null,
        description: body.description || null,
        goal: body.goal || null,
        notes: body.notes || null,
        budgetCents: Math.round(body.budget * 100),
        platforms: body.platforms,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    // Attach any assets uploaded during the wizard.
    if (body.fileIds?.length) {
      await prisma.fileAsset.updateMany({
        where: { id: { in: body.fileIds }, userId: user.id },
        data: { campaignId: campaign.id },
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Campaign submitted",
        body: `${campaign.name} is in review. We'll let you know the moment it's approved.`,
        link: `/campaigns/${campaign.id}`,
      },
    });

    return ok({ campaign }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
