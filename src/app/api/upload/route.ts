import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { ACCEPTED_MIME, kindFor, MAX_UPLOAD_BYTES, saveUpload } from "@/lib/storage";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const form = await request.formData();
    const file = form.get("file");
    const campaignId = form.get("campaignId");
    const ticketId = form.get("ticketId");
    const kindOverride = form.get("kind");

    if (!(file instanceof File)) return badRequest("No file was uploaded.");
    if (file.size === 0) return badRequest("That file is empty.");
    if (file.size > MAX_UPLOAD_BYTES) {
      return badRequest(`Files must be under ${process.env.MAX_UPLOAD_MB ?? 50}MB.`);
    }
    if (file.type && !ACCEPTED_MIME.includes(file.type)) {
      return badRequest("That file type isn't supported.");
    }

    // Only attach to records the caller actually owns.
    let ownedCampaignId: string | null = null;
    if (typeof campaignId === "string" && campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId: user.id },
        select: { id: true },
      });
      ownedCampaignId = campaign?.id ?? null;
    }

    let ownedTicketId: string | null = null;
    if (typeof ticketId === "string" && ticketId) {
      const ticket = await prisma.supportTicket.findFirst({
        where: { id: ticketId, userId: user.id },
        select: { id: true },
      });
      ownedTicketId = ticket?.id ?? null;
    }

    const { key, size } = await saveUpload(file);

    const asset = await prisma.fileAsset.create({
      data: {
        userId: user.id,
        campaignId: ownedCampaignId,
        ticketId: ownedTicketId,
        name: file.name.slice(0, 200),
        storageKey: key,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: size,
        kind:
          kindOverride === "LOGO" || kindOverride === "BRAND_KIT"
            ? kindOverride
            : kindFor(file.type, file.name),
      },
    });

    return ok({ file: { ...asset, url: `/api/files/${asset.id}/raw` } }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
