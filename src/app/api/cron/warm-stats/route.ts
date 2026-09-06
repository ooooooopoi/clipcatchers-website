import { timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { getPublicStats } from "@/lib/public-stats";

export const dynamic = "force-dynamic";

/**
 * Forces the public stats cache to refresh.
 *
 * `unstable_cache` is lazy: the entry lives for an hour, but nothing goes and
 * fetches a new one when it expires — the next request to arrive pays for the
 * refresh. On a marketing site with quiet nights that means the figure can sit
 * untouched for as long as nobody visits, which is exactly when the homepage's
 * ticking counter has the least real data to stand on. Measured on production
 * it held one value for hours.
 *
 * Called on a schedule, this keeps the figure fresh whether or not anyone is
 * looking, so the counter's projection is bridging minutes rather than a whole
 * night. The homepage is correct without it — Proof projects across the gap —
 * but the smaller the gap, the less of the number is estimated.
 *
 * Auth matches the ingest route: a shared secret, constant-time compared,
 * because the caller is a service and this costs two database queries. Vercel
 * Cron sends `Authorization: Bearer $CRON_SECRET`; the `x-cron-secret` header
 * is accepted too so an external pinger can call it without pretending to be
 * a bearer token.
 */
function secretMatches(provided: string | null) {
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Constant-time compare, with a length guard since timingSafeEqual throws
  // on mismatched lengths.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { ok: false, error: "Not configured — set CRON_SECRET." },
      { status: 503 },
    );
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const header = request.headers.get("x-cron-secret");
  if (!secretMatches(bearer) && !secretMatches(header)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  // Drop the entry, then immediately read through so the next real visitor
  // gets a warm cache rather than paying for the refresh themselves.
  revalidateTag("public-stats");
  const stats = await getPublicStats();

  return Response.json({
    ok: true,
    live: stats.live,
    totalViews: stats.totalViews,
    viewsPerSecond: Number(stats.viewsPerSecond.toFixed(4)),
    asOf: new Date(stats.asOf).toISOString(),
  });
}
