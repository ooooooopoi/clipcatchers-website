import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { consumeToken } from "@/lib/tokens";
import { badRequest, handleError, ok } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { token, password } = resetPasswordSchema.parse(await request.json());
    const record = await consumeToken(token, "PASSWORD_RESET");
    if (!record) return badRequest("This reset link is invalid or has expired.");

    await prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        // Resetting via emailed link proves the address works.
        emailVerified: record.user.emailVerified ?? new Date(),
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
