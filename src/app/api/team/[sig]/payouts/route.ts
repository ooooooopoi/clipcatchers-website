import { z } from "zod";
import { teamSignatureValid } from "@/lib/share";
import { markPaid } from "@/lib/bot";
import { handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

// userId is a string: a Discord snowflake doesn't survive a JSON number.
const schema = z.object({
  userId: z.string().regex(/^\d+$/),
  campaignId: z.number().int().nullable().optional(),
  paid: z.boolean().optional(),
});

/** Mark a clipper's owed clips paid. Proven by the team signature in the path. */
export async function POST(request: Request, { params }: { params: Promise<{ sig: string }> }) {
  try {
    const { sig } = await params;
    if (!teamSignatureValid(sig)) return unauthorized("Invalid team link.");

    const { userId, campaignId, paid } = schema.parse(await request.json());
    try {
      return ok(await markPaid(userId, campaignId ?? undefined, paid ?? true));
    } catch (error) {
      return serverError(error instanceof Error ? error.message : "The bot rejected the update.");
    }
  } catch (error) {
    return handleError(error);
  }
}
