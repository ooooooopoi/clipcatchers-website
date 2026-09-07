import { z } from "zod";
import { clipperSignatureValid } from "@/lib/share";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  url: z.string().min(1).max(2000),
  platform: z.enum(["TikTok", "Instagram"]),
  campaignId: z.number().int().positive(),
  // Optional: only needed when the clipper has more than one account on the
  // platform, in which case the bot refuses to guess.
  accountId: z.number().int().positive().optional(),
});

/**
 * A clipper submitting a clip.
 *
 * Everything that decides whether the clip is real happens on the bot — URL
 * shape, whether they have a verified account on that platform, and whether
 * one of those accounts actually posted it. None of that is repeated here,
 * deliberately: a second implementation of the ownership check is a second
 * thing to keep in step, and the moment the two disagree the weaker one is
 * the one that matters.
 *
 * As with withdraw, userId comes from the signed path and never from the body.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string; sig: string }> },
) {
  try {
    const { userId, sig } = await params;
    if (!clipperSignatureValid(userId, sig)) return unauthorized("Invalid clipper link.");

    const botUrl = process.env.BOT_URL || "https://worker-production-b401.up.railway.app";
    const secret = process.env.INGEST_SECRET;
    if (!secret) {
      return badRequest("INGEST_SECRET isn't configured, so clips can't be submitted from here.");
    }

    const { url, platform, campaignId, accountId } = schema.parse(await request.json());

    const res = await fetch(`${botUrl.replace(/\/+$/, "")}/api/clips/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
      body: JSON.stringify({
        user_id: userId,
        campaign_id: campaignId,
        platform,
        url,
        account_id: accountId ?? null,
      }),
      cache: "no-store",
    });

    const body = await res.json().catch(() => ({}));

    // 409 carries the two cases the form has to handle rather than just
    // report: no verified account on that platform (`needs_account`, which
    // only Discord can fix), and more than one account to choose between
    // (`accounts`, which the form turns into a picker). Both are forwarded
    // whole so the page can tell them apart.
    if (res.status === 409) {
      return Response.json(
        { error: body.error ?? "That submission was refused.", ...body },
        { status: 409 },
      );
    }
    if (!res.ok) return serverError(body.error ?? "The bot rejected the submission.");

    return ok(body);
  } catch (error) {
    return handleError(error);
  }
}
