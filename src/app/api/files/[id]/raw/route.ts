import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { uploadExists, uploadPath } from "@/lib/storage";
import { handleError, notFound, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Streams an asset back, but only to the account that owns it. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const file = await prisma.fileAsset.findFirst({ where: { id, userId: user.id } });
    if (!file || !uploadExists(file.storageKey)) return notFound("File not found.");

    const data = await readFile(uploadPath(file.storageKey));
    const download = new URL(request.url).searchParams.get("download") === "1";

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(
          file.name,
        )}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
