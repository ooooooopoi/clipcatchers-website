import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { handleError, notFound, ok, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    if (result.count === 0) return notFound("Notification not found.");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const result = await prisma.notification.deleteMany({ where: { id, userId: user.id } });
    if (result.count === 0) return notFound("Notification not found.");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
