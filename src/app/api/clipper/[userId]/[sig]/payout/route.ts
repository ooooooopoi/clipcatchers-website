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
 * The user id — only ever the one from the signed path, never the body, since
 * a signature proves the id it was minted for and nothing else — and an
 * optional amount.
 *
 * The amount is the only caller-supplied field, and it can only ever *reduce*
 * what moves: the bot refuses anything above the settled balance and then
 * settles whole clips adding up to no more than the request. No address and no
 * destination are accepted, so where the money goes is still read from the
 * database on the bot's side and there is no field here that could redirect or
 * inflate a payment.
 */
export async function POST(
  request: Request,
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

    // A partial withdrawal. Absent means "everything settled", which is what
    // the button sends when the field is left blank — so an unparseable body
    // is treated as absent rather than refused.
    const payload = (await request.json().catch(() => ({}))) as { amount?: unknown };
    let amount: number | undefined;
    if (payload.amount !== undefined && payload.amount !== null && payload.amount !== "") {
      const parsed = Number(payload.amount);
      // Number("") is 0 and Number("abc") is NaN; both would otherwise reach
      // the bot as a request to move a nonsense sum.
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return badRequest("Enter an amount greater than zero, or leave it blank.");
      }
      amount = Math.round(parsed * 100) / 100;
    }

    const res = await fetch(
      `${botUrl.replace(/\/+$/, "")}/api/users/${encodeURIComponent(userId)}/withdraw`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
        body: JSON.stringify(amount === undefined ? {} : { amount }),
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
