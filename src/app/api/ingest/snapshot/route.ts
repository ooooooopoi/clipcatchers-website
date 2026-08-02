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
const schema = z.object({
  campaigns: z.array(z.record(z.string(), z.unknown())).max(500).optional(),
  clips: z.array(z.record(z.string(), z.unknown())).max(5000).optional(),
  clippers: z.array(z.record(z.string(), z.unknown())).max(2000).optional(),
  accounts: z.array(z.record(z.string(), z.unknown())).max(5000).optional(),
  invites: z.array(z.record(z.string(), z.unknown())).max(5000).optional(),
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
