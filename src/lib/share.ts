import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signature for a public per-campaign link. Derived from INGEST_SECRET so the
 * Discord bot can mint the same URL without calling the dashboard.
 *
 * Must stay identical to the bot's client_link_token() in cogs/client_sync.py.
 */
export function shareSignature(externalId: string) {
  const secret = process.env.INGEST_SECRET ?? "";
  if (!secret) return null;
  return createHmac("sha256", secret).update(`share:${externalId}`).digest("hex").slice(0, 24);
}

export function shareSignatureValid(externalId: string, provided: string) {
  const expected = shareSignature(externalId);
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function shareUrl(externalId: string) {
  const sig = shareSignature(externalId);
  if (!sig) return null;
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000")
    .replace(/\/+$/, "");
  return `${base}/c/${encodeURIComponent(externalId)}/${sig}`;
}
