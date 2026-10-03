import { botFetch, requireClipperSession } from "@/lib/clipper-auth";
import { handleError, notFound, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Check my bio: look for the clipper's code in one of their accounts' bios,
 * and verify the account if it's there. The bot runs the same check as
 * /verify-account, with the same cooldown.
 *
 * Needs the owner's Discord session, as adding does. Every answer carries the
 * code, and the code is the proof the profile is theirs.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string; sig: string; accountId: string }> },
) {
  try {
    const { userId, sig, accountId } = await params;
    const gate = await requireClipperSession(userId, sig);
    if (!gate.ok) return unauthorized(gate.error);

    if (!/^\d+$/.test(accountId)) return notFound("No such account.");

    const { res, body } = await botFetch(
      `/api/users/${encodeURIComponent(userId)}/accounts/${accountId}/verify`,
      { method: "POST" },
    );

    if (res.status === 404) return notFound((body.error as string) ?? "No such account.");
    // Checked too recently (429), or checking is down (503): passed through
    // with the bot's message, so the page can say what to do next.
    if (res.status === 429 || res.status === 503) return Response.json(body, { status: res.status });
    if (!res.ok) return serverError((body.error as string) ?? "Couldn't check right now.");
    return ok(body);
  } catch (error) {
    return handleError(error);
  }
}
