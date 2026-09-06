import { timingSafeEqual } from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Receives a full mirror of the Discord bot's tables for the team view.
 * Stored as one JSON row rather than modelled relationally — it's read-only,
 * always replaced wholesale, and the bot's schema is free to change without
 * needing a migration here.
 */
/**
 * The caps guard against a runaway payload; they are not business limits, so
 * they sit far above anything real. The previous clips cap of 5,000 was passed
 * in ordinary operation and rejected the *entire* snapshot — one oversized
 * array is total failure for a whole-payload validator — and the team view
 * silently froze for a day. Anything that grows with usage needs headroom
 * measured in years.
 *
 * Unlisted keys are a second trap: z.object strips them rather than
 * complaining, so the bot sent `snapshots` for hours and it vanished on
 * arrival behind a 200. A new table on the bot has to be added here as well.
 */
const rows = (max: number) => z.array(z.record(z.string(), z.unknown())).max(max).optional();

const schema = z.object({
  campaigns: rows(5_000),
  clips: rows(200_000),
  clippers: rows(50_000),
  accounts: rows(50_000),
  invites: rows(50_000),
  snapshots: rows(200_000),
});

function secretMatches(provided: string | null) {
  const expected = process.env.INGEST_SECRET ?? "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    if (!process.env.INGEST_SECRET) {
      return badRequest("Ingest is not configured — set INGEST_SECRET.");
    }
    if (!secretMatches(request.headers.get("x-ingest-secret"))) {
      return unauthorized("Invalid ingest secret.");
    }

    const data = schema.parse(await request.json());

    // Validated above; Prisma's Json input type doesn't accept a plain object shape.
    const payload = data as unknown as Prisma.InputJsonObject;

    await prisma.botSnapshot.upsert({
      where: { id: "latest" },
      create: { id: "latest", data: payload },
      update: { data: payload },
    });

    return ok({
      stored: Object.fromEntries(
        Object.entries(data).map(([key, rows]) => [key, rows?.length ?? 0]),
      ),
    });
  } catch (error) {
    return handleError(error);
  }
}
