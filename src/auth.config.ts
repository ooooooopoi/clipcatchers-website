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

      // A clipper's own earnings page, on the same terms. Clippers live in
      // Discord and have no account here at all, so a session check bounces
      // every one of them to a login they can never satisfy. The signature in
      // the path is the credential, and the page checks it again before it
      // reads anything.
      if (pathname.startsWith("/clipper/")) return true;

      // ── The public marketing site ───────────────────────────────────────
      // Everything under / needs a session by default, so a marketing page
      // missing from this list does not 404 — it 307s to /login, which reads
      // as a broken page rather than a missing one. That has already happened
      // once here, to /clipper, and it stayed invisible until someone checked
      // a status code instead of looking at the page.
      //
      // Deliberately spelled out rather than derived from lib/marketing-nav.
      // This file is bundled into the edge middleware and runs on every
      // request; that module imports lib/use-cases, which imports
      // lucide-react, and a React icon library has no business in an edge
      // bundle. The duplication is the cheaper of the two costs.
      //
      // The way to catch drift is to request every path in
      // marketing-nav.allMarketingPaths() and assert 200 — not to open the
      // pages and look at them, because a 307 to /login renders a perfectly
      // good page and tells you nothing.
      const PUBLIC_PREFIXES = [
        // The front door for people who have never heard of us — gating it
        // would ask a stranger to make an account before they may enquire.
        "/launch",
        // The old path, kept open so the 301 in next.config lands rather than
        // being intercepted here. Links already sent in DMs point at it and
        // there's no way back to edit them.
        "/quote",
        // Privacy and terms. Linked from the public footer and the first
        // thing a brand's legal or procurement step opens — a login in front
        // of them is how a deal quietly stalls.
        "/legal",
        // A sign-in wall on the page a prospect clicks to check our numbers
        // is the worst possible place for one.
        "/case-studies",
        // The subject pages, for the same reason as everything above: they
        // exist to be found by someone who has never heard of us.
        "/how-it-works",
        "/use-cases",
        "/pricing",
        "/verification",
        "/results",
        "/for-creators",
        // The blog exists to be found by someone searching the category, so a
        // sign-in wall in front of it defeats the entire point of writing it.
        "/blog",
      ];

      if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
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
