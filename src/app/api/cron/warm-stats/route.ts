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
 * ── Who is allowed to call it ───────────────────────────────────────────
 * A shared secret, constant-time compared, because the caller is a service
 * and this costs two database queries.
 *
 * INGEST_SECRET is accepted as well as CRON_SECRET, and that is deliberate
 * rather than lazy. The bot is the scheduler here — this project is on
 * Vercel's hobby plan, where cron is capped at once a day, which is no use to
 * a figure that moves every second — and the bot already holds INGEST_SECRET
 * to push campaign data. Requiring a second secret would mean a new variable
 * in two places for an endpoint that refreshes a cache and returns numbers
 * already printed on the homepage. Either secret alone is enough to configure
 * it; CRON_SECRET stays supported so a real cron or an external pinger can be
 * added later without touching the bot.
 */
function matches(provided: string | null, expected: string | undefined) {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Constant-time compare, with a length guard since timingSafeEqual throws
  // on mismatched lengths.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const ingestSecret = process.env.INGEST_SECRET;
  if (!cronSecret && !ingestSecret) {
    return Response.json(
      { ok: false, error: "Not configured — set CRON_SECRET or INGEST_SECRET." },
      { status: 503 },
    );
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const authorised =
    matches(bearer, cronSecret) ||
    matches(request.headers.get("x-cron-secret"), cronSecret) ||
    matches(request.headers.get("x-ingest-secret"), ingestSecret);

  if (!authorised) {
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
