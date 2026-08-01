import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { deleteUpload } from "@/lib/storage";
import { handleError, notFound, ok, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const file = await prisma.fileAsset.findFirst({ where: { id, userId: user.id } });
    if (!file) return notFound("File not found.");

    await prisma.fileAsset.delete({ where: { id } });
    await deleteUpload(file.storageKey);

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
