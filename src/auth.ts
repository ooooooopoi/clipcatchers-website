import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

class UnverifiedEmail extends CredentialsSignin {
  code = "unverified";
}

class InvalidCredentials extends CredentialsSignin {
  code = "credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) throw new InvalidCredentials();

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) throw new InvalidCredentials();
        if (!user.emailVerified) throw new UnverifiedEmail();

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          company: user.company,
        };
      },
    }),
  ],
});
