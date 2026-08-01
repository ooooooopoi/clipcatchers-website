import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { handleError, notFound, ok, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["OPEN", "PENDING", "RESOLVED", "CLOSED"]),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
        attachments: true,
      },
    });
    if (!ticket) return notFound("Ticket not found.");

    return ok({ ticket });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const { status } = patchSchema.parse(await request.json());

    const result = await prisma.supportTicket.updateMany({
      where: { id, userId: user.id },
      data: { status },
    });
    if (result.count === 0) return notFound("Ticket not found.");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
