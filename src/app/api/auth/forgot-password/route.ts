import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { appUrl, createToken } from "@/lib/tokens";
import { mailConfigured, sendPasswordResetEmail } from "@/lib/mail";
import { handleError, ok } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Same response either way — don't leak which addresses have accounts.
    if (!user) return ok({ success: true });

    const token = await createToken(user.id, "PASSWORD_RESET");
    const url = appUrl(`/reset-password?token=${token}`);
    await sendPasswordResetEmail(user.email, user.name, url);

    return ok({ success: true, resetUrl: mailConfigured ? undefined : url });
  } catch (error) {
    return handleError(error);
  }
}
