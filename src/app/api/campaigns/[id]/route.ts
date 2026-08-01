import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { campaignUpdateSchema } from "@/lib/validations";
import { badRequest, handleError, notFound, ok, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Clients may move a campaign between these states themselves. */
const CLIENT_TRANSITIONS: Record<string, string[]> = {
  RUNNING: ["PAUSED", "CANCELLED"],
  PAUSED: ["RUNNING", "CANCELLED"],
  APPROVED: ["PAUSED", "CANCELLED"],
  PENDING: ["CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: { metrics: { orderBy: { date: "asc" } }, files: true },
    });
    if (!campaign) return notFound("Campaign not found.");

    return ok({ campaign });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound("Campaign not found.");

    const body = campaignUpdateSchema.parse(await request.json());

    if (body.status && body.status !== existing.status) {
      const allowed = CLIENT_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(body.status) && user.role !== "ADMIN") {
        return badRequest(
          `A ${existing.status.toLowerCase()} campaign can't be moved to ${body.status.toLowerCase()}.`,
        );
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.brandName !== undefined ? { brandName: body.brandName.trim() } : {}),
        ...(body.brandLogoUrl !== undefined ? { brandLogoUrl: body.brandLogoUrl || null } : {}),
        ...(body.website !== undefined ? { website: body.website || null } : {}),
        ...(body.discord !== undefined ? { discord: body.discord || null } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.goal !== undefined ? { goal: body.goal || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        ...(body.budget !== undefined ? { budgetCents: Math.round(body.budget * 100) } : {}),
        ...(body.platforms !== undefined ? { platforms: body.platforms } : {}),
        ...(body.startDate !== undefined
          ? { startDate: body.startDate ? new Date(body.startDate) : null }
          : {}),
        ...(body.endDate !== undefined
          ? { endDate: body.endDate ? new Date(body.endDate) : null }
          : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });

    if (body.status && body.status !== existing.status) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: body.status === "COMPLETED" ? "CAMPAIGN_COMPLETED" : "SYSTEM",
          title: `${campaign.name} ${body.status.toLowerCase()}`,
          body: `The campaign is now ${body.status.toLowerCase()}.`,
          link: `/campaigns/${campaign.id}`,
        },
      });
    }

    return ok({ campaign });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound("Campaign not found.");

    // Only a campaign that never launched can be removed outright.
    if (existing.status !== "PENDING" && user.role !== "ADMIN") {
      return badRequest("Only pending campaigns can be deleted. Cancel it instead.");
    }

    await prisma.campaign.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
