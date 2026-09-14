import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Host-aware on top of the session gate: app.clipcatchers.net is the clipper
 * app's front door, and its root shows the app launcher instead of the
 * marketing homepage.
 *
 * A rewrite rather than a redirect, so the address bar keeps saying
 * app.clipcatchers.net — that address IS the product to a clipper, and
 * bouncing them to clipcatchers.net/app would teach them the wrong URL.
 *
 * Only `/` is special-cased. Every other path serves identically on either
 * host, which keeps DM'd /clipper/... links working wherever they're opened
 * and means nothing else needs to know the subdomain exists.
 */
export default auth((request) => {
  const host = request.headers.get("host") ?? "";
  const isAppHost = host === "app.clipcatchers.net" || host.startsWith("app.localhost");

  if (isAppHost && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.rewrite(url);
  }
});

export const config = {
  // Pages only. API routes guard themselves via getSessionUser() so they can
  // answer with a JSON 401 instead of redirecting a fetch to an HTML page.
  //
  // The extension list is a static-asset escape hatch and has to name every
  // type actually served out of public/. mp4 and webm were missing, so the
  // homepage clip videos were answered with a 307 to /login. That would not
  // have been reported as a bug: each <video> falls back to its poster, and a
  // poster is exactly what the belt looked like before it had any video.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
