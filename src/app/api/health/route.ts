import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Liveness, not readiness: a reachable app answers 200 even when the database
 * is down, so a bad DATABASE_URL produces a running app you can read errors
 * from instead of a deploy that fails with no visible cause. The database
 * state is reported in the body and logged for the platform logs.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "up" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[health] database unreachable:", message);
    return NextResponse.json({
      status: "ok",
      database: "down",
      hint: "Check DATABASE_URL and that migrations ran.",
      error: message.slice(0, 300),
    });
  }
}
