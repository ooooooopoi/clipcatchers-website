import { addMonths } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { PLAN_META } from "@/lib/constants";
import { handleError, ok, unauthorized } from "@/lib/api";

const planSchema = z.object({ plan: z.enum(["STARTER", "GROWTH", "SCALE"]) });

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const [account, invoices, paymentMethods] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, planRenewsAt: true },
      }),
      prisma.invoice.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } }),
      prisma.paymentMethod.findMany({ where: { userId: user.id } }),
    ]);

    return ok({ ...account, invoices, paymentMethods });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Changes the plan. With STRIPE_SECRET_KEY set this is where you'd create a
 * Checkout Session and return its URL; without it we switch the plan directly
 * and record the invoice so the flow is usable end to end.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { plan } = planSchema.parse(await request.json());
    const meta = PLAN_META[plan];
    const renewsAt = addMonths(new Date(), 1);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { plan, planRenewsAt: renewsAt },
      select: { plan: true, planRenewsAt: true },
    });

    const count = await prisma.invoice.count({ where: { userId: user.id } });
    await prisma.invoice.create({
      data: {
        userId: user.id,
        number: `CC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
        description: `${meta.label} plan — monthly subscription`,
        amountCents: meta.priceCents,
        status: "OPEN",
        dueAt: renewsAt,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: `Switched to the ${meta.label} plan`,
        body: `Your plan renews on ${renewsAt.toDateString()}.`,
        link: "/billing",
      },
    });

    return ok({ ...updated });
  } catch (error) {
    return handleError(error);
  }
}
