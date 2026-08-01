import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness only — this must answer 200 whenever the process is up, so a bad or
 * missing DATABASE_URL produces a running app you can read errors from instead
 * of a deploy that fails with nothing serving.
 *
 * Prisma is imported lazily on purpose: importing it at module scope means a
 * missing DATABASE_URL throws while the route is being loaded, which would 500
 * before any error handling here could run.
 */
export async function GET() {
  const body: Record<string, string> = { status: "ok", uptime: `${Math.round(process.uptime())}s` };

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    body.database = "up";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[health] database unreachable:", message);
    body.database = "down";
    body.hint = "Check DATABASE_URL, then confirm migrations ran.";
    body.error = message.replace(/\s+/g, " ").slice(0, 300);
  }

  return NextResponse.json(body);
}
