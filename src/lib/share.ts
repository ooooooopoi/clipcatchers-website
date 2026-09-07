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

/** Signature for the internal team view. Mirrors the bot's team_link_token(). */
export function teamSignature() {
  const secret = process.env.INGEST_SECRET ?? "";
  if (!secret) return null;
  return createHmac("sha256", secret).update("team").digest("hex").slice(0, 24);
}

export function teamSignatureValid(provided: string) {
  const expected = teamSignature();
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Signature for one clipper's own page. Mirrors the bot's
 * clipper_link_token() in cogs/client_sync.py.
 *
 * The id in the URL is a Discord snowflake and must stay a string the whole
 * way through. As a JSON number it becomes a double in the browser and loses
 * its last digits, so the id that comes back matches nobody — the same trap
 * already documented on OwedClipper in lib/bot.ts.
 *
 * Scoped with a "clipper:" prefix like the others, so a token minted for one
 * purpose can never be replayed against another. Without the prefix a
 * campaign's externalId that happened to equal a user id would open a
 * clipper's earnings.
 */
export function clipperSignature(userId: string) {
  const secret = process.env.INGEST_SECRET ?? "";
  if (!secret) return null;
  return createHmac("sha256", secret).update(`clipper:${userId}`).digest("hex").slice(0, 24);
}

export function clipperSignatureValid(userId: string, provided: string) {
  const expected = clipperSignature(userId);
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function clipperUrl(userId: string) {
  const sig = clipperSignature(userId);
  if (!sig) return null;
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000")
    .replace(/\/+$/, "");
  return `${base}/clipper/${encodeURIComponent(userId)}/${sig}`;
}

export function shareUrl(externalId: string) {
  const sig = shareSignature(externalId);
  if (!sig) return null;
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000")
    .replace(/\/+$/, "");
  return `${base}/c/${encodeURIComponent(externalId)}/${sig}`;
}
