import { z } from "zod";
import { teamSignatureValid } from "@/lib/share";
import { markPaid } from "@/lib/bot";
import { handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.number().int(),
  campaignId: z.number().int().nullable().optional(),
});

/** Mark a clipper's owed clips paid. Proven by the team signature in the path. */
export async function POST(request: Request, { params }: { params: Promise<{ sig: string }> }) {
  try {
    const { sig } = await params;
    if (!teamSignatureValid(sig)) return unauthorized("Invalid team link.");

    const { userId, campaignId } = schema.parse(await request.json());
    try {
      return ok(await markPaid(userId, campaignId ?? undefined));
    } catch (error) {
      return serverError(error instanceof Error ? error.message : "The bot rejected the update.");
    }
  } catch (error) {
    return handleError(error);
  }
}
