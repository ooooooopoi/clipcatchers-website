import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { ticketSchema } from "@/lib/validations";
import { handleError, ok, unauthorized } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });

    return ok({ tickets });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = ticketSchema.parse(await request.json());

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: body.subject.trim(),
        priority: body.priority,
        messages: {
          create: { authorId: user.id, body: body.message.trim() },
        },
      },
    });

    if (body.fileIds?.length) {
      await prisma.fileAsset.updateMany({
        where: { id: { in: body.fileIds }, userId: user.id },
        data: { ticketId: ticket.id },
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Support ticket created",
        body: `We've got "${ticket.subject}" — expect a reply within one business day.`,
        link: `/support/${ticket.id}`,
      },
    });

    return ok({ ticket }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
