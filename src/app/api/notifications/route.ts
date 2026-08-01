import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { handleError, ok, unauthorized } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const take = Math.min(50, Number(new URL(request.url).searchParams.get("take") ?? 20));

    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take,
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return ok({ notifications, unread });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => ({}))) as { all?: boolean; ids?: string[] };

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
        ...(body.ids?.length ? { id: { in: body.ids } } : {}),
      },
      data: { read: true },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    await prisma.notification.deleteMany({ where: { userId: user.id, read: true } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
