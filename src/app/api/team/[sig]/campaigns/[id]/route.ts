import { z } from "zod";
import { teamSignatureValid } from "@/lib/share";
import { fetchCampaigns, updateCampaign } from "@/lib/bot";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Change one campaign from the team dashboard.
 *
 * Holds INGEST_SECRET server-side for the same reason the create route does:
 * it is what authorises writing to the bot, and a browser fetch would need it
 * in the page.
 *
 * Only the keys sent are written, so moving a campaign between boards cannot
 * disturb its rate or its copy.
 */
const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  budget: z.coerce.number().min(0).optional(),
  min_views: z.coerce.number().int().min(0).optional(),
  max_views: z.coerce.number().int().min(0).optional(),
  max_clips_per_account: z.coerce.number().int().min(0).max(500).optional(),
  rate_amount: z.coerce.number().positive().optional(),
  platform: z.string().trim().max(40).optional(),
  artist: z.string().trim().max(200).optional(),
  details: z.string().trim().max(2000).optional(),
  rules: z.string().trim().max(2000).optional(),
  brief_url: z.string().trim().max(500).optional(),
  image_url: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
  paid_ads: z.boolean().optional(),
});

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

    const patch = schema.parse(await request.json());
    if (Object.keys(patch).length === 0) return badRequest("Nothing to change.");

    // ── Moving a campaign onto the Ads board needs rules ──
    // Same rule as creating one, and it has to be re-checked here because
    // this is the other way onto that board. A campaign flagged paid-ads with
    // nothing written about spend tells clippers a rate assumes money behind
    // the clip without saying how much — they find out by spending it.
    //
    // Checked against what the campaign already has when the patch doesn't
    // carry rules itself, so flipping the toggle on a campaign that already
    // documents its spend just works.
    if (patch.paid_ads === true) {
      let rules = patch.rules?.trim() ?? "";
      if (!rules) {
        try {
          const { campaigns } = await fetchCampaigns();
          rules = (campaigns.find((c) => c.id === campaignId)?.rules ?? "").trim();
        } catch {
          // If the bot can't be reached we cannot prove the campaign is safe
          // to move, and guessing in the permissive direction is what puts an
          // undocumented paid-ads campaign in front of people.
          return serverError("Couldn't reach the bot to check the campaign's rules.");
        }
      }
      if (!rules) {
        return badRequest(
          "This campaign has no rules yet. Paid-ad campaigns need them — they're where the required spend is stated.",
        );
      }
    }

    try {
      return ok(await updateCampaign(campaignId, patch));
    } catch (error) {
      return serverError(
        error instanceof Error ? error.message : "The bot refused the change.",
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
