import { teamSignatureValid } from "@/lib/share";
import { uploadCampaignImage } from "@/lib/bot";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Upload a campaign's banner from the team dashboard.
 *
 * The file goes to the bot, which keeps it and serves it from its own
 * address — so the card's banner stops depending on a Discord attachment
 * link, which expires within a day. The bot checks it really is an image.
 *
 * 4 MB because a Vercel function won't take a request body much over 4.5 MB;
 * a banner never needs more.
 */
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sig: string; id: string }> },
) {
  try {
    const { sig, id } = await params;
    if (!teamSignatureValid(sig)) return unauthorized("Invalid team link.");

    const campaignId = Number(id);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return badRequest("That isn't a campaign id.");
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("image");
    if (!(file instanceof File) || file.size === 0) return badRequest("Pick an image to upload.");
    if (file.size > MAX_BYTES) return badRequest("That image is too big — 4 MB at most.");

    try {
      return ok(await uploadCampaignImage(campaignId, await file.arrayBuffer(), file.type));
    } catch (error) {
      return serverError(error instanceof Error ? error.message : "The bot refused the image.");
    }
  } catch (error) {
    return handleError(error);
  }
}
