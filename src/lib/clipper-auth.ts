import { auth } from "@/auth";
import { clipperSignatureValid } from "@/lib/share";

/**
 * Who is allowed to act as a clipper, and how sure we need to be.
 *
 * ── Two levels, deliberately ─────────────────────────────────────────────
 * Reading a clipper's own pages is authenticated by the signature in the URL.
 * That is right for reading: it proves the link was minted for them, and the
 * pages behind it expose nothing a thief could use.
 *
 * Some actions need more. The link arrives in a DM and then lives in browser
 * history, screenshots, and anywhere it was ever forwarded — and it never
 * expires. So anything that moves money, or hands over a credential, or
 * destroys earnings additionally requires a Discord sign-in whose snowflake
 * matches the clipper whose page it is.
 *
 * Collected here rather than repeated per route because the difference between
 * the two levels is easy to get wrong by omission, and the omission is silent:
 * a route that forgets the session check still works perfectly for the
 * legitimate owner.
 */
export type ClipperAuth =
  | { ok: true; userId: string; sig: string }
  | { ok: false; status: number; error: string };

/** Signature only. For reads and for anything harmless to replay. */
export function checkSignature(userId: string, sig: string): ClipperAuth {
  if (!clipperSignatureValid(userId, sig)) {
    return { ok: false, status: 401, error: "Invalid clipper link." };
  }
  return { ok: true, userId, sig };
}

/**
 * Signature *and* a matching Discord session. For money, credentials, and
 * anything irreversible.
 */
export async function requireClipperSession(
  userId: string,
  sig: string,
): Promise<ClipperAuth> {
  const base = checkSignature(userId, sig);
  if (!base.ok) return base;

  const session = await auth();
  if (!session?.user?.discordId) {
    return { ok: false, status: 401, error: "Sign in with Discord to do that." };
  }
  // String comparison on purpose. These are snowflakes, which exceed JS's safe
  // integer range — comparing them as numbers makes neighbouring accounts
  // equal, on the check deciding whose money and credentials these are.
  if (session.user.discordId !== userId) {
    return { ok: false, status: 401, error: "That link belongs to a different account." };
  }
  return { ok: true, userId, sig };
}

/** Server-side call to the bot. The secret never reaches the browser. */
export async function botFetch(path: string, init?: RequestInit) {
  const botUrl = process.env.BOT_URL || "https://worker-production-b401.up.railway.app";
  const secret = process.env.INGEST_SECRET;
  if (!secret) throw new Error("INGEST_SECRET isn't configured.");

  const res = await fetch(`${botUrl.replace(/\/+$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-ingest-secret": secret,
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { res, body } as { res: Response; body: Record<string, unknown> };
}
