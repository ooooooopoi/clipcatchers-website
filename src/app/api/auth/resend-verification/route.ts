import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { appUrl, createToken } from "@/lib/tokens";
import { mailConfigured, sendVerificationEmail } from "@/lib/mail";
import { handleError, ok } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || user.emailVerified) return ok({ success: true });

    const token = await createToken(user.id, "EMAIL_VERIFICATION");
    const url = appUrl(`/verify-email?token=${token}`);
    await sendVerificationEmail(user.email, user.name, url);

    return ok({ success: true, verificationUrl: mailConfigured ? undefined : url });
  } catch (error) {
    return handleError(error);
  }
}
