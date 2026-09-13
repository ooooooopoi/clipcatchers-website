import { randomUUID } from "crypto";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

// Only offered when it's actually configured. Listing the provider without
// credentials gives a button that fails after the user has committed to it.
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * Discord sign-in, for clippers rather than clients.
 *
 * They are already in Discord, and the snowflake it hands back is the exact
 * key the bot uses for everything — clips.user_id, wallets.user_id, payouts.
 * So this identifies a clipper precisely, with no mapping table and no signed
 * link to DM them.
 *
 * The `identify` scope alone would not do: the User row needs an email, and
 * `email` is where that comes from.
 */
const discordEnabled = Boolean(
  process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
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
    ...(discordEnabled
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID,
            clientSecret: process.env.AUTH_DISCORD_SECRET,
            authorization: { params: { scope: "identify email" } },
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        // providerAccountId is the snowflake — the same number the bot keys
        // clips, wallets and payouts on. That is the whole reason this works
        // without a mapping table, so it is matched on before email.
        const discordId = account.providerAccountId;
        const email = user.email?.toLowerCase();
        if (!discordId || !email) {
          // Discord only returns an address when it is verified and the email
          // scope was granted. Without one there is no User row to make, since
          // email is required and unique.
          return false;
        }

        const byDiscord = await prisma.user.findUnique({ where: { discordId } });
        // Falls back to email so somebody who already has an account — a
        // client, or a clipper who signed up before this existed — links to it
        // rather than getting a second row and an empty balance.
        const existing =
          byDiscord ?? (await prisma.user.findUnique({ where: { email } }));

        const row =
          existing ??
          (await prisma.user.create({
            data: {
              email,
              discordId,
              name:
                (profile as { global_name?: string } | undefined)?.global_name ||
                user.name?.trim() ||
                email.split("@")[0],
              image: user.image ?? null,
              role: "CLIPPER",
              // No password was ever chosen. A random hash keeps the column
              // non-null while leaving the password path impossible until they
              // deliberately set one through reset.
              passwordHash: await bcrypt.hash(randomUUID(), 10),
              // Discord has already proved the address.
              emailVerified: new Date(),
            },
          }));

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              // Claim the snowflake if this row was found by email.
              discordId,
              emailVerified: existing.emailVerified ?? new Date(),
              // Deliberately does NOT touch role. An admin or a client who
              // happens to sign in with Discord keeps what they are — being
              // demoted to CLIPPER would lock them out of their own dashboard.
            },
          });
        }

        user.id = row.id;
        (user as { role?: string }).role = existing?.role ?? "CLIPPER";
        (user as { discordId?: string }).discordId = discordId;
        return true;
      }

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
