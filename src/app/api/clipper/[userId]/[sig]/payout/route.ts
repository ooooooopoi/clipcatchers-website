import { auth } from "@/auth";
import { clipperSignatureValid } from "@/lib/share";
import { badRequest, handleError, ok, serverError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * A clipper withdrawing their own settled balance.
 *
 * ── Why this needs a session and the rest of the page does not ───────────
 * Everything else under /clipper is authenticated by the signature in the URL,
 * which is fine for reading: it proves the link was minted for that clipper and
 * the pages behind it expose nothing a thief could use.
 *
 * Moving money is a different question. That link is sent in a DM, and it lives
 * in browser history, screenshots and anywhere it was ever forwarded. It never
 * expires. So this one action additionally requires a Discord sign-in whose
 * snowflake matches the clipper the page belongs to.
 *
 * That is not the only thing standing between a leaked link and a loss — funds
 * can only go to the address registered through /set-payout in Discord, so even
 * the signature alone could not redirect them, and the worst case would be a
 * forced early payout to the rightful owner. The session is what makes it not
 * happen at all.
 *
 * ── What is sent to the bot ──────────────────────────────────────────────
 * Only the user id, and only the one from the signed path. No amount, no
 * address, no destination: what is owed and where it goes are read from the
 * database on the bot's side. There is therefore no field here an attacker
 * could use to redirect or inflate a payment.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string; sig: string }> },
) {
  try {
    const { userId, sig } = await params;
    // Re-checked rather than trusted from the page that rendered the button: a
    // POST is a URL like any other and arrives without whatever the page knew.
    if (!clipperSignatureValid(userId, sig)) return unauthorized("Invalid clipper link.");

    const session = await auth();
    if (!session?.user?.discordId) {
      return unauthorized("Sign in with Discord to withdraw.");
    }
    // String comparison on purpose. These are snowflakes, which exceed JS's
    // safe integer range — comparing them as numbers would make neighbouring
    // ids equal, and this is the check deciding whose money moves.
    if (session.user.discordId !== userId) {
      return unauthorized("That link belongs to a different account.");
    }

    const botUrl = process.env.BOT_URL || "https://worker-production-b401.up.railway.app";
    const secret = process.env.INGEST_SECRET;
    if (!secret) {
      return badRequest("Payouts aren't configured on this deployment.");
    }

    const res = await fetch(
      `${botUrl.replace(/\/+$/, "")}/api/users/${encodeURIComponent(userId)}/withdraw`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
        cache: "no-store",
      },
    );

    const body = await res.json().catch(() => ({}));
    if (!res.ok) return serverError(body.error ?? "The bot rejected the withdrawal.");

    // A refusal from withdraw_for is a 200 with ok:false and a code — below the
    // minimum, nothing released, no payout method. Those are answers, not
    // failures, and the page words them for the clipper.
    return ok(body);
  } catch (error) {
    return handleError(error);
  }
}
