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

      // Reachable signed in or out: a new client clicks this link before they
      // have an account session, and bouncing them to /login would make the
      // address unverifiable.
      if (pathname.startsWith("/verify-email")) return true;

      // Shared campaign report. Access is proved by the signature in the URL,
      // not by a session — these links go to clients who have no account.
      if (pathname.startsWith("/c/")) return true;

      // Public marketing site. /quote is the front door for people who have
      // never heard of us — gating it behind a login would ask a stranger to
      // make an account before they're allowed to enquire.
      if (pathname === "/" || pathname.startsWith("/quote")) return true;

      // Internal team view, gated by the signature in the URL rather than a
      // session so it can be opened from Discord without an account.
      if (pathname.startsWith("/team/")) return true;

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
