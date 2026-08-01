import type { NextAuthConfig } from "next-auth";
import "@/lib/env";

/**
 * Edge-safe half of the auth setup: no Prisma, no bcrypt. The middleware
 * imports this on its own; the full config in src/auth.ts adds the provider.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const signedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isAuthPage = ["/login", "/signup", "/forgot-password", "/reset-password"].some(
        (p) => pathname.startsWith(p),
      );

      if (isAuthPage) {
        if (signedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }
      return signedIn;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CLIENT";
        token.company = (user as { company?: string | null }).company ?? null;
        token.picture = user.image ?? null;
      }
      // Keeps the header avatar/name fresh after a Settings save.
      if (trigger === "update" && session) {
        const patch = session as { name?: string; image?: string | null; company?: string | null };
        if (patch.name) token.name = patch.name;
        if (patch.image !== undefined) token.picture = patch.image;
        if (patch.company !== undefined) token.company = patch.company;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.company = (token.company as string | null) ?? null;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
