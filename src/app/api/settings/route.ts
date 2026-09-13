import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  emailChangeSchema,
  notificationPrefsSchema,
  profileSchema,
} from "@/lib/validations";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

// The "password" action is gone with password sign-in. Nothing issues or checks
// a password now — every row's hash is a random UUID minted at creation — so
// changing it altered a value no code path reads, and asking for the current
// one was a question nobody could answer.
const payloadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("profile") }).merge(profileSchema),
  z.object({ action: z.literal("email") }).merge(emailChangeSchema),
  z.object({ action: z.literal("notifications") }).merge(notificationPrefsSchema),
]);

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    });

    return ok({
      name: account?.name,
      email: account?.email,
      company: account?.company,
      image: account?.image,
      plan: account?.plan,
      settings: account?.settings,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = payloadSchema.parse(await request.json());

    if (body.action === "profile") {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: body.name.trim(),
          company: body.company?.trim() || null,
          image: body.image?.trim() || null,
        },
        select: { name: true, company: true, image: true },
      });
      return ok(updated);
    }

    if (body.action === "email") {
      const account = await prisma.user.findUnique({ where: { id: user.id } });
      if (!account) return unauthorized();

      // Confirmed by holding a valid session rather than by a password. Sign-in
      // is keyed on the Discord snowflake, so the email address is contact
      // detail rather than a credential — changing it hands nobody a way in.
      const email = body.email.toLowerCase();
      if (email !== account.email) {
        const taken = await prisma.user.findUnique({ where: { email } });
        if (taken) return badRequest("That email is already in use.");
      }

      await prisma.user.update({ where: { id: user.id }, data: { email } });
      return ok({ email });
    }

    const settings = await prisma.settings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        emailCampaignUpdates: body.emailCampaignUpdates,
        emailInvoices: body.emailInvoices,
        emailProductUpdates: body.emailProductUpdates,
        emailMarketing: body.emailMarketing,
      },
      update: {
        emailCampaignUpdates: body.emailCampaignUpdates,
        emailInvoices: body.emailInvoices,
        emailProductUpdates: body.emailProductUpdates,
        emailMarketing: body.emailMarketing,
      },
    });
    return ok({ settings });
  } catch (error) {
    return handleError(error);
  }
}
