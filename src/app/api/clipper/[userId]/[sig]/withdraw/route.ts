import { z } from "zod";
import { clipperSignatureValid } from "@/lib/share";
import { badRequest, handleError, notFound, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ clipId: z.number().int().positive() });

/**
 * A clipper taking one of their own clips down.
 *
 * The signature in the path is the whole of the authentication, so it is
 * re-checked here rather than trusted from the page that rendered the button —
 * a POST is a URL like any other and arrives without whatever the page knew.
 *
 * userId comes from the path too, never from the body. Taking it from the body
 * would let anyone holding one valid signature withdraw against any id they
 * cared to type, since the signature only ever proves the id it was minted
 * for.
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
      return badRequest("INGEST_SECRET isn't configured, so clips can't be withdrawn from here.");
    }

    const { clipId } = schema.parse(await request.json());

    const res = await fetch(`${botUrl.replace(/\/+$/, "")}/api/clips/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
      body: JSON.stringify({ clip_id: clipId, user_id: userId }),
      cache: "no-store",
    });

    const body = await res.json().catch(() => ({}));
    if (res.status === 404) return notFound(body.error ?? "Clip not found.");
    // 409 is the bot saying the clip's state forbids it — paid, locked, or
    // already withdrawn. Passed through as-is so the page can show the reason
    // rather than a generic failure.
    if (res.status === 409) return badRequest(body.error ?? "That clip can't be withdrawn.");
    if (!res.ok) return serverError(body.error ?? "The bot rejected the withdrawal.");

    return ok(body);
  } catch (error) {
    return handleError(error);
  }
}
