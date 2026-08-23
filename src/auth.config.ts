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

      // Public marketing site. /launch is the front door for people who have
      // never heard of us — gating it behind a login would ask a stranger to
      // make an account before they're allowed to enquire.
      //
      // /quote is the old path, kept open so the 301 in next.config lands
      // rather than being intercepted here. Links already sent in DMs point at
      // it and there's no way to go back and edit them.
      if (
        pathname === "/" ||
        pathname.startsWith("/launch") ||
        pathname.startsWith("/quote") ||
        // Privacy and terms. These are linked from the public footer and are
        // the first thing a brand's legal or procurement step opens — putting
        // a login in front of them is how a deal quietly stalls.
        pathname.startsWith("/legal")
      ) {
        return true;
      }

      // Crawler and link-preview files. These were being bounced to /login,
      // which silently defeats the point of having them: Google got a sign-in
      // page instead of the sitemap, and every link pasted into Discord, X or
      // iMessage asked the unfurler to authenticate and so rendered blank.
      // None of them expose anything private.
      if (
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/favicon.ico" ||
        // Route-generated OG and Twitter images, at the root or nested under a
        // public page. Next appends a cache-busting suffix in production, so
        // this matches the segment rather than the exact path.
        /(^|\/)(opengraph-image|twitter-image)(-[\w-]+)?\/?$/.test(pathname)
      ) {
        return true;
      }

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
