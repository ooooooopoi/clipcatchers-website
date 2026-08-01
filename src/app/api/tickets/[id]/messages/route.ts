import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { ticketReplySchema } from "@/lib/validations";
import { handleError, notFound, ok, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const ticket = await prisma.supportTicket.findFirst({ where: { id, userId: user.id } });
    if (!ticket) return notFound("Ticket not found.");

    const { body } = ticketReplySchema.parse(await request.json());

    const message = await prisma.ticketMessage.create({
      data: { ticketId: id, authorId: user.id, body: body.trim() },
      include: { author: { select: { name: true } } },
    });

    // A client reply reopens a resolved thread.
    await prisma.supportTicket.update({
      where: { id },
      data: { status: ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "OPEN" : ticket.status },
    });

    return ok({ message }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
