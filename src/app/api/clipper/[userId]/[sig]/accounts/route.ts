import { botFetch, requireClipperSession } from "@/lib/clipper-auth";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Register a posting account.
 *
 * Needs a Discord session rather than the signed link alone, because the
 * response contains the verification code. That code is the whole proof that a
 * profile belongs to the person claiming it — put it behind a URL that can be
 * forwarded and anyone holding the link could claim somebody else's account
 * and start earning from their posts.
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
      platform?: string;
      handle?: string;
    };

    const { res, body: out } = await botFetch(
      `/api/users/${encodeURIComponent(userId)}/accounts`,
      { method: "POST", body: JSON.stringify(body) },
    );

    if (res.status === 400) return badRequest((out.error as string) ?? "That handle isn't valid.");
    // 409 is "somebody already registered that", which is a thing to tell them
    // about rather than a server problem.
    if (res.status === 409) return badRequest((out.error as string) ?? "Already registered.");
    if (!res.ok) return serverError((out.error as string) ?? "Couldn't register that.");
    return ok(out);
  } catch (error) {
    return handleError(error);
  }
}
