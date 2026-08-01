import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { handleError, ok, unauthorized } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const query = new URL(request.url).searchParams.get("q")?.trim();
    if (!query) return ok({ results: [] });

    const like = { contains: query, mode: "insensitive" as const };

    const [campaigns, files, invoices, tickets] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId: user.id, OR: [{ name: like }, { brandName: like }] },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.fileAsset.findMany({
        where: { userId: user.id, name: like },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { userId: user.id, OR: [{ number: like }, { description: like }] },
        take: 3,
        orderBy: { issuedAt: "desc" },
      }),
      prisma.supportTicket.findMany({
        where: { userId: user.id, subject: like },
        take: 3,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return ok({
      results: [
        ...campaigns.map((c) => ({
          id: c.id,
          type: "campaign" as const,
          title: c.name,
          subtitle: `${c.brandName} · ${c.status.toLowerCase()}`,
          href: `/campaigns/${c.id}`,
        })),
        ...files.map((f) => ({
          id: f.id,
          type: "file" as const,
          title: f.name,
          subtitle: f.kind.toLowerCase().replace("_", " "),
          href: "/files",
        })),
        ...invoices.map((i) => ({
          id: i.id,
          type: "invoice" as const,
          title: i.number,
          subtitle: i.description,
          href: "/billing",
        })),
        ...tickets.map((t) => ({
          id: t.id,
          type: "ticket" as const,
          title: t.subject,
          subtitle: `Ticket · ${t.status.toLowerCase()}`,
          href: `/support/${t.id}`,
        })),
      ],
    });
  } catch (error) {
    return handleError(error);
  }
}
