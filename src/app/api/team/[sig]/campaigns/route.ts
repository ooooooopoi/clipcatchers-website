import { z } from "zod";
import { teamSignatureValid } from "@/lib/share";
import { createCampaign } from "@/lib/bot";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Create a campaign from the team dashboard.
 *
 * The form posts here rather than at the bot directly, for one reason:
 * INGEST_SECRET. It is what authorises writing to the bot, and a fetch made
 * from the browser would need it in the page — which puts it in the bundle,
 * in devtools, and in anyone's hands. This route holds it server-side and the
 * browser only ever proves the team signature it already has in its URL.
 *
 * Validation is deliberately repeated here rather than left to the bot. The
 * bot's checks are the ones that protect the database; these are the ones
 * that produce a message a person can act on, which is a different job —
 * "rate must be positive" beats a 400 with no field named.
 */
const schema = z.object({
  name: z.string().trim().min(2, "Give the campaign a name").max(120),
  rate_amount: z.coerce.number().positive("Rate must be more than $0"),
  rate_per_views: z.coerce.number().int().positive(),
  min_views: z.coerce.number().int().min(0).default(0),
  max_views: z.coerce.number().int().min(0).default(0),
  budget: z.coerce.number().min(0).default(0),
  category: z.string().trim().max(60).default(""),
  platform: z.string().trim().max(40).default(""),
  artist: z.string().trim().max(160).default(""),
  brief_url: z.string().trim().max(500).default(""),
  image_url: z.string().trim().max(500).default(""),
  details: z.string().trim().max(4000).default(""),
  rules: z.string().trim().max(4000).default(""),
  paid_ads: z.boolean().default(false),
});

export async function POST(request: Request, { params }: { params: Promise<{ sig: string }> }) {
  try {
    const { sig } = await params;
    // Same refusal as every other team route: the signature is the whole
    // credential, so a wrong one is not a partial permission.
    if (!teamSignatureValid(sig)) return unauthorized("Invalid team link.");

    const body = schema.parse(await request.json());

    // A paid-ads campaign without rules is the one combination worth blocking
    // rather than warning about. The rate on these assumes the clipper is
    // spending money, and the rules are the only place that says how much —
    // publishing one without them invites people to spend against a number
    // nobody defined, which costs them real money to find out.
    //
    // 400 and not 500: this is the caller's mistake, and answering a missing
    // field with a server error both blames the wrong side and puts a routine
    // form validation into whatever watches for real failures.
    if (body.paid_ads && !body.rules.trim()) {
      return badRequest(
        "A paid-ad campaign needs rules — they're where the required spend is stated.",
      );
    }

    try {
      return ok(await createCampaign(body));
    } catch (error) {
      return serverError(
        error instanceof Error ? error.message : "The bot refused to create it.",
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
