import { randomUUID } from "crypto";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

// Only offered when it's actually configured. Listing the provider without
// credentials gives a button that fails after the user has committed to it.
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

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
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Google hands back its own account id, but everything downstream — the
     * JWT, campaigns, the client report — is keyed on our user row. So the
     * row is found or created here and the id swapped for ours before the
     * token is minted.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      const row =
        existing ??
        (await prisma.user.create({
          data: {
            email,
            name: user.name?.trim() || email.split("@")[0],
            image: user.image ?? null,
            // Signing in with Google means no password was ever chosen. A
            // random hash keeps the column non-null while making the password
            // path impossible until they deliberately set one via reset.
            passwordHash: await bcrypt.hash(randomUUID(), 10),
            // Google has already proved the address, so there's nothing for
            // our own verification email to add.
            emailVerified: new Date(),
          },
        }));

      if (existing && !existing.emailVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date() },
        });
      }

      user.id = row.id;
      (user as { role?: string }).role = row.role;
      (user as { company?: string | null }).company = row.company;
      return true;
    },
  },
});
