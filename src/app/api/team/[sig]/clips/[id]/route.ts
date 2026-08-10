import { z } from "zod";
import { teamSignatureValid } from "@/lib/share";
import { badRequest, handleError, notFound, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["approved", "rejected", "pending"]) });

/**
 * Approve or reject a clip from the team dashboard.
 *
 * The clip lives in the bot's database, so this forwards to the bot's own
 * endpoint. The shared secret stays server-side here and is never exposed to
 * the browser; the caller proves access with the team signature in the path.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sig: string; id: string }> },
) {
  try {
    const { sig, id } = await params;
    if (!teamSignatureValid(sig)) return unauthorized("Invalid team link.");

    // The bot's address isn't a secret — INGEST_SECRET is what guards it — so
    // it falls back to the known deployment rather than leaving the buttons
    // dead until an env var is set.
    const botUrl = process.env.BOT_URL || "https://worker-production-b401.up.railway.app";
    const secret = process.env.INGEST_SECRET;
    if (!secret) {
      return badRequest("INGEST_SECRET isn't configured, so clips can't be updated from here.");
    }

    const { status } = schema.parse(await request.json());

    const res = await fetch(`${botUrl.replace(/\/+$/, "")}/api/clips/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });

    const body = await res.json().catch(() => ({}));
    if (res.status === 404) return notFound("Clip not found.");
    if (!res.ok) return serverError(body.error ?? "The bot rejected the update.");

    return ok(body);
  } catch (error) {
    return handleError(error);
  }
}
