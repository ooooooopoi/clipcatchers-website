import type { NextAuthConfig } from "next-auth";
import "@/lib/env";

/**
 * Whether this deployment answers on clipcatchers.net — and therefore also on
 * app.clipcatchers.net, which shares its sessions.
 *
 * Guarded rather than unconditional because a cookie domain that doesn't match
 * the serving host is silently dropped by the browser: applying
 * .clipcatchers.net on localhost or a vercel.app preview wouldn't degrade
 * sign-in, it would delete it.
 */
const SHARED_COOKIE_DOMAIN = (process.env.AUTH_URL ?? "").includes("clipcatchers.net")
  ? ".clipcatchers.net"
  : undefined;

const COOKIE_FLAGS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: true,
  domain: SHARED_COOKIE_DOMAIN,
} as const;

/**
 * Edge-safe half of the auth setup: no Prisma, no bcrypt. The middleware
 * imports this on its own; the full config in src/auth.ts adds the provider.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [],

  // ── One session across clipcatchers.net and app.clipcatchers.net ────────
  // Every auth cookie is widened to the parent domain, not just the session:
  // the OAuth dance starts on whichever host the clipper pressed the button
  // on, but Discord only redirects back to the apex callback. The state and
  // PKCE cookies written at the start must be readable at that callback, or
  // a sign-in begun on the app subdomain dies there with a state mismatch —
  // which looks like Discord being broken, not like a cookie scope.
  //
  // The CSRF cookie is renamed as well as widened: its default name carries
  // the __Host- prefix, and browsers refuse to store a __Host- cookie that
  // sets a Domain at all. Keeping the default name would again mean the
  // cookie silently never exists.
  ...(SHARED_COOKIE_DOMAIN
    ? {
        cookies: {
          sessionToken: {
            name: "__Secure-authjs.session-token",
            options: COOKIE_FLAGS,
          },
          callbackUrl: {
            name: "__Secure-authjs.callback-url",
            options: { ...COOKIE_FLAGS, httpOnly: false },
          },
          csrfToken: {
            name: "__Secure-authjs.csrf-token",
            options: COOKIE_FLAGS,
          },
          state: {
            name: "__Secure-authjs.state",
            options: { ...COOKIE_FLAGS, maxAge: 900 },
          },
          pkceCodeVerifier: {
            name: "__Secure-authjs.pkce.code_verifier",
            options: { ...COOKIE_FLAGS, maxAge: 900 },
          },
        },
      }
    : {}),
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

      // The app subdomain's front door — app.clipcatchers.net/ rewrites here.
      // It has to be reachable signed out, since its whole job is to offer the
      // sign-in. Exact match, not a prefix: startsWith("/app") would also
      // open /apple-touch-icon and anything else that happens to share the
      // letters.
      if (pathname === "/app") return true;

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
        // Search Console verification files. Google fetches these signed out
        // and expects the token echoed back verbatim; a 307 to /login reads to
        // it as "the file isn't there", and verification fails without saying
        // why. Matched by shape rather than one filename, because the token
        // changes if a property is re-verified — and the file contains nothing
        // but its own name, so there is nothing here to protect.
        /^\/google[0-9a-f]{16}\.html$/.test(pathname) ||
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

      // Just /login now. Signup, forgot-password and reset-password went with
      // the password provider — sign-in is OAuth only.
      const isAuthPage = pathname.startsWith("/login");

      if (isAuthPage) {
        if (signedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }
      return signedIn;
    },
    /**
     * Where a completed sign-in may land. The default allows the apex only,
     * which would strand a sign-in that started on app.clipcatchers.net: the
     * callback happens on the apex, and the return to the app subdomain is a
     * cross-origin URL the default refuses — so the clipper who signed in on
     * the app would be quietly delivered to the marketing site instead.
     *
     * Allowed: clipcatchers.net and its subdomains, https only. The check
     * runs on URL-parsed hostnames rather than on the raw string, so a
     * crafted value like https://clipcatchers.net.attacker.example can't
     * pass by containing our name — its parsed hostname ends in
     * .attacker.example, not .clipcatchers.net.
     */
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        const home = new URL(baseUrl);
        const ours =
          target.hostname === home.hostname ||
          target.hostname === "clipcatchers.net" ||
          target.hostname.endsWith(".clipcatchers.net");
        if (ours && target.protocol === "https:") return url;
      } catch {
        // Fall through to baseUrl — an unparseable callbackUrl is not a
        // reason to break the sign-in that carried it.
      }
      return baseUrl;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CLIENT";
        token.company = (user as { company?: string | null }).company ?? null;
        token.picture = user.image ?? null;
        // Carried so /me can find a clipper's clips without another query.
        // It is the bot's key for everything they own — see User.discordId.
        token.discordId = (user as { discordId?: string }).discordId ?? null;
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
        session.user.discordId = (token.discordId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
