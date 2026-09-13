import { botFetch, requireClipperSession } from "@/lib/clipper-auth";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Set where a clipper is paid.
 *
 * Needs a Discord session, not just the signed link. Changing a payout address
 * is the one action that could redirect somebody else's money — every other
 * route is safe against a leaked link precisely because funds can only ever go
 * to the address registered here.
 *
 * The bot validates the value with the same function /set-payout uses, so this
 * passes it straight through rather than second-guessing the format.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string; sig: string }> },
) {
  try {
    const { userId, sig } = await params;
    const gate = await requireClipperSession(userId, sig);
    if (!gate.ok) return unauthorized(gate.error);

    const body = (await request.json().catch(() => ({}))) as {
      method?: string;
      address?: string;
    };

    const { res, body: out } = await botFetch(
      `/api/users/${encodeURIComponent(userId)}/payout-method`,
      {
        method: "POST",
        body: JSON.stringify({ method: body.method, address: body.address }),
      },
    );

    // 400 is the validator saying the address is wrong, which is an answer for
    // the clipper rather than a fault — passed through so they see why.
    if (res.status === 400) return badRequest((out.error as string) ?? "That address isn't valid.");
    if (!res.ok) return serverError((out.error as string) ?? "Couldn't save that.");
    return ok(out);
  } catch (error) {
    return handleError(error);
  }
}
