import type { FileKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { handleError, ok, unauthorized } from "@/lib/api";

const KINDS: FileKind[] = ["LOGO", "BRAND_KIT", "VIDEO", "IMAGE", "PDF", "ARCHIVE", "OTHER"];

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") as FileKind | null;
    const query = searchParams.get("query")?.trim();

    const where: Prisma.FileAssetWhereInput = {
      userId: user.id,
      ...(kind && KINDS.includes(kind) ? { kind } : {}),
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    };

    const files = await prisma.fileAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { id: true, name: true } } },
      take: 200,
    });

    return ok({
      files: files.map((f) => ({ ...f, url: `/api/files/${f.id}/raw` })),
    });
  } catch (error) {
    return handleError(error);
  }
}
