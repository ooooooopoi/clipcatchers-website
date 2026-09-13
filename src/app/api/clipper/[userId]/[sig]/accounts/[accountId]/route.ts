import { botFetch, requireClipperSession } from "@/lib/clipper-auth";
import { handleError, notFound, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Remove one of a clipper's own accounts.
 *
 * Needs a Discord session because this is irreversible and expensive: removing
 * an account cascades to its clips, and to the earnings on them. A leaked link
 * should not be able to delete somebody's work.
 *
 * The bot scopes the delete to the owner in SQL as well, so a mismatched id
 * removes nothing rather than removing theirs — two checks because the cost of
 * this one being wrong is a clipper's history.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string; sig: string; accountId: string }> },
) {
  try {
    const { userId, sig, accountId } = await params;
    const gate = await requireClipperSession(userId, sig);
    if (!gate.ok) return unauthorized(gate.error);

    if (!/^\d+$/.test(accountId)) return notFound("No such account.");

    const { res, body } = await botFetch(
      `/api/users/${encodeURIComponent(userId)}/accounts/${accountId}`,
      { method: "DELETE" },
    );

    if (res.status === 404) return notFound((body.error as string) ?? "No such account.");
    if (!res.ok) return serverError((body.error as string) ?? "Couldn't remove it.");
    return ok(body);
  } catch (error) {
    return handleError(error);
  }
}
