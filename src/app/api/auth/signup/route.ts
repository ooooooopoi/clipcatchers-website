import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";
import { createToken, appUrl } from "@/lib/tokens";
import { mailConfigured, sendVerificationEmail } from "@/lib/mail";
import { badRequest, handleError, ok } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = signUpSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest("An account already exists for that email.");
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        company: body.company?.trim() || null,
        passwordHash: await bcrypt.hash(body.password, 12),
        settings: { create: {} },
      },
    });

    const token = await createToken(user.id, "EMAIL_VERIFICATION");
    const url = appUrl(`/verify-email?token=${token}`);
    await sendVerificationEmail(user.email, user.name, url);

    return ok(
      {
        success: true,
        // Only surfaced when SMTP is unset, so the flow is still completable.
        verificationUrl: mailConfigured ? undefined : url,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
