import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  emailChangeSchema,
  notificationPrefsSchema,
  passwordChangeSchema,
  profileSchema,
} from "@/lib/validations";
import { badRequest, handleError, ok, unauthorized } from "@/lib/api";

const payloadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("profile") }).merge(profileSchema),
  z.object({ action: z.literal("password") }).merge(passwordChangeSchema),
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

    if (body.action === "password") {
      const account = await prisma.user.findUnique({ where: { id: user.id } });
      if (!account) return unauthorized();

      const valid = await bcrypt.compare(body.currentPassword, account.passwordHash);
      if (!valid) return badRequest("That current password isn't right.");

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(body.newPassword, 12) },
      });
      return ok({ success: true });
    }

    if (body.action === "email") {
      const account = await prisma.user.findUnique({ where: { id: user.id } });
      if (!account) return unauthorized();

      const valid = await bcrypt.compare(body.password, account.passwordHash);
      if (!valid) return badRequest("Confirm the change with your current password.");

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
