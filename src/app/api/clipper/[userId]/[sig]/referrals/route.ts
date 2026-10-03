import { BotUnavailable, fetchClipperReferrals } from "@/lib/bot";
import { checkSignature } from "@/lib/clipper-auth";
import { handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * A clipper's referral link and its terms, for the Invite friends button on a
 * phone (MobileActions), fetched when the panel opens.
 *
 * The signed link is enough, as it is for the Referrals page showing the same
 * link: it's theirs to hand out, and nothing here moves money or hands over a
 * credential. The bot makes the link on the first ask and gives back the same
 * one after, so opening the panel twice doesn't make two.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; sig: string }> },
) {
  try {
    const { userId, sig } = await params;
    const gate = checkSignature(userId, sig);
    if (!gate.ok) return unauthorized(gate.error);

    const data = await fetchClipperReferrals(userId);
    return ok({
      link: data.link,
      problem: data.problem,
      share_percent: data.share_percent,
      window_days: data.window_days,
    });
  } catch (error) {
    if (error instanceof BotUnavailable) {
      return serverError("Can't reach the bot right now. Try again in a minute.");
    }
    return handleError(error);
  }
}
